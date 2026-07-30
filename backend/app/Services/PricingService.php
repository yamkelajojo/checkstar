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

        return (float) $product->price;
    }
}
