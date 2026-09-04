<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Product;
use App\Models\Store;
use App\Models\StoreProduct;

StoreProduct::query()->delete();

$stores = Store::all();
$products = Product::where('is_active', true)->get();

$totalProducts = $products->count();
$processed = 0;

// For a realistic supermarket demo:
// - 95% of products available at ALL stores with good stock (20-80)
// - 3% unavailable at exactly 1 store (simulate local stockout)
// - 1% unavailable at 2 stores (simulate regional distribution)
// - 1% unavailable everywhere (discontinued/seasonal - minimal)

$unavailableAtOneStoreCount = max(1, (int) ceil($totalProducts * 0.03));
$unavailableAtTwoStoresCount = max(1, (int) ceil($totalProducts * 0.01));
$unavailableEverywhereCount = max(1, (int) ceil($totalProducts * 0.01));

// Pick specific products for each category to make it deterministic
$productIds = $products->pluck('id')->toArray();
shuffle($productIds);

$unavailableAtOneStoreIds = array_slice($productIds, 0, $unavailableAtOneStoreCount);
$unavailableAtTwoStoresIds = array_slice($productIds, $unavailableAtOneStoreCount, $unavailableAtTwoStoresCount);
$unavailableEverywhereIds = array_slice($productIds, $unavailableAtOneStoreCount + $unavailableAtTwoStoresCount, $unavailableEverywhereCount);

$unavailableAtOneStoreSet = array_flip($unavailableAtOneStoreIds);
$unavailableAtTwoStoresSet = array_flip($unavailableAtTwoStoresIds);
$unavailableEverywhereSet = array_flip($unavailableEverywhereIds);

foreach ($products as $product) {
    $processed++;
    $productId = $product->id;

    // Determine which stores this product is unavailable at
    $unavailableStoreIds = [];

    if (isset($unavailableEverywhereSet[$productId])) {
        // Unavailable everywhere
        $unavailableStoreIds = $stores->pluck('id')->toArray();
    } elseif (isset($unavailableAtTwoStoresSet[$productId])) {
        // Unavailable at 2 stores - pick first 2 stores for consistency
        $unavailableStoreIds = $stores->take(2)->pluck('id')->toArray();
    } elseif (isset($unavailableAtOneStoreSet[$productId])) {
        // Unavailable at 1 store - pick first store
        $unavailableStoreIds = [$stores->first()->id];
    }

    foreach ($stores as $store) {
        $isAvailable = ! in_array($store->id, $unavailableStoreIds);

        if ($isAvailable) {
            // Good stock for available products (20-80)
            $stock = rand(20, 80);
        } else {
            $stock = 0;
        }

        StoreProduct::create([
            'product_id' => $product->id,
            'store_id' => $store->id,
            'stock_quantity' => $stock,
            'is_available' => $isAvailable,
        ]);
    }

    if ($processed % 50 === 0 || $processed === $totalProducts) {
        echo "Processed {$processed}/{$totalProducts} products\n";
    }
}

echo "Store products created for {$totalProducts} products\n";
echo "Summary:\n";
echo '  - Available at all stores: '.($totalProducts - $unavailableAtOneStoreCount - $unavailableAtTwoStoresCount - $unavailableEverywhereCount)."\n";
echo "  - Unavailable at 1 store: {$unavailableAtOneStoreCount}\n";
echo "  - Unavailable at 2 stores: {$unavailableAtTwoStoresCount}\n";
echo "  - Unavailable everywhere: {$unavailableEverywhereCount}\n";
