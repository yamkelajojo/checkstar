<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Collection;

class PricingService
{
    public function effectivePrice(Product $product, ?Collection $specials = null): float
    {
        // Cascade: min of (base price, product sale price, active special
        // prices). A mistyped admin edit setting sale_price above the base
        // price must never overcharge the customer.
        if ($product->sale_price !== null && (float) $product->sale_price <= (float) $product->price) {
            return (float) $product->sale_price;
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
                // Priority cascade clamped to base: the customer never pays
                // more than the regular price, whichever deal applies.
                return min((float) $product->price, $specialPrices->min());
            }
        }

        return (float) $product->price;
    }
}
