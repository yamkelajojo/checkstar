<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RiderDeliverySeeder extends Seeder
{
    private const DISTRICTS = [
        'Durban Central' => ['lat' => -29.8587, 'lng' => 31.0218],
        'Umhlanga' => ['lat' => -29.7284, 'lng' => 31.0781],
        'Pinetown' => ['lat' => -29.8193, 'lng' => 30.8732],
        'Westville' => ['lat' => -29.8397, 'lng' => 30.9249],
        'Berea' => ['lat' => -29.8455, 'lng' => 30.9900],
        'Morningside' => ['lat' => -29.8300, 'lng' => 31.0100],
        'Florida Road' => ['lat' => -29.8280, 'lng' => 31.0180],
        'Windermere' => ['lat' => -29.8350, 'lng' => 31.0050],
    ];

    public function run(): void
    {
        if (DB::table('rider_deliveries')->exists()) {
            $this->command?->info('Rider deliveries already seeded; skipping.');

            return;
        }

        $riderIds = DB::table('riders')->pluck('id')->toArray();
        $orderIds = DB::table('orders')
            ->where('status', 'delivered')
            ->whereNotNull('rider_id')
            ->pluck('id')
            ->toArray();

        if (empty($riderIds) || empty($orderIds)) {
            $this->command?->warn('Skipped RiderDeliverySeeder: no riders or delivered orders found.');

            return;
        }

        $this->command?->info('Seeding rider delivery data...');

        $deliveries = [];
        foreach ($orderIds as $orderId) {
            $district = self::DISTRICTS[array_rand(self::DISTRICTS)];
            $distance = mt_rand(1500, 12000) / 1000; // 1.5–12 km
            $deliveryMinutes = max(10, (int) ($distance * 3 + mt_rand(5, 20))); // ~20 km/h avg

            $deliveries[] = [
                'order_id' => $orderId,
                'distance_km' => round($distance, 2),
                'delivery_minutes' => $deliveryMinutes,
                'delivery_lat' => $district['lat'] + (mt_rand(-20, 20) / 1000),
                'delivery_lng' => $district['lng'] + (mt_rand(-20, 20) / 1000),
                'created_at' => now()->subDays(rand(0, 29)),
            ];
        }

        DB::table('rider_deliveries')->insert($deliveries);

        $this->command?->info('Created '.count($deliveries).' rider delivery records.');
    }
}
