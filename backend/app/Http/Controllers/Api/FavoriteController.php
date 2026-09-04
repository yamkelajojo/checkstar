<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductFavorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $favorites = ProductFavorite::where('customer_id', $request->user()->id)
            ->with('product')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($favorites);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
        ]);

        $exists = ProductFavorite::where('customer_id', $request->user()->id)
            ->where('product_id', $validated['product_id'])
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Already favorited'], 409);
        }

        ProductFavorite::create([
            'customer_id' => $request->user()->id,
            'product_id' => $validated['product_id'],
        ]);

        return response()->json(['success' => true], 201);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        ProductFavorite::where('customer_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->delete();

        return response()->json(['success' => true], 204);
    }

    public function check(Request $request, Product $product): JsonResponse
    {
        $exists = ProductFavorite::where('customer_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->exists();

        return response()->json(['isFavorited' => $exists]);
    }
}
