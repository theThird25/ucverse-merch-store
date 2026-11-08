<?php

namespace Tests\Feature;

use App\Support\AdminToken;
use Tests\TestCase;

class AdminTokenTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['app.key' => 'base64:' . base64_encode(str_repeat('k', 32))]);
    }

    public function test_an_issued_token_is_valid(): void
    {
        $this->assertTrue(AdminToken::valid(AdminToken::issue(60)));
    }

    public function test_an_expired_token_is_rejected(): void
    {
        $this->assertFalse(AdminToken::valid(AdminToken::issue(-1)));
    }

    public function test_a_tampered_token_is_rejected(): void
    {
        [$payload, $sig] = explode('.', AdminToken::issue(60));
        $forged = rtrim(strtr(base64_encode(json_encode(['exp' => time() + 99999])), '+/', '-_'), '=');

        $this->assertFalse(AdminToken::valid($forged . '.' . $sig));
        $this->assertFalse(AdminToken::valid($payload . '.' . 'x' . $sig));
    }

    public function test_garbage_is_rejected(): void
    {
        foreach ([null, '', 'abc', 'a.b.c', '.'] as $bad) {
            $this->assertFalse(AdminToken::valid($bad));
        }
    }
}
