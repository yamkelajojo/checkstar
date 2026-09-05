<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Special;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class SpecialController extends Controller
{
    public function __construct(
        private PricingService $pricingService,
    ) {}

    public function index(): JsonResponse
    {
        $specials = Special::where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->with(['products' => function ($query): void {
                // Load products with everything the catalogue clients need:
                // store availability (add-to-cart), category (filtering) and
                // the specials relation (deal-price cascade inputs).
                $query->where('is_active', true)
                    ->with(['category', 'specials', 'storeProducts.store:id,name,slug']);
            }])
            ->orderBy('sort_order')
            ->get();

        foreach ($specials as $special) {
            foreach ($special->products as $product) {
                $product->effective_price = $this->pricingService->effectivePrice($product, $product->specials ?? collect());

                if ($product->image !== null) {
                    $product->image = $this->absolutize($product->image);
                }
                if ($product->images !== null) {
                    $product->images = array_map(fn (?string $img) => $img === null ? null : $this->absolutize($img), $product->images);
                }
            }
        }

        return response()->json(['data' => $specials]);
    }

    private function absolutize(string $path): string
    {
        return rtrim(request()->getSchemeAndHttpHost(), '/').'/'.ltrim($path, '/');
    }
}
