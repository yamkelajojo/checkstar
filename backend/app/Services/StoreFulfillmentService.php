<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Store;
use App\Models\StoreProduct;
use Illuminate\Support\Collection;

class StoreFulfillmentService
{
    public function __construct(
        private DispatchPolicy $dispatchPolicy,
    ) {}

    /**
     * Normalize cart items to handle both formats: [product_id => qty] and [{product_id, quantity}].
     *
     * @return array<int, array{product_id: int, quantity: int}>
     */
    private function normalizeCartItems(array $cartItems): array
    {
        $normalized = [];
        foreach ($cartItems as $key => $item) {
            if (is_int($key) && isset($item['product_id'])) {
                $normalized[] = $item;
            } elseif (is_int($key) && is_int($item)) {
                $normalized[] = ['product_id' => $key, 'quantity' => $item];
            } else {
                $normalized[] = $item;
            }
        }

        return $normalized;
    }

    /**
     * Resolve the best fulfillment store for a complete cart.
     *
     * @param  array<int, array{product_id: int, quantity: int}>  $cartItems
     */
    public function resolve(array $cartItems, float $customerLat, float $customerLng): FulfillmentResult
    {
        if (empty($cartItems)) {
            return new FulfillmentResult(
                success: false,
                store: null,
                eligibleStores: [],
                unfulfillableItems: [],
                reason: 'Cart is empty',
            );
        }

        // Get all active stores within delivery radius of customer
        $eligibleStores = $this->dispatchPolicy->eligibleStores($customerLat, $customerLng);

        if ($eligibleStores->isEmpty()) {
            return new FulfillmentResult(
                success: false,
                store: null,
                eligibleStores: [],
                unfulfillableItems: $this->getUnfulfillableItems($cartItems, collect()),
                reason: 'No stores within delivery range',
            );
        }

        // Check each store for complete cart fulfillment
        $fulfillableStores = $eligibleStores->filter(function (array $storeData) use ($cartItems) {
            return $this->storeCanFulfillCart($storeData['store'], $cartItems);
        })->values();

        if ($fulfillableStores->isEmpty()) {
            // No store can fulfill the complete cart - identify which items prevent fulfillment
            $unfulfillableItems = $this->getUnfulfillableItems($cartItems, $eligibleStores);

            return new FulfillmentResult(
                success: false,
                store: null,
                eligibleStores: $fulfillableStores->map(fn (array $sd) => $sd['store'])->all(),
                unfulfillableItems: $unfulfillableItems,
                reason: 'No single store can fulfill the complete cart',
            );
        }

        // Prefer nearest store that can fulfill the complete cart
        $bestStore = $fulfillableStores->first()['store'];

        return new FulfillmentResult(
            success: true,
            store: $bestStore,
            eligibleStores: $fulfillableStores->map(fn (array $sd) => $sd['store'])->all(),
            unfulfillableItems: [],
            reason: null,
        );
    }

    /**
     * Check if a store has all cart items available and in sufficient stock.
     */
    private function storeCanFulfillCart(Store $store, array $cartItems): bool
    {
        $normalizedItems = $this->normalizeCartItems($cartItems);

        $productIds = array_column($normalizedItems, 'product_id');
        $quantities = array_combine($productIds, array_column($normalizedItems, 'quantity'));

        $storeProducts = StoreProduct::where('store_id', $store->id)
            ->whereIn('product_id', $productIds)
            ->where('is_available', true)
            ->get()
            ->keyBy('product_id');

        foreach ($normalizedItems as $item) {
            $productId = $item['product_id'];
            $quantity = $item['quantity'];

            $sp = $storeProducts->get($productId);
            if (! $sp) {
                return false; // Product not available at this store
            }
            if ($sp->stock_quantity < $quantity) {
                return false; // Insufficient stock
            }
        }

        return true;
    }

    /**
     * Identify which cart items cannot be fulfilled at any eligible store.
     */
    private function getUnfulfillableItems(array $cartItems, Collection $eligibleStores): array
    {
        $normalizedItems = $this->normalizeCartItems($cartItems);

        $unfulfillable = [];

        foreach ($normalizedItems as $item) {
            $productId = $item['product_id'];
            $quantity = $item['quantity'];

            $canFulfillAnywhere = false;

            foreach ($eligibleStores as $storeData) {
                $store = $storeData['store'];
                $sp = StoreProduct::where('store_id', $store->id)
                    ->where('product_id', $productId)
                    ->where('is_available', true)
                    ->first();

                if ($sp && $sp->stock_quantity >= $quantity) {
                    $canFulfillAnywhere = true;
                    break;
                }
            }

            if (! $canFulfillAnywhere) {
                $product = Product::find($productId);
                $unfulfillable[] = [
                    'product_id' => $productId,
                    'product_name' => $product?->name ?? 'Unknown',
                    'requested_quantity' => $quantity,
                    'reason' => 'Not available in sufficient quantity at any eligible store',
                ];
            }
        }

        return $unfulfillable;
    }

    /**
     * Validate if a specific store can fulfill the cart (used for manual dispatch override).
     */
    public function validateStoreForCart(Store $store, array $cartItems): bool
    {
        return $this->storeCanFulfillCart($store, $cartItems);
    }
}

class FulfillmentResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?Store $store,
        public readonly array $eligibleStores,
        public readonly array $unfulfillableItems,
        public readonly ?string $reason,
    ) {}

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'store' => $this->store ? [
                'id' => $this->store->id,
                'name' => $this->store->name,
                'slug' => $this->store->slug,
                'latitude' => (float) $this->store->latitude,
                'longitude' => (float) $this->store->longitude,
                'delivery_radius_km' => (float) $this->store->delivery_radius_km,
            ] : null,
            'eligible_stores' => array_map(fn (Store $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
                'latitude' => (float) $s->latitude,
                'longitude' => (float) $s->longitude,
                'delivery_radius_km' => (float) $s->delivery_radius_km,
            ], $this->eligibleStores),
            'unfulfillable_items' => $this->unfulfillableItems,
            'reason' => $this->reason,
        ];
    }
}
