<?php

namespace App\Http\Middleware;

use App\Support\AdminToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!AdminToken::valid($request->bearerToken())) {
            return response()->json(['code' => 'UNAUTHENTICATED', 'message' => 'Admin login required.'], 401);
        }

        return $next($request);
    }
}
