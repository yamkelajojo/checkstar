<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductFavorite;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function __construct(
        private MediaService $media,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $favorites = ProductFavorite::where('customer_id', $request->user()->id)
            ->with('product')
            ->orderByDesc('created_at')
            ->paginate(20);

        // Same verified-media contract as every other catalogue surface.
        $favorites->getCollection()->each(function ($favorite): void {
            if ($favorite->product !== null) {
                $this->media->applyToProduct($favorite->product);
            }
        });

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

        try {
            ProductFavorite::create([
                'customer_id' => $request->user()->id,
                'product_id' => $validated['product_id'],
            ]);
        } catch (\Illuminate\Database\UniqueConstraintViolationException) {
            // A simultaneous double-tap raced the exists() check to the
            // unique index — same answer, no 500.
            return response()->json(['error' => 'Already favorited'], 409);
        }

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
