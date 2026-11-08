<?php

namespace App\Http\Controllers;

use App\Services\CatalogService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StoreController extends Controller
{
    public function __construct(private CatalogService $catalog, private OrderService $orders)
    {
    }

    public function categories(): JsonResponse
    {
        return response()->json(['data' => $this->catalog->categories()]);
    }

    public function products(Request $request): JsonResponse
    {
        $f = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', Rule::in(['price_asc', 'price_desc'])],
        ]);

        return response()->json(['data' => $this->catalog->publicProducts($f)]);
    }

    public function product(string $id): JsonResponse
    {
        return response()->json(['data' => $this->catalog->publicProduct($id)]);
    }

    public function paymentMethods(): JsonResponse
    {
        return response()->json(['data' => config('store.payment_methods')]);
    }

    public function validateCart(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['present', 'array', 'max:50'],
            'items.*.productId' => ['required', 'string'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        return response()->json(['data' => $this->catalog->resolveCart($data['items'])]);
    }

    public function placeOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customerName' => ['required', 'string', 'max:120', 'regex:/\S/'],
            'email' => ['required', 'string', 'max:160', 'email:rfc'],
            'phone' => [
                'required',
                'string',
                'max:30',
                'regex:/^\+?[0-9\s\-().]{7,25}$/',
                function ($attr, $value, $fail) {
                    if (strlen(preg_replace('/\D/', '', $value)) < 7) {
                        $fail('The contact number must contain at least 7 digits.');
                    }
                }
            ],
            'address' => ['required', 'string', 'max:300', 'regex:/\S/'],
            'paymentMethod' => ['required', Rule::in(config('store.payment_methods'))],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.productId' => ['required', 'string'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:999'],
            'items.*.unitPriceCents' => ['required', 'integer', 'min:0'],
        ], [
            'customerName.regex' => 'Customer name cannot be blank.',
            'address.regex' => 'Delivery address cannot be blank.',
            'phone.regex' => 'Enter a valid contact number (digits, spaces, +, -, parentheses).',
            'items.required' => 'Your cart is empty.',
            'items.min' => 'Your cart is empty.',
        ]);

        return response()->json(['data' => $this->orders->place($data)], 201);
    }
}
