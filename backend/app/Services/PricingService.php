<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Collection;

class PricingService
{
    public function effectivePrice(Product $product, ?Collection $specials = null): float
    {
        if ($product->sale_price !== null) {
            return min((float) $product->price, (float) $product->sale_price);
        }

        if ($specials !== null && $specials->isNotEmpty()) {
            $now = now();
            $specialPrices = $specials
                ->filter(function ($s) use ($now) {
                    // Only consider active specials within date range if those attributes exist
                    if (isset($s->is_active) && ! $s->is_active) {
                        return false;
                    }
                    if (isset($s->start_date) && $s->start_date && $now->lt($s->start_date)) {
                        return false;
                    }
                    if (isset($s->end_date) && $s->end_date && $now->gt($s->end_date)) {
                        return false;
                    }
                    if ($s instanceof Product) {
                        return $s->sale_price !== null;
                    }

                    return isset($s->pivot, $s->pivot->special_price) && $s->pivot->special_price !== null;
                })
                ->map(fn ($s) => (float) ($s instanceof Product ? $s->sale_price : $s->pivot->special_price));

            if ($specialPrices->isNotEmpty()) {
                return min((float) $product->price, (float) $specialPrices->min());
            }
        }

        return (float) $product->price;
    }
}
