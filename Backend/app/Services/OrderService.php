<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Exceptions\ApiException;
use Google\Cloud\Firestore\FirestoreClient;
use Google\Cloud\Firestore\Transaction;
use Illuminate\Support\Str;

class OrderService
{
    public function __construct(private FirestoreClient $db)
    {
    }

    /**
     * @param array<string,mixed> $in validated checkout payload; items[] = {productId, qty, unitPriceCents}
     * @return array<string,mixed> the saved order
     */
    public function place(array $in): array
    {
        $lines = $this->mergeLines($in['items']);
        $orderNumber = $this->newOrderNumber();
        $now = gmdate('c');
        $nowMicro = (int) round(microtime(true) * 1_000_000); // sort key: createdAt only has 1-second precision

        return $this->db->runTransaction(function (Transaction $t) use ($in, $lines, $orderNumber, $now, $nowMicro) {
            $productsCol = $this->db->collection('products');
            $orderRef = $this->db->collection('orders')->document($orderNumber);

            // --- all reads first (Firestore requirement) ---
            $snaps = [];
            foreach ($lines as $productId => $line) {
                $snaps[$productId] = $t->snapshot($productsCol->document($productId));
            }
            if ($t->snapshot($orderRef)->exists()) {
                throw new ApiException('ORDER_NUMBER_CLASH', 'Please try placing the order again.', 409);
            }

            // --- verify against authoritative data ---
            $changes = [];
            $items = [];
            $total = 0;

            foreach ($lines as $productId => $line) {
                $snap = $snaps[$productId];
                $qty = $line['qty'];

                if (!$snap->exists() || empty($snap->data()['isActive'])) {
                    $changes[] = [
                        'productId' => $productId,
                        'type' => 'UNAVAILABLE',
                        'name' => $snap->exists() ? $snap->data()['name'] : 'Unknown product'
                    ];
                    continue;
                }

                $p = $snap->data();
                $price = (int) $p['priceCents'];
                $stock = (int) $p['stock'];

                if ($stock === 0) {
                    $changes[] = ['productId' => $productId, 'type' => 'OUT_OF_STOCK', 'name' => $p['name']];
                    continue;
                }
                if ($qty > $stock) {
                    $changes[] = [
                        'productId' => $productId,
                        'type' => 'INSUFFICIENT_STOCK',
                        'name' => $p['name'],
                        'availableStock' => $stock,
                        'requestedQty' => $qty
                    ];
                    continue;
                }
                if ($line['expectedPriceCents'] !== $price) {
                    $changes[] = [
                        'productId' => $productId,
                        'type' => 'PRICE_CHANGED',
                        'name' => $p['name'],
                        'oldPriceCents' => $line['expectedPriceCents'],
                        'newPriceCents' => $price
                    ];
                    continue;
                }

                $lineTotal = $price * $qty;
                $total += $lineTotal;
                $items[] = [
                    'productId' => $productId,
                    'name' => $p['name'],            // snapshot: later product edits never change this
                    'unitPriceCents' => $price,      // snapshot
                    'qty' => $qty,
                    'lineTotalCents' => $lineTotal,
                ];
            }

            if ($changes) {
                // Nothing has been written yet, so there is nothing to undo.
                throw new ApiException(
                    'CART_CHANGED',
                    'Some items changed since you added them. Please review your cart and try again.',
                    409,
                    ['changes' => $changes]
                );
            }

            // --- writes ---
            foreach ($items as $item) {
                $stockNow = (int) $snaps[$item['productId']]->data()['stock'];
                $newStock = $stockNow - $item['qty'];
                if ($newStock < 0) { // defensive: stock never goes below zero
                    throw new ApiException('CART_CHANGED', 'Stock changed. Please review your cart.', 409);
                }
                $t->update($productsCol->document($item['productId']), [
                    ['path' => 'stock', 'value' => $newStock],
                    ['path' => 'updatedAt', 'value' => $now],
                ]);
            }

            $order = [
                'orderNumber' => $orderNumber,
                'customerName' => trim($in['customerName']),
                'email' => trim($in['email']),
                'emailNormalized' => mb_strtolower(trim($in['email'])),
                'phone' => trim($in['phone']),
                'address' => trim($in['address']),
                'paymentMethod' => $in['paymentMethod'],
                'notes' => trim((string) ($in['notes'] ?? '')),
                'status' => OrderStatus::Pending->value,
                'items' => $items,
                'productIds' => array_column($items, 'productId'), // used for "is this product referenced?"
                'subtotalCents' => $total,
                'totalCents' => $total, // no shipping/tax/vouchers in this assessment
                'stockRestored' => false, // second guard so cancellation restores stock exactly once
                'createdAt' => $now,
                'createdAtMicro' => $nowMicro,
                'updatedAt' => $now,
            ];
            $t->create($orderRef, $order); // create() fails if the id already exists

            return $this->present($order);
        });
    }

