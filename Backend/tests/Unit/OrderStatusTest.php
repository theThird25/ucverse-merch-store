<?php

namespace Tests\Unit;

use App\Enums\OrderStatus;
use App\Support\Money;
use PHPUnit\Framework\TestCase;

class OrderStatusTest extends TestCase
{
    public function test_forward_chain_is_allowed(): void
    {
        $this->assertTrue(OrderStatus::Pending->canTransitionTo(OrderStatus::Confirmed));
        $this->assertTrue(OrderStatus::Confirmed->canTransitionTo(OrderStatus::Preparing));
        $this->assertTrue(OrderStatus::Preparing->canTransitionTo(OrderStatus::Shipped));
        $this->assertTrue(OrderStatus::Shipped->canTransitionTo(OrderStatus::Completed));
    }

    public function test_cancellation_only_from_pending_or_confirmed(): void
    {
        $this->assertTrue(OrderStatus::Pending->canTransitionTo(OrderStatus::Cancelled));
        $this->assertTrue(OrderStatus::Confirmed->canTransitionTo(OrderStatus::Cancelled));
        $this->assertFalse(OrderStatus::Preparing->canTransitionTo(OrderStatus::Cancelled));
        $this->assertFalse(OrderStatus::Shipped->canTransitionTo(OrderStatus::Cancelled));
    }

    public function test_backward_and_skipping_moves_are_rejected(): void
    {
        $this->assertFalse(OrderStatus::Confirmed->canTransitionTo(OrderStatus::Pending));
        $this->assertFalse(OrderStatus::Pending->canTransitionTo(OrderStatus::Shipped));
        $this->assertFalse(OrderStatus::Pending->canTransitionTo(OrderStatus::Pending));
    }

    public function test_final_statuses_cannot_change(): void
    {
        foreach ([OrderStatus::Completed, OrderStatus::Cancelled] as $final) {
            $this->assertTrue($final->isFinal());
            foreach (OrderStatus::cases() as $to) {
                $this->assertFalse($final->canTransitionTo($to));
            }
        }
    }

    public function test_assessment_money_example(): void
    {
        $total = 2 * Money::toCents('120.00') + 1 * Money::toCents('85.50');
        $this->assertSame(32550, $total);
        $this->assertSame('325.50', Money::format($total));
    }
}
