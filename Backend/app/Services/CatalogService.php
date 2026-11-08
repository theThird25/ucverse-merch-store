<?php

namespace App\Services;

use App\Exceptions\ApiException;
use Google\Cloud\Firestore\FirestoreClient;

class CatalogService
{
    public function __construct(private FirestoreClient $db)
    {
    }

    /** @return list<array<string,mixed>> every doc in a collection, with its id */
    public function all(string $collection): array
    {
        $out = [];
        foreach ($this->db->collection($collection)->documents()->rows() as $snap) {
            if ($snap->exists()) {
                $out[] = ['id' => $snap->id()] + $snap->data();
            }
        }

        return $out;
    }

    // ------------------------------------------------------------ categories

    public function categories(): array
    {
        $counts = [];
        foreach ($this->all('products') as $p) {
            $counts[$p['categoryId']] = ($counts[$p['categoryId']] ?? 0) + 1;
        }

        $cats = array_map(fn($c) => [
            'id' => $c['id'],
            'name' => $c['name'],
            'productCount' => $counts[$c['id']] ?? 0,
        ], $this->all('categories'));

        usort($cats, fn($a, $b) => strcasecmp($a['name'], $b['name']));

        return $cats;
    }

    public function createCategory(string $name): array
    {
        $name = trim($name);
        $this->assertCategoryNameFree($name);

        $ref = $this->db->collection('categories')->newDocument();
        $ref->set(['name' => $name, 'nameLower' => mb_strtolower($name), 'createdAt' => gmdate('c')]);

        return ['id' => $ref->id(), 'name' => $name, 'productCount' => 0];
    }

    public function updateCategory(string $id, string $name): array
    {
        $name = trim($name);
        $ref = $this->db->collection('categories')->document($id);
        if (!$ref->snapshot()->exists()) {
            throw new ApiException('NOT_FOUND', 'Category not found.', 404);
        }
        $this->assertCategoryNameFree($name, $id);

        $ref->update([
            ['path' => 'name', 'value' => $name],
            ['path' => 'nameLower', 'value' => mb_strtolower($name)],
        ]);

        return ['id' => $id, 'name' => $name];
    }

    public function deleteCategory(string $id): void
    {
        $ref = $this->db->collection('categories')->document($id);
        if (!$ref->snapshot()->exists()) {
            throw new ApiException('NOT_FOUND', 'Category not found.', 404);
        }

        foreach ($this->all('products') as $p) {
            if ($p['categoryId'] === $id) {
                throw new ApiException(
                    'CATEGORY_IN_USE',
                    'This category still has products assigned to it. Move or delete those products first.',
                    409
                );
            }
        }

        $ref->delete();
    }

    /** Firestore has no unique constraint, so duplicates (ignoring case) are checked here. */
    private function assertCategoryNameFree(string $name, ?string $exceptId = null): void
    {
        if ($name === '') {
            throw new ApiException('VALIDATION', 'Category name is required.', 422);
        }
        foreach ($this->all('categories') as $c) {
            if ($c['id'] !== $exceptId && mb_strtolower($c['name']) === mb_strtolower($name)) {
                throw new ApiException('DUPLICATE_CATEGORY', 'A category with this name already exists.', 422);
            }
        }
    }

    // -------------------------------------------------------------- products

    /** @return array<string,string> categoryId => name */
    private function categoryNames(): array
    {
        $map = [];
        foreach ($this->all('categories') as $c) {
            $map[$c['id']] = $c['name'];
        }

        return $map;
    }

    /** Shape sent to the browser. */
    private function toDto(array $p, array $names): array
    {
        return [
            'id' => $p['id'],
            'name' => $p['name'],
            'categoryId' => $p['categoryId'],
            'categoryName' => $names[$p['categoryId']] ?? 'Uncategorised',
            'description' => $p['description'] ?? '',
            'priceCents' => (int) $p['priceCents'],
            'stock' => (int) $p['stock'],
            'isActive' => (bool) $p['isActive'],
            'imageUrl' => $p['imageUrl'] ?? '',
            // Derived, never stored: an active product with zero stock is Out of Stock.
            'inStock' => (int) $p['stock'] > 0,
        ];
    }

