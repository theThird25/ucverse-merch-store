<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'Pending';
    case Confirmed = 'Confirmed';
    case Preparing = 'Preparing';
    case Shipped = 'Shipped';
    case Completed = 'Completed';
    case Cancelled = 'Cancelled';

    /** @return list<self> */
    public function allowedNext(): array
    {
        return match ($this) {
            self::Pending => [self::Confirmed, self::Cancelled],
            self::Confirmed => [self::Preparing, self::Cancelled],
            self::Preparing => [self::Shipped],
            self::Shipped => [self::Completed],
            self::Completed, self::Cancelled => [],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedNext(), true);
    }

    public function isFinal(): bool
    {
        return $this->allowedNext() === [];
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn(self $s) => $s->value, self::cases());
    }
}
