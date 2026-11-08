<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Services\CatalogService;
use App\Services\OrderService;
use App\Support\Money;
use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Console\Command;

class SeedStore extends Command
{
    protected $signature = 'store:seed {--orders : Also create sample orders} {--keep : Do not wipe existing data first}';

    protected $description = 'Reset Firestore and load the UCverse Merch Store sample categories, products and (optionally) orders.';

    public function handle(FirestoreClient $db, CatalogService $catalog, OrderService $orders): int
    {
        if (!$this->option('keep')) {
            foreach (['orders', 'products', 'categories'] as $col) {
                foreach ($db->collection($col)->documents()->rows() as $doc) {
                    $doc->reference()->delete();
                }
            }
            $this->info('Existing data wiped.');
        }

        $cats = [];
        foreach (['Apparel', 'Accessories', 'Campus Essentials'] as $name) {
            $cats[$name] = $catalog->createCategory($name)['id'];
        }

        // [name, category, price (PHP), stock, active, image slug, description]
        $products = [
            ['UCverse Classic Tee', 'Apparel', '450.00', 40, true, 'classic-tee', 'Soft cotton tee with the UCverse mark on the chest. Unisex fit.'],
            ['UCverse Pullover Hoodie', 'Apparel', '1250.00', 0, true, 'pullover-hoodie', 'Heavyweight fleece hoodie. Currently out of stock.'],
            ['UCverse Varsity Jacket', 'Apparel', '1890.00', 8, true, 'varsity-jacket', 'Lightweight zip jacket for air-conditioned classrooms.'],
            ['UCverse Cap', 'Apparel', '299.00', 25, true, 'cap', 'Six-panel cotton cap with an embroidered mark.'],
            ['Limited Intramurals Jersey (discontinued)', 'Apparel', '650.00', 5, false, 'jersey', 'Discontinued item kept inactive to demonstrate hidden listings.'],
            ['UCverse Lanyard', 'Accessories', '120.00', 80, true, 'lanyard', 'Woven lanyard with a clip for your school ID.'],
            ['UCverse Sticker Pack (5 pcs)', 'Accessories', '85.50', 100, true, 'stickers', 'Five weatherproof vinyl stickers for laptops and bottles.'],
            ['UCverse Canvas Tote', 'Accessories', '350.00', 30, true, 'tote', 'Heavy cotton tote that fits books and a laptop.'],
            ['UCverse Tumbler 500ml', 'Accessories', '480.00', 22, true, 'tumbler', 'Insulated tumbler with a straw lid.'],
            ['UCverse Enamel Pin Set', 'Accessories', '220.00', 35, true, 'pins', 'Set of three collectible enamel pins.'],
            ['UCverse Spiral Notebook A5', 'Campus Essentials', '95.00', 60, true, 'notebook', '80-leaf ruled notebook with a spiral binding.'],
            ['UCverse Ballpen Set (3 pcs)', 'Campus Essentials', '110.00', 70, true, 'pens', 'Three smooth-writing ballpens with black ink.'],
            ['UCverse Planner 2027', 'Campus Essentials', '260.00', 18, true, 'planner', 'Week-per-spread planner with a ribbon bookmark.'],
            ['UCverse Compact Umbrella', 'Campus Essentials', '520.00', 12, true, 'umbrella', 'Foldable umbrella for rainy afternoons between classes.'],
        ];

        $created = [];
        foreach ($products as [$name, $cat, $price, $stock, $active, $slug, $desc]) {
            $created[$slug] = $catalog->createProduct([
                'name' => $name,
                'categoryId' => $cats[$cat],
                'description' => $desc,
                'priceCents' => Money::toCents($price),
                'stock' => $stock,
                'isActive' => $active,
                'imageUrl' => "/images/{$slug}.svg", // bundled with the frontend (Part 2)
            ]);
        }

        $this->info(count($products) . ' products in ' . count($cats) . ' categories created.');

        if ($this->option('orders')) {
            $this->seedOrders($orders, $created);
        }

        return self::SUCCESS;
    }

    /** @param array<string,array<string,mixed>> $p products keyed by image slug */
    private function seedOrders(OrderService $orders, array $p): void
    {
        $line = fn(string $slug, int $qty) => [
            'productId' => $p[$slug]['id'],
            'qty' => $qty,
            'unitPriceCents' => $p[$slug]['priceCents'],
        ];

        // Maria's order is the assessment example: 2 x 120.00 + 1 x 85.50 = 325.50
        $samples = [
            [
                'Maria Santos',
                'maria.santos@example.com',
                '0917 555 0101',
                'Unit 4, Sample Bldg, Cebu City',
                'Cash on Delivery',
                [$line('lanyard', 2), $line('stickers', 1)],
                [OrderStatus::Confirmed, OrderStatus::Preparing, OrderStatus::Shipped, OrderStatus::Completed]
            ],
            [
                'Jose Reyes',
                'jose.reyes@example.com',
                '+63 918 555 0102',
                '12 Fictional St, Mandaue City',
                'E-Wallet',
                [$line('classic-tee', 2), $line('tumbler', 1)],
                [OrderStatus::Confirmed]
            ],
            [
                'Ana Dela Cruz',
                'ANA@example.com',
                '(032) 555-0103',
                '88 Sample Ave, Talisay City',
                'Bank Transfer',
                [$line('varsity-jacket', 1)],
                []
            ],
        ];

        foreach ($samples as [$name, $email, $phone, $addr, $pay, $items, $steps]) {
            $order = $orders->place([
                'customerName' => $name,
                'email' => $email,
                'phone' => $phone,
                'address' => $addr,
                'paymentMethod' => $pay,
                'notes' => 'Sample order',
                'items' => $items,
            ]);
            foreach ($steps as $s) {
                $orders->updateStatus($order['orderNumber'], $s->value);
            }
        }

        $this->info(count($samples) . ' sample orders created (fictional customers).');
    }
}
