<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StoreProduct;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function __construct(
        private PricingService $pricingService,
    ) {}

    private function imageUrl(?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        if (! is_file(public_path(ltrim($path, '/')))) {
            return rtrim(request()->getSchemeAndHttpHost(), '/').'/products/product-placeholder.svg';
        }

        return rtrim(request()->getSchemeAndHttpHost(), '/').'/'.ltrim($path, '/');
    }

    private function absolutizeImages(Product $product): Product
    {
        $product->image = $this->imageUrl($product->image);
        if ($product->images !== null) {
            $product->images = array_map(fn (?string $img) => $this->imageUrl($img), $product->images);
        }

        return $product;
    }

    private function appendStoreAvailability(Product $product): void
    {
        // Uses the already-eager-loaded relation when available (one query
        // per page instead of one per product).
        if (! $product->relationLoaded('storeProducts')) {
            $product->load(['storeProducts' => fn ($q) => $q
                ->where('is_available', true)
                ->where('stock_quantity', '>', 0)
                ->with('store:id,name,slug')]);
        }

        $storeProducts = $product->storeProducts
            ->where('is_available', true)
            ->where('stock_quantity', '>', 0)
            ->values();

        $product->store_count = $storeProducts->count();
        $product->stores = $storeProducts->map(fn (StoreProduct $sp) => [
            'store_product_id' => $sp->id,
            'id' => $sp->store->id,
            'name' => $sp->store->name,
            'slug' => $sp->store->slug,
            'stock_quantity' => $sp->stock_quantity,
            'available_quantity' => max(0, $sp->stock_quantity - ($sp->reserved_quantity ?? 0)),
            'is_available' => $sp->is_available,
        ])->values();
    }

    private function appendTrackingMetrics(array $products): void
    {
        $productIds = array_map(fn (Product $p) => $p->id, $products);
        if (empty($productIds)) {
            return;
        }

        $tracking = DB::table('user_tracking_events')
            ->where('event_type', 'product_view')
            ->whereIn('product_id', $productIds)
            ->select('product_id', DB::raw('COUNT(*) as view_count'))
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        $cartEvents = DB::table('user_tracking_events')
            ->where('event_type', 'add_to_cart')
            ->whereIn('product_id', $productIds)
            ->select('product_id', DB::raw('COUNT(*) as cart_count'))
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        foreach ($products as $product) {
            $views = $tracking->get($product->id)?->view_count ?? 0;
            $carts = $cartEvents->get($product->id)?->cart_count ?? 0;
            $product->view_count = (int) $views;
            $product->cart_count = (int) $carts;
            $product->conversion_rate = $views > 0 ? round($carts / $views * 100, 1) : 0.0;
        }
    }

    public function index(Request $request): JsonResponse
    {
        $query = Product::where('is_active', true)
            ->with(['category', 'specials', 'storeProducts.store:id,name,slug']);

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->category));
        }

        // Multi-category filtering (comma-separated slugs) so clients can
        // filter catalogue groups server-side instead of downloading the
        // whole catalogue and filtering in memory.
        if ($request->filled('categories')) {
            $slugs = collect(is_array($request->categories) ? $request->categories : explode(',', (string) $request->categories))
                ->map(fn ($slug) => trim((string) $slug))
                ->filter()
                ->unique()
                ->values();

            if ($slugs->isNotEmpty()) {
                $query->whereHas('category', fn ($q) => $q->whereIn('slug', $slugs->all()));
            }
        }

        if ($request->filled('featured')) {
            $query->where('is_featured', true);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $escaped = addcslashes($search, '%_\\');
            $query->where(function ($q) use ($escaped, $search) {
                $q->where('name', 'like', "%{$escaped}%")
                    ->orWhere('tags', 'like', "%{$escaped}%");
                // Also support exact tag match in JSON array
                try {
                    $q->orWhereJsonContains('tags', $search);
                } catch (\Throwable $e) {
                    // fallback to LIKE if DB doesn't support JSON contains
                }
            });
        }

        if ($request->filled('tag')) {
            $tag = $request->tag;
            $escapedTag = addcslashes($tag, '%_\\');
            $query->where(function ($q) use ($tag, $escapedTag) {
                $q->where('tags', 'like', "%\"{$escapedTag}\"%");
                try {
                    $q->orWhereJsonContains('tags', $tag);
                } catch (\Throwable $e) {
                }
            });
        }

        $rawPerPage = $request->query('per_page', 20);
        $perPage = is_numeric($rawPerPage)
            ? max(1, min((int) $rawPerPage, 100))
            : 20;

        $products = $query->orderBy('sort_order')->paginate($perPage);

        foreach ($products as $product) {
            $this->absolutizeImages($product);
            $product->effective_price = $this->pricingService->effectivePrice($product, $product->specials ?? collect());
            $this->appendStoreAvailability($product);
        }

        $this->appendTrackingMetrics($products->items());

        return response()->json($products);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)
            ->where('is_active', true)
            ->with(['category', 'specials', 'storeProducts' => fn ($q) => $q
                ->where('is_available', true)
                ->where('stock_quantity', '>', 0)])
            ->firstOrFail();

        $this->absolutizeImages($product);
        $product->effective_price = $this->pricingService->effectivePrice($product, $product->specials ?? collect());
        $this->appendStoreAvailability($product);
        $this->appendTrackingMetrics([$product]);

        return response()->json(['data' => $product]);
    }

    /**
     * Related / recommended items for the product page. Item-to-item scoring
     * (same aisle, bought together, price band, popularity) with a popularity
     * backfill so the shelf is always full. Same card shape as show().
     */
    public function related(string $slug, Request $request): JsonResponse
    {
        $product = Product::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $limit = min(12, max(1, (int) $request->query('limit', 8)));

        $service = new \App\Services\RecommendationService;
        $related = $service->getRelatedProducts($product, $limit);

        $related->each(function (Product $item) {
            $this->absolutizeImages($item);
            $item->effective_price = $this->pricingService->effectivePrice($item, $item->specials ?? collect());
            $this->appendStoreAvailability($item);
        });

        $this->appendTrackingMetrics($related->all());

        return response()->json(['data' => $related->values()]);
    }
}
