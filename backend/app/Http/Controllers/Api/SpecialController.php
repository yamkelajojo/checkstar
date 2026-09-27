<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Special;
use App\Services\MediaService;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;

class SpecialController extends Controller
{
    public function __construct(
        private PricingService $pricingService,
        private MediaService $media,
    ) {}

    public function index(): JsonResponse
    {
        $specials = Special::activeWindow()
            ->with(['products' => $this->productQuery(), 'store:id,name,slug', 'banner:id,name,status'])
            ->orderBy('sort_order')
            ->get();

        foreach ($specials as $special) {
            $this->enrich($special);
        }

        return response()->json(['data' => $specials]);
    }

    /**
     * GET /api/specials/{slug}
     *
     * Single sale landing: the sale with its products, whether or not the
     * date window has passed (clients show an "Ended" badge).
     */
    public function show(string $slug): JsonResponse
    {
        $special = Special::where('slug', $slug)
            ->with(['products' => $this->productQuery(), 'store:id,name,slug', 'banner:id,name,status'])
            ->firstOrFail();

        $this->enrich($special);

        $payload = $special->toArray();
        $payload['in_window'] = $special->is_active
            && $special->start_date->lessThanOrEqualTo(now())
            && $special->end_date->greaterThanOrEqualTo(now());

        return response()->json(['data' => $payload]);
    }

    private function productQuery(): \Closure
    {
        return function ($query): void {
            // Load products with everything the catalogue clients need:
            // store availability (add-to-cart), category (filtering) and
            // the specials relation (deal-price cascade inputs).
            $query->where('is_active', true)
                ->with(['category', 'specials', 'storeProducts.store:id,name,slug']);
        };
    }

    private function enrich(Special $special): void
    {
        foreach ($special->products as $product) {
            $product->effective_price = $this->pricingService->effectivePrice($product, $product->specials ?? collect());

            $this->media->applyToProduct($product);

            // Same `stores` shape the catalogue emits (mobile's mapper and
            // add-to-cart read it): only in-stock, available rows.
            $storeProducts = $product->storeProducts
                ->where('is_available', true)
                ->where('stock_quantity', '>', 0)
                ->values();

            $product->store_count = $storeProducts->count();
            $product->stores = $storeProducts->map(fn ($sp) => [
                'store_product_id' => $sp->id,
                'id' => $sp->store->id,
                'name' => $sp->store->name,
                'slug' => $sp->store->slug,
                'stock_quantity' => $sp->stock_quantity,
                'available_quantity' => max(0, $sp->stock_quantity - ($sp->reserved_quantity ?? 0)),
                'is_available' => $sp->is_available,
            ])->values();
        }
    }

}
