<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Services\CatalogService;
use App\Services\OrderService;
use App\Services\ReportService;
use App\Support\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function __construct(
        private CatalogService $catalog,
        private OrderService $orders,
        private ReportService $reports,
    ) {
    }

    // ---- dashboard / customers
    public function dashboard(): JsonResponse
    {
        return response()->json(['data' => $this->reports->dashboard()]);
    }

    public function customers(): JsonResponse
    {
        return response()->json(['data' => $this->reports->customers()]);
    }

    // ---- products
    public function products(Request $request): JsonResponse
    {
        $f = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'out_of_stock'])],
        ]);

        return response()->json(['data' => $this->catalog->adminProducts($f)]);
    }

    public function product(string $id): JsonResponse
    {
        return response()->json(['data' => $this->catalog->adminProduct($id)]);
    }

    public function createProduct(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->catalog->createProduct($this->productInput($request))], 201);
    }

    public function updateProduct(Request $request, string $id): JsonResponse
    {
        return response()->json(['data' => $this->catalog->updateProduct($id, $this->productInput($request))]);
    }

    public function deleteProduct(string $id): JsonResponse
    {
        $this->catalog->deleteProduct($id);

        return response()->json(['data' => true]);
    }

    /** @return array<string,mixed> */
    private function productInput(Request $request): array
    {
        $d = $request->validate([
            'name' => ['required', 'string', 'max:150', 'regex:/\S/'],
            'categoryId' => ['required', 'string'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'numeric', 'gt:0', 'max:10000000', 'decimal:0,2'],
            'stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'isActive' => ['required', 'boolean'],
            'imageUrl' => ['nullable', 'string', 'max:500'],
        ], [
            'name.regex' => 'Product name cannot be blank.',
            'price.gt' => 'Price must be greater than zero.',
            'price.decimal' => 'Price can have at most two decimal places.',
            'stock.integer' => 'Stock must be a whole number.',
            'stock.min' => 'Stock cannot be negative.',
        ]);

        $d['priceCents'] = Money::toCents($d['price']);

        return $d;
    }

    // ---- categories
    public function categories(): JsonResponse
    {
        return response()->json(['data' => $this->catalog->categories()]);
    }

    public function createCategory(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->catalog->createCategory($this->categoryName($request))], 201);
    }

    public function updateCategory(Request $request, string $id): JsonResponse
    {
        return response()->json(['data' => $this->catalog->updateCategory($id, $this->categoryName($request))]);
    }

    public function deleteCategory(string $id): JsonResponse
    {
        $this->catalog->deleteCategory($id);

        return response()->json(['data' => true]);
    }

    private function categoryName(Request $request): string
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80', 'regex:/\S/'],
        ], ['name.regex' => 'Category name cannot be blank.'])['name'];
    }

    // ---- orders
    public function orders(): JsonResponse
    {
        return response()->json(['data' => $this->orders->list()]);
    }

    public function order(string $orderNumber): JsonResponse
    {
        return response()->json(['data' => $this->orders->find($orderNumber)]);
    }

    public function updateOrderStatus(Request $request, string $orderNumber): JsonResponse
    {
        $d = $request->validate(['status' => ['required', Rule::in(OrderStatus::values())]]);

        return response()->json(['data' => $this->orders->updateStatus($orderNumber, $d['status'])]);
    }
}
