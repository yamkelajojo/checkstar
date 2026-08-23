<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
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

    public function index(Request $request): JsonResponse
    {
        $query = Product::where('is_active', true)
            ->with('category');

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->category));
        }

        if ($request->filled('featured')) {
            $query->where('is_featured', true);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        if ($request->filled('tag')) {
            $query->where('tags', 'like', "%\"{$request->tag}\"%");
        }

        $rawPerPage = $request->query('per_page', 20);
        $perPage = is_numeric($rawPerPage)
            ? max(1, min((int) $rawPerPage, 100))
            : 20;

        $products = $query->orderBy('sort_order')->paginate($perPage);

        foreach ($products as $product) {
            $this->absolutizeImages($product);
            $product->effective_price = $this->pricingService->effectivePrice($product, $product->specials ?? collect());
        }

        return response()->json($products);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)
            ->where('is_active', true)
            ->with('category', 'specials')
            ->firstOrFail();

        $this->absolutizeImages($product);
        $product->effective_price = $this->pricingService->effectivePrice($product, $product->specials ?? collect());

        return response()->json(['data' => $product]);
    }
}
