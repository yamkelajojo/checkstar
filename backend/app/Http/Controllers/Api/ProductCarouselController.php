<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ProductCarouselController extends Controller
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

    private function getPopularProductIds(int $days, int $limit): array
    {
        return DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'delivered')
            ->where('orders.created_at', '>=', Carbon::now()->subDays($days))
            ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_quantity'))
            ->groupBy('order_items.product_id')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->pluck('product_id')
            ->toArray();
    }

    private function getProductsByPopularity(int $days, int $limit): array
    {
        $productIds = $this->getPopularProductIds($days, $limit);

        if (empty($productIds)) {
            return [];
        }

        $products = Product::whereIn('id', $productIds)
            ->where('is_active', true)
            ->with(['category', 'specials'])
            ->get()
            ->sortBy(fn ($p) => array_search($p->id, $productIds))
            ->values();

        return $this->enrichProducts($products)->values()->toArray();
    }

    private function enrichProducts($products)
    {
        foreach ($products as $product) {
            $this->absolutizeImages($product);
            $product->effective_price = $this->pricingService->effectivePrice($product, $product->specials ?? collect());
        }

        return $products;
    }

    /**
     * Fallback: most-recently-created active products when order-based
     * carousels have no data (fresh DB with no delivered orders yet).
     */
    private function getRecentProducts(int $limit): array
    {
        $products = Product::where('is_active', true)
            ->with(['category', 'specials'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $this->enrichProducts($products)->values()->toArray();
    }

    /**
     * GET /api/products/trending
     * Top 10 products by order count in last 7 days.
     * Falls back to most-recent products when no delivered orders exist.
     */
    public function trending(): JsonResponse
    {
        $data = $this->getProductsByPopularity(7, 10);

        if ($data === []) {
            $data = $this->getRecentProducts(10);
        }

        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/products/popular
     * Top 10 products by order count in last 30 days.
     * Falls back to most-recent products when no delivered orders exist.
     */
    public function popular(): JsonResponse
    {
        $data = $this->getProductsByPopularity(30, 10);

        if ($data === []) {
            $data = $this->getRecentProducts(10);
        }

        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/products/new-arrivals
     * Products created in last 14 days.
     * Falls back to most-recent products when none are recent enough.
     */
    public function newArrivals(): JsonResponse
    {
        $products = Product::where('is_active', true)
            ->where('created_at', '>=', Carbon::now()->subDays(14))
            ->with(['category', 'specials'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $data = $this->enrichProducts($products)->values()->toArray();

        if ($data === []) {
            $data = $this->getRecentProducts(10);
        }

        return response()->json(['data' => $data]);
    }
}
