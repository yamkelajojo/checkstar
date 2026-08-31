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
    ) {
    }

    private function imageUrl(?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        return rtrim(request()->getSchemeAndHttpHost(), '/') . '/' . ltrim($path, '/');
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
            ->values()
            ->toArray();

        return $this->enrichProducts($products);
    }

    private function enrichProducts(array $products): array
    {
        foreach ($products as $product) {
            $this->absolutizeImages($product);
            $product->effective_price = $this->pricingService->effectivePrice($product, $product->specials ?? collect());
        }

        return $products;
    }

    /**
     * GET /api/products/trending
     * Top 10 products by order count in last 7 days.
     */
    public function trending(): JsonResponse
    {
        return response()->json(['data' => $this->getProductsByPopularity(7, 10)]);
    }

    /**
     * GET /api/products/popular
     * Top 10 products by order count in last 30 days.
     */
    public function popular(): JsonResponse
    {
        return response()->json(['data' => $this->getProductsByPopularity(30, 10)]);
    }

    /**
     * GET /api/products/new-arrivals
     * Products created in last 14 days.
     */
    public function newArrivals(): JsonResponse
    {
        $products = Product::where('is_active', true)
            ->where('created_at', '>=', Carbon::now()->subDays(14))
            ->with(['category', 'specials'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->toArray();

        $products = $this->enrichProducts($products);

        return response()->json(['data' => $products]);
    }
}