    /**
     * Customer listing: ACTIVE products only. Search, category and sort combine.
     *
     * @param array{q?:?string,category?:?string,sort?:?string} $f
     */
    public function publicProducts(array $f): array
    {
        $names = $this->categoryNames();
        $rows = array_filter($this->all('products'), fn($p) => !empty($p['isActive']));

        $q = trim((string) ($f['q'] ?? ''));
        if ($q !== '') {
            $rows = array_filter($rows, fn($p) => mb_stripos($p['name'], $q) !== false);
        }
        if (!empty($f['category'])) {
            $rows = array_filter($rows, fn($p) => $p['categoryId'] === $f['category']);
        }

        $rows = array_map(fn($p) => $this->toDto($p, $names), array_values($rows));

        match ($f['sort'] ?? null) {
            'price_asc' => usort($rows, fn($a, $b) => $a['priceCents'] <=> $b['priceCents']),
            'price_desc' => usort($rows, fn($a, $b) => $b['priceCents'] <=> $a['priceCents']),
            default => usort($rows, fn($a, $b) => strcasecmp($a['name'], $b['name'])),
        };

        return $rows;
    }

    /** @return array{product:array,related:list<array>} */
    public function publicProduct(string $id): array
    {
        $snap = $this->db->collection('products')->document($id)->snapshot();

        // Inactive products behave exactly like missing ones, even through a direct link.
        if (!$snap->exists() || empty($snap->data()['isActive'])) {
            throw new ApiException('NOT_FOUND', 'This product is not available.', 404);
        }

        $names = $this->categoryNames();
        $product = $this->toDto(['id' => $id] + $snap->data(), $names);

        $related = array_filter($this->all('products'), fn($p) => !empty($p['isActive'])
            && $p['id'] !== $id
            && $p['categoryId'] === $product['categoryId']);
        $related = array_map(fn($p) => $this->toDto($p, $names), array_slice(array_values($related), 0, 3));

        return ['product' => $product, 'related' => $related];
    }

    /**
     * Admin listing: ALL products, including inactive ones.
     *
     * @param array{q?:?string,category?:?string,status?:?string} $f status: active | inactive | out_of_stock
     */
    public function adminProducts(array $f): array
    {
        $names = $this->categoryNames();
        $rows = $this->all('products');

        $q = trim((string) ($f['q'] ?? ''));
        if ($q !== '') {
            $rows = array_filter($rows, fn($p) => mb_stripos($p['name'], $q) !== false);
        }
        if (!empty($f['category'])) {
            $rows = array_filter($rows, fn($p) => $p['categoryId'] === $f['category']);
        }
        $rows = match ($f['status'] ?? null) {
            'active' => array_filter($rows, fn($p) => !empty($p['isActive'])),
            'inactive' => array_filter($rows, fn($p) => empty($p['isActive'])),
            'out_of_stock' => array_filter($rows, fn($p) => !empty($p['isActive']) && (int) $p['stock'] === 0),
            default => $rows,
        };

        $out = array_map(fn($p) => $this->toDto($p, $names), array_values($rows));
        usort($out, fn($a, $b) => strcasecmp($a['name'], $b['name']));

        return $out;
    }

    public function adminProduct(string $id): array
    {
        $snap = $this->db->collection('products')->document($id)->snapshot();
        if (!$snap->exists()) {
            throw new ApiException('NOT_FOUND', 'Product not found.', 404);
        }

        return $this->toDto(['id' => $id] + $snap->data(), $this->categoryNames());
    }

    /** @param array<string,mixed> $d already validated */
    public function createProduct(array $d): array
    {
        $this->assertCategoryExists($d['categoryId']);

        $ref = $this->db->collection('products')->newDocument();
        $ref->set($this->productRecord($d) + ['createdAt' => gmdate('c')]);

        return $this->adminProduct($ref->id());
    }

