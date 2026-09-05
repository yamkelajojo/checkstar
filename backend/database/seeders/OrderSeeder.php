<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class OrderSeeder extends Seeder
{
    private const STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

    private const STATUS_WEIGHTS = [5, 10, 10, 10, 60, 5];

    private const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'];

    private const DELIVERY_ADDRESSES = [
        '12 Mandela Avenue, Durban',
        '45 Smith Street, Durban',
        '78 Umbilo Road, Durban',
        '123 Florida Road, Durban',
        '456 Windermere Road, Durban',
        '789 Berea Road, Durban',
        '321 Joe Slovo Street, Durban',
        '654 Dr Pixley KaSeme Street, Durban',
        '988 Umgeni Road, Durban',
        '147 Argyle Road, Durban',
        '258 Greenside Drive, Durban',
        '369 Musgrave Road, Durban',
    ];

    public function run(): void
    {
        // Bulk demo data with fixed order numbers — only seed once.
        if (DB::table('orders')->exists()) {
            $this->command?->info('Orders already seeded; skipping.');

            return;
        }

        $storeIds = DB::table('stores')->pluck('id')->toArray();
        $productIds = DB::table('products')->pluck('id')->toArray();
        $riderIds = DB::table('riders')->pluck('id')->toArray();
        $customerIds = DB::table('users')->where('role', 'customer')->pluck('id')->toArray();

        if (empty($storeIds) || empty($productIds)) {
            $this->command?->warn('Skipped OrderSeeder: no stores or products found. Run StoreSeeder and ProductSeeder first.');

            return;
        }

        if (empty($customerIds)) {
            $this->createCustomers(20);
            $customerIds = DB::table('users')->where('role', 'customer')->pluck('id')->toArray();
        }

        $orderCount = rand(500, 1000);
        $this->command?->info("Seeding {$orderCount} orders over 30 days...");

        $orders = [];
        $orderItems = [];
        $orderNum = 1;

        for ($day = 0; $day < 30; $day++) {
            $date = Carbon::now()->subDays(29 - $day);
            $isWeekend = $date->isSaturday() || $date->isSunday();
            $dailyCount = $isWeekend ? rand(40, 60) : rand(25, 45);

            for ($i = 0; $i < $dailyCount && $orderNum <= $orderCount; $i++) {
                $hour = $this->weightedHour();
                $minute = rand(0, 59);
                $createdAt = $date->copy()->hour($hour)->minute($minute);

                $storeId = $storeIds[array_rand($storeIds)];
                $customerId = $customerIds[array_rand($customerIds)];
                $status = $this->weightedRandom(self::STATUSES, self::STATUS_WEIGHTS);
                $paymentStatus = $status === 'cancelled' ? 'refunded' : ($status === 'delivered' ? 'paid' : 'pending');

                $subtotal = $this->gaussianRandom(350, 120, 150, 800);
                $deliveryFee = 50;
                $total = $subtotal + $deliveryFee;
                $address = self::DELIVERY_ADDRESSES[array_rand(self::DELIVERY_ADDRESSES)];

                $riderId = in_array($status, ['out_for_delivery', 'delivered']) && ! empty($riderIds)
                    ? $riderIds[array_rand($riderIds)]
                    : null;

                $customerConfirmedAt = $status === 'delivered'
                    ? $createdAt->copy()->addMinutes(rand(20, 60))
                    : null;

                $orders[] = [
                    'order_number' => 'ORD-'.str_pad($orderNum, 6, '0', STR_PAD_LEFT),
                    'customer_id' => $customerId,
                    'rider_id' => $riderId,
                    'store_id' => $storeId,
                    'status' => $status,
                    'payment_status' => $paymentStatus,
                    'delivery_address' => $address,
                    'delivery_latitude' => -29.85 + (mt_rand(-50, 50) / 1000),
                    'delivery_longitude' => 31.02 + (mt_rand(-50, 50) / 1000),
                    'subtotal' => $subtotal,
                    'delivery_fee' => $deliveryFee,
                    'total' => $total,
                    'customer_confirmed_at' => $customerConfirmedAt,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];

                $itemCount = rand(1, 8);
                $usedProducts = [];
                for ($j = 0; $j < $itemCount; $j++) {
                    do {
                        $productId = $productIds[array_rand($productIds)];
                    } while (in_array($productId, $usedProducts));

                    $usedProducts[] = $productId;
                    $quantity = rand(1, 4);
                    $unitPrice = $this->gaussianRandom(45, 20, 10, 200);

                    $orderItems[] = [
                        'order_id' => $orderNum,
                        'product_id' => $productId,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'total_price' => round($unitPrice * $quantity, 2),
                        'product_snapshot' => json_encode(['name' => "Product #{$productId}"]),
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ];
                }

                $orderNum++;
            }
        }

        DB::table('orders')->insert($orders);
        DB::table('order_items')->insert($orderItems);

        $this->command?->info("Created {$orderNum} orders with ".count($orderItems).' items.');
    }

    private function createCustomers(int $count): void
    {
        $this->command?->info("Creating {$count} test customers...");
        for ($i = 0; $i < $count; $i++) {
            DB::table('users')->insert([
                'name' => "Customer {$i}",
                'email' => "customer{$i}@test.example.com",
                'password' => bcrypt('password'),
                'role' => 'customer',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function weightedHour(): int
    {
        $weights = [
            0, 0, 0, 0, 0, 0, 0, 0, 1, 2,
            3, 6, 8, 7, 4, 3, 5, 7, 6, 4,
            3, 2, 1, 0,
        ];

        return $this->weightedRandom(array_keys($weights), $weights);
    }

    private function weightedRandom(array $values, array $weights): mixed
    {
        $total = array_sum($weights);
        $rand = mt_rand(1, $total);
        $cumulative = 0;
        foreach ($values as $i => $value) {
            $cumulative += $weights[$i];
            if ($rand <= $cumulative) {
                return $value;
            }
        }

        return end($values);
    }

    private function gaussianRandom(float $mean, float $stdDev, float $min, float $max): float
    {
        $u1 = mt_rand() / mt_getrandmax();
        $u2 = mt_rand() / mt_getrandmax();
        $z = sqrt(-2 * log($u1)) * cos(2 * M_PI * $u2);

        return max($min, min($max, $mean + $z * $stdDev));
    }
}
