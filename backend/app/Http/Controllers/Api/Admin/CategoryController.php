<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->has('per_page') ? max(1, min((int) $request->query('per_page'), 100)) : 50;
        $paginator = Category::orderBy('sort_order')->paginate($perPage);
        if ($request->has('per_page') || $request->has('page')) {
            return response()->json($paginator);
        }

        return response()->json(['data' => $paginator->items(), 'meta' => [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories',
            'description' => 'nullable|string',
            'image' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:255',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $category = Category::create($validated);

        return response()->json(['data' => $category], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => Category::findOrFail($id)]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'slug' => 'string|max:255|unique:categories,slug,'.$id,
            'description' => 'nullable|string',
            'image' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:255',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return response()->json(['data' => $category]);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        // products.category_id cascades on delete: deleting a populated
        // category would destroy the catalogue (and via order_items, sales
        // history) instead of just the grouping. Refuse and let the admin
        // re-home the products first.
        $productCount = Product::where('category_id', $id)->count();
        if ($productCount > 0) {
            return response()->json([
                'message' => 'Cannot delete a category that still has products',
                'reason' => 'has_products',
                'product_count' => $productCount,
            ], 409);
        }

        $category->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
