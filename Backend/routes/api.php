<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\StoreController;
use App\Http\Middleware\AdminAuth;
use Illuminate\Support\Facades\Route;

// ---------------------------------------------------------------- public
Route::get('/categories', [StoreController::class, 'categories']);
Route::get('/products', [StoreController::class, 'products']);
Route::get('/products/{id}', [StoreController::class, 'product']);
Route::get('/payment-methods', [StoreController::class, 'paymentMethods']);
Route::post('/cart/validate', [StoreController::class, 'validateCart']);
Route::post('/orders', [StoreController::class, 'placeOrder'])->middleware('throttle:30,1');

// ----------------------------------------------------------------- admin
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login'])->middleware('throttle:10,1');

    // Everything below needs a valid demo token, enforced on the server.
    Route::middleware(AdminAuth::class)->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/me', [AdminAuthController::class, 'me']);

        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/customers', [AdminController::class, 'customers']);

        Route::get('/products', [AdminController::class, 'products']);
        Route::post('/products', [AdminController::class, 'createProduct']);
        Route::get('/products/{id}', [AdminController::class, 'product']);
        Route::put('/products/{id}', [AdminController::class, 'updateProduct']);
        Route::delete('/products/{id}', [AdminController::class, 'deleteProduct']);

        Route::get('/categories', [AdminController::class, 'categories']);
        Route::post('/categories', [AdminController::class, 'createCategory']);
        Route::put('/categories/{id}', [AdminController::class, 'updateCategory']);
        Route::delete('/categories/{id}', [AdminController::class, 'deleteCategory']);

        Route::get('/orders', [AdminController::class, 'orders']);
        Route::get('/orders/{orderNumber}', [AdminController::class, 'order']);
        Route::patch('/orders/{orderNumber}/status', [AdminController::class, 'updateOrderStatus']);
    });
});
