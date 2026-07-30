<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Collection;

class PricingService
{
    public function effectivePrice(Product $product, ?Collection $specials = null): float
    {
        if ($product->sale_price !== null) {
            return (float) $product->sale_price;
        }

        if ($specials !== null && $specials->isNotEmpty()) {
            $specialPrices = $specials->filter(fn ($s) => $s instanceof Product
                ? ($s->sale_price !== null)
                : (isset($s->pivot, $s->pivot->special_price) && $s->pivot->special_price !== null)
            )->map(fn ($s) => (float) ($s instanceof Product ? $s->sale_price : $s->pivot->special_price));

            if ($specialPrices->isNotEmpty()) {
                return $specialPrices->min();
            }
        }

        return (float) $product->price;
    }
}