    /** @param array<string,mixed> $d already validated */
    public function updateProduct(string $id, array $d): array
    {
        $ref = $this->db->collection('products')->document($id);
        if (!$ref->snapshot()->exists()) {
            throw new ApiException('NOT_FOUND', 'Product not found.', 404);
        }
        $this->assertCategoryExists($d['categoryId']);

        $updates = [];
        foreach ($this->productRecord($d) as $path => $value) {
            $updates[] = ['path' => $path, 'value' => $value];
        }
        $ref->update($updates);

        return $this->adminProduct($id);
    }

    public function deleteProduct(string $id): void
    {
        $ref = $this->db->collection('products')->document($id);
        if (!$ref->snapshot()->exists()) {
            throw new ApiException('NOT_FOUND', 'Product not found.', 404);
        }

        // Preserve order history: a product that appears on any order cannot be hard-deleted.
        foreach ($this->all('orders') as $order) {
            if (in_array($id, $order['productIds'] ?? [], true)) {
                throw new ApiException(
                    'PRODUCT_REFERENCED',
                    'This product appears on existing orders and cannot be deleted. Mark it as Inactive instead.',
                    409,
                    ['canDeactivate' => true]
                );
            }
        }

        $ref->delete();
    }

    private function assertCategoryExists(string $categoryId): void
    {
        if (!$this->db->collection('categories')->document($categoryId)->snapshot()->exists()) {
            throw new ApiException('VALIDATION', 'Selected category does not exist.', 422);
        }
    }

    /** @param array<string,mixed> $d */
    private function productRecord(array $d): array
    {
        return [
            'name' => trim($d['name']),
            'categoryId' => $d['categoryId'],
            'description' => trim((string) ($d['description'] ?? '')),
            'priceCents' => (int) $d['priceCents'],
            'stock' => (int) $d['stock'],
            'isActive' => (bool) $d['isActive'],
            'imageUrl' => trim((string) ($d['imageUrl'] ?? '')),
            'updatedAt' => gmdate('c'),
        ];
    }

    // ------------------------------------------------------------------ cart

    /**
     * Resolve cart lines ({productId, qty}) against live data.
     * Price and stock always come from Firestore, never from the browser.
     *
     * @param list<array{productId:string,qty:int}> $items
     * @return array{lines:list<array<string,mixed>>,totalCents:int,hasIssues:bool}
     */
    public function resolveCart(array $items): array
    {
        $lines = [];
        $total = 0;
        $hasIssues = false;

        foreach ($items as $item) {
            $snap = $this->db->collection('products')->document($item['productId'])->snapshot();
            $qty = (int) $item['qty'];

            if (!$snap->exists() || empty($snap->data()['isActive'])) {
                $lines[] = [
                    'productId' => $item['productId'],
                    'name' => 'Unavailable product',
                    'imageUrl' => '',
                    'unitPriceCents' => 0,
                    'stock' => 0,
                    'qty' => $qty,
                    'lineTotalCents' => 0,
                    'issue' => 'UNAVAILABLE',
                ];
                $hasIssues = true;
                continue;
            }

            $d = $snap->data();
            $stock = (int) $d['stock'];
            $issue = $stock === 0 ? 'OUT_OF_STOCK' : ($qty > $stock ? 'INSUFFICIENT_STOCK' : null);
            $lineTotal = (int) $d['priceCents'] * $qty;

            $lines[] = [
                'productId' => $item['productId'],
                'name' => $d['name'],
                'imageUrl' => $d['imageUrl'] ?? '',
                'unitPriceCents' => (int) $d['priceCents'],
                'stock' => $stock,
                'qty' => $qty,
                'lineTotalCents' => $lineTotal,
                'issue' => $issue,
            ];

            if ($issue === null) {
                $total += $lineTotal;
            } else {
                $hasIssues = true;
            }
        }

        return ['lines' => $lines, 'totalCents' => $total, 'hasIssues' => $hasIssues];
    }
}
