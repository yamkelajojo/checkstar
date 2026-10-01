<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductFavorite;
use App\Services\MediaService;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function __construct(
        private MediaService $media,
        private PricingService $pricingService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $favorites = ProductFavorite::where('customer_id', $request->user()->id)
            ->with(['product.category', 'product.specials', 'product.storeProducts.store'])
            ->orderByDesc('created_at')
            ->paginate(20);

        // Same verified-media, pricing, and store-availability contract as every other catalogue surface.
        $favorites->getCollection()->each(function ($favorite): void {
            $product = $favorite->product;
            if ($product !== null) {
                $this->media->applyToProduct($product);
                $product->effective_price = $this->pricingService->effectivePrice($product, $product->specials ?? collect());
                $storeProducts = $product->relationLoaded('storeProducts') ? $product->storeProducts : collect();
                $product->stores = $storeProducts
                    ->filter(fn ($sp) => $sp->store && $sp->store->is_active)
                    ->map(fn ($sp) => [
                        'store_product_id' => $sp->id,
                        'id' => $sp->store->id,
                        'name' => $sp->store->name,
                        'slug' => $sp->store->slug,
                        'is_available' => (bool) $sp->is_available && ($sp->stock_quantity - ($sp->reserved_quantity ?? 0)) > 0,
                        'stock_quantity' => max(0, $sp->stock_quantity - ($sp->reserved_quantity ?? 0)),
                    ])
                    ->values();
                $product->unsetRelation('storeProducts');
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
