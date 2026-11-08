<?php

namespace App\Support;

final class AdminToken
{
    public static function issue(int $ttlMinutes): string
    {
        $payload = self::b64(json_encode([
            'exp' => time() + $ttlMinutes * 60,
            'n' => bin2hex(random_bytes(8)),
        ]));

        return $payload . '.' . self::sign($payload);
    }

    public static function valid(?string $token): bool
    {
        if (!$token || substr_count($token, '.') !== 1) {
            return false;
        }

        [$payload, $signature] = explode('.', $token, 2);
        if (!hash_equals(self::sign($payload), $signature)) {
            return false;
        }

        $data = json_decode(self::unb64($payload), true);

        return is_array($data) && (int) ($data['exp'] ?? 0) > time();
    }

    private static function sign(string $payload): string
    {
        return self::b64(hash_hmac('sha256', $payload, self::key(), true));
    }

    private static function key(): string
    {
        $key = (string) config('app.key');
        if ($key === '') {
            throw new \RuntimeException('APP_KEY is not set.');
        }

        return $key;
    }

    private static function b64(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    private static function unb64(string $text): string
    {
        return (string) base64_decode(strtr($text, '-_', '+/'));
    }
}
