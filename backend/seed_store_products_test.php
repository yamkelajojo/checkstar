<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StoreProduct;

// Set specific products to be out of stock at Durban Central (store_id=1) but available at other stores
// This is for testing the fallback fulfillment logic
$productIds = [1, 2, 3, 4, 5]; // First 5 products

foreach ($productIds as $productId) {
    // Durban Central (id=1) - set to 0 stock
    StoreProduct::where('product_id', $productId)
        ->where('store_id', 1)
        ->update(['stock_quantity' => 0, 'is_available' => false]);

    // Umhlanga (id=2) - keep good stock
    StoreProduct::where('product_id', $productId)
        ->where('store_id', 2)
        ->update(['stock_quantity' => 50, 'is_available' => true]);

    // Pinetown (id=3) - keep good stock
    StoreProduct::where('product_id', $productId)
        ->where('store_id', 3)
        ->update(['stock_quantity' => 60, 'is_available' => true]);
}

echo "Updated stock for testing out-of-store flow\n";
