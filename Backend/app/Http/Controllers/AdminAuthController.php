<?php

namespace App\Http\Controllers;

use App\Support\AdminToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $cfg = config('store.admin');

        $emailOk = hash_equals(mb_strtolower((string) $cfg['email']), mb_strtolower(trim($data['email'])));
        // A bcrypt hash is preferred when set; otherwise compare against the plain demo password.
        $passOk = $cfg['password_hash']
            ? password_verify($data['password'], $cfg['password_hash'])
            : hash_equals((string) $cfg['password'], $data['password']);

        if (!($emailOk && $passOk)) {
            return response()->json(['code' => 'BAD_CREDENTIALS', 'message' => 'Incorrect email or password.'], 401);
        }

        return response()->json([
            'data' => [
                'token' => AdminToken::issue((int) $cfg['token_ttl_minutes']),
                'email' => $cfg['email'],
            ]
        ]);
    }

    /** Stateless tokens cannot be revoked server-side; the browser simply discards its token. */
    public function logout(): JsonResponse
    {
        return response()->json(['data' => true]);
    }

    public function me(): JsonResponse
    {
        return response()->json(['data' => ['email' => config('store.admin.email')]]);
    }
}