    public function updateStatus(string $orderNumber, string $target): array
    {
        $to = OrderStatus::tryFrom($target);
        if (!$to) {
            throw new ApiException('VALIDATION', 'Unknown status.', 422);
        }

        return $this->db->runTransaction(function (Transaction $t) use ($orderNumber, $to) {
            $orderRef = $this->db->collection('orders')->document($orderNumber);
            $snap = $t->snapshot($orderRef);
            if (!$snap->exists()) {
                throw new ApiException('NOT_FOUND', 'Order not found.', 404);
            }
            $order = $snap->data();
            $from = OrderStatus::from($order['status']);

            if (!$from->canTransitionTo($to)) {
                $allowed = array_map(fn($s) => $s->value, $from->allowedNext());
                throw new ApiException(
                    'INVALID_TRANSITION',
                    $from->isFinal()
                    ? "Order is {$from->value} and can no longer change."
                    : "Cannot change status from {$from->value} to {$to->value}. Allowed: " . implode(', ', $allowed) . '.',
                    422,
                    ['allowed' => $allowed]
                );
            }

            $productsCol = $this->db->collection('products');
            $restoreStock = $to === OrderStatus::Cancelled;

            // reads before writes
            $productSnaps = [];
            if ($restoreStock) {
                if (!empty($order['stockRestored'])) {
                    throw new ApiException('ALREADY_RESTORED', 'Stock for this order was already restored.', 422);
                }
                foreach ($order['items'] as $item) {
                    $productSnaps[$item['productId']] = $t->snapshot($productsCol->document($item['productId']));
                }
            }

            $now = gmdate('c');
            if ($restoreStock) {
                foreach ($order['items'] as $item) {
                    $ps = $productSnaps[$item['productId']];
                    if ($ps->exists()) {
                        $t->update($productsCol->document($item['productId']), [
                            ['path' => 'stock', 'value' => (int) $ps->data()['stock'] + (int) $item['qty']],
                            ['path' => 'updatedAt', 'value' => $now],
                        ]);
                    }
                }
            }

            $updates = [
                ['path' => 'status', 'value' => $to->value],
                ['path' => 'updatedAt', 'value' => $now],
            ];
            if ($restoreStock) {
                $updates[] = ['path' => 'stockRestored', 'value' => true];
            }
            $t->update($orderRef, $updates);

            $order['status'] = $to->value;
            $order['updatedAt'] = $now;
            $order['stockRestored'] = $restoreStock ?: ($order['stockRestored'] ?? false);

            return $this->present($order);
        });
    }

    /** @return list<array<string,mixed>> newest first */
    public function list(): array
    {
        $raw = $this->allRaw();
        usort($raw, fn($a, $b) => self::sortKey($b) <=> self::sortKey($a)); // sort BEFORE the sort key is stripped

        return array_map(fn($o) => $this->present($o), $raw);
    }

    public function find(string $orderNumber): array
    {
        $snap = $this->db->collection('orders')->document($orderNumber)->snapshot();
        if (!$snap->exists()) {
            throw new ApiException('NOT_FOUND', 'Order not found.', 404);
        }

        return $this->present($snap->data());
    }

    /** @return list<array<string,mixed>> */
    public function allRaw(): array
    {
        $out = [];
        foreach ($this->db->collection('orders')->documents()->rows() as $s) {
            if ($s->exists()) {
                $out[] = $s->data();
            }
        }

        return $out;
    }

    /** Creation time in microseconds, so orders placed in the same second still sort correctly. */
    public static function sortKey(array $o): int
    {
        return (int) ($o['createdAtMicro'] ?? 0) ?: (int) strtotime($o['createdAt'] ?? 'now') * 1_000_000;
    }

    private function present(array $o): array
    {
        unset($o['productIds'], $o['createdAtMicro']);
        $o['allowedNext'] = array_map(
            fn($s) => $s->value,
            OrderStatus::from($o['status'])->allowedNext()
        );

        return $o;
    }

    /**
     * Merge duplicate product lines (sum quantities).
     *
     * @param list<array{productId:string,qty:int,unitPriceCents:int}> $items
     * @return array<string,array{qty:int,expectedPriceCents:int}>
     */
    private function mergeLines(array $items): array
    {
        $merged = [];
        foreach ($items as $i) {
            $id = $i['productId'];
            $merged[$id] ??= ['qty' => 0, 'expectedPriceCents' => (int) $i['unitPriceCents']];
            $merged[$id]['qty'] += (int) $i['qty'];
        }

        return $merged;
    }

    private function newOrderNumber(): string
    {
        return 'UCV-' . gmdate('Ymd') . '-' . strtoupper(Str::random(5));
    }
}
