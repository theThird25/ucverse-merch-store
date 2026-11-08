<?php

namespace App\Services;

use App\Enums\OrderStatus;

class ReportService
{
    public function __construct(private CatalogService $catalog, private OrderService $orders)
    {
    }

    /** @return array<string,int> */
    public function dashboard(): array
    {
        $orders = $this->orders->allRaw();

        $countStatus = fn(OrderStatus $s) => count(array_filter($orders, fn($o) => $o['status'] === $s->value));
        $completed = array_filter($orders, fn($o) => $o['status'] === OrderStatus::Completed->value);

        return [
            'totalProducts' => count($this->catalog->all('products')),         // includes inactive
            'totalOrders' => count($orders),                                    // includes cancelled
            'pendingOrders' => $countStatus(OrderStatus::Pending),
            'completedOrders' => $countStatus(OrderStatus::Completed),
            'totalCustomers' => count(array_unique(array_column($orders, 'emailNormalized'))),
            'totalSalesCents' => array_sum(array_column($completed, 'totalCents')), // Completed only
        ];
    }

    /** @return list<array<string,mixed>> */
    public function customers(): array
    {
        $orders = $this->orders->allRaw();
        usort($orders, fn($a, $b) => OrderService::sortKey($a) <=> OrderService::sortKey($b)); // oldest -> newest

        $byEmail = [];
        foreach ($orders as $o) {
            $key = $o['emailNormalized'];
            $row = $byEmail[$key] ?? ['orderCount' => 0, 'completedTotalCents' => 0];
            $row['email'] = $key;
            $row['name'] = $o['customerName']; // later orders overwrite, so the latest name/contact wins
            $row['phone'] = $o['phone'];
            $row['orderCount']++;
            if ($o['status'] === OrderStatus::Completed->value) {
                $row['completedTotalCents'] += (int) $o['totalCents'];
            }
            $byEmail[$key] = $row;
        }

        $out = array_values($byEmail);
        usort($out, fn($a, $b) => strcasecmp($a['name'], $b['name']));

        return $out;
    }
}
