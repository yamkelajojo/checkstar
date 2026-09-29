<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Collection;

class PricingService
{
    public function effectivePrice(Product $product, ?Collection $specials = null): float
    {
        // Documented cascade (CONTEXT.md, Special / Order Intake): product
        // sale_price → collection special → base price. A product-level
        // markdown outranks every collection Special the product also sits
        // in, so the customer pays the direct sale price first.
        $base = (float) $product->price;
        $sale = $product->sale_price !== null ? (float) $product->sale_price : null;

        // A sale_price at or above base is a mistyped admin edit, never a
        // discount — drop it so it cannot raise the price.
        if ($sale !== null && $sale < $base) {
            return $sale;
        }

        $candidates = [$base];

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
                // overcharge; min still picks the cheapest of base vs specials.
                $candidates[] = min($base, $sp);
            }
        }

        return min($candidates);
    }
}
