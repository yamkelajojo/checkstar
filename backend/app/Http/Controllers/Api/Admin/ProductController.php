<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::with('category')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:products',
            'description' => 'nullable|string',
            'image' => 'nullable|string|max:255',
            'unit' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
            // A sale price above the regular price would raise what
            // customers pay — reject at the boundary (PricingService also
            // clamps defensively).
            'sale_price' => 'nullable|numeric|min:0|lte:price',
            'tags' => 'nullable|array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $product = Product::create($validated);

        return response()->json(['data' => $product], 201);
    }

    public function show(int $id): JsonResponse
    {
        $product = Product::with('category', 'specials')->findOrFail($id);

        return response()->json(['data' => $product]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'exists:categories,id',
            'name' => 'string|max:255',
            'slug' => 'string|max:255|unique:products,slug,'.$id,
            'description' => 'nullable|string',
            'image' => 'nullable|string|max:255',
            'unit' => 'string|max:50',
            'price' => 'numeric|min:0',
            // Cross-field guard: sale_price may not exceed the resulting
            // regular price (request value or the stored one on partial
            // updates).
            'sale_price' => [
                'nullable', 'numeric', 'min:0',
                function (string $attribute, mixed $value, \Closure $fail) use ($request, $product): void {
                    if ($value === null) {
                        return;
                    }
                    $price = $request->input('price') ?? $product->price;
                    if ($price !== null && (float) $value > (float) $price) {
                        $fail('The sale price may not be higher than the regular price.');
                    }
                },
            ],
            'tags' => 'nullable|array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $product->update($validated);

        return response()->json(['data' => $product]);
    }

    public function destroy(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        // order_items.product_id cascades on delete — destroying a product
        // with purchase history would silently erase financial records (line
        // items, revenue). Deactivate instead; deletion is only allowed for
        // products never ordered.
        $ordered = \App\Models\OrderItem::where('product_id', $id)->exists();
        if ($ordered) {
            $product->update(['is_active' => false]);

            return response()->json([
                'message' => 'Product has order history and cannot be deleted — it was deactivated instead.',
                'reason' => 'has_order_history',
                'data' => $product->fresh(),
            ], 409);
        }

        $product->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
