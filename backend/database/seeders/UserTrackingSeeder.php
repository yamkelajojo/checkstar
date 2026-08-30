<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class UserTrackingSeeder extends Seeder
{
    private const SEARCH_QUERIES = [
        'milk', 'bread', 'eggs', 'chicken', 'rice', 'sugar', 'tea', 'coffee',
        'cooking oil', 'onions', 'potatoes', 'tomatoes', 'bananas', 'apples',
        'mince', 'cheese', 'yogurt', 'juice', 'water', 'soft drinks',
        'maize meal', 'samp', 'beans', 'pasta', 'sauce', 'cereal',
        'nappies', 'soap', 'shampoo', 'tissues',
    ];

    public function run(): void
    {
        $customerIds = DB::table('users')->where('role', 'customer')->pluck('id')->toArray();
        $productIds = DB::table('products')->pluck('id')->toArray();

        if (empty($customerIds) || empty($productIds)) {
            $this->command?->warn('Skipped UserTrackingSeeder: no customers or products found.');
            return;
        }

        $ordersCount = DB::table('orders')->count();
        $viewCount = $ordersCount * 10;
        $searchCount = $ordersCount * 5;
        $cartCount = $ordersCount * 3;

        $this->command?->info("Seeding tracking events: {$viewCount} views, {$searchCount} searches, {$cartCount} carts...");

        $events = [];

        // Product views
        for ($i = 0; $i < $viewCount; $i++) {
            $events[] = [
                'customer_id' => $customerIds[array_rand($customerIds)],
                'event_type' => 'product_view',
                'product_id' => $productIds[array_rand($productIds)],
                'search_query' => null,
                'metadata' => null,
                'created_at' => Carbon::now()->subDays(rand(0, 29))->addSeconds(rand(0, 86399)),
            ];
        }

        // Search queries
        for ($i = 0; $i < $searchCount; $i++) {
            $events[] = [
                'customer_id' => $customerIds[array_rand($customerIds)],
                'event_type' => 'search',
                'product_id' => null,
                'search_query' => self::SEARCH_QUERIES[array_rand(self::SEARCH_QUERIES)],
                'metadata' => null,
                'created_at' => Carbon::now()->subDays(rand(0, 29))->addSeconds(rand(0, 86399)),
            ];
        }

        // Cart additions
        for ($i = 0; $i < $cartCount; $i++) {
            $events[] = [
                'customer_id' => $customerIds[array_rand($customerIds)],
                'event_type' => 'add_to_cart',
                'product_id' => $productIds[array_rand($productIds)],
                'search_query' => null,
                'metadata' => null,
                'created_at' => Carbon::now()->subDays(rand(0, 29))->addSeconds(rand(0, 86399)),
            ];
        }

        // Batch insert for performance
        $chunks = array_chunk($events, 500);
        foreach ($chunks as $chunk) {
            DB::table('user_tracking_events')->insert($chunk);
        }

        $this->command?->info("Created " . count($events) . " tracking events.");
    }
}
