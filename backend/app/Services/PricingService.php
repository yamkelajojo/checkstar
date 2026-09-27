<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Collection;

class PricingService
{
    public function effectivePrice(Product $product, ?Collection $specials = null): float
    {
        // True cascade: the customer never pays more than the cheapest
        // applicable price — base, product-level sale_price, or any live
        // special. The previous early-return on sale_price would overcharge
        // when e.g. base 45, sale 39.99, special 29.99 (special is cheaper).
        $candidates = [(float) $product->price];

        if ($product->sale_price !== null && (float) $product->sale_price < (float) $product->price) {
            $candidates[] = (float) $product->sale_price;
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

            foreach ($specialPrices as $sp) {
                // Clamp each special to base so a mis-typed pivot can never
                // overcharge; the overall min still picks the cheapest.
                $candidates[] = min((float) $product->price, $sp);
            }
        }

        return min($candidates);
    }
}
