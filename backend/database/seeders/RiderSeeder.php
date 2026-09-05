<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Rider;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RiderSeeder extends Seeder
{
    public function run(): void
    {
        $riderData = [
            [
                'name' => 'Thabo Mokoena',
                'email' => 'thabo@checkstar.co.za',
                'store_slug' => 'durban-central',
                'vehicle_type' => 'motorbike',
                'total_deliveries' => 45,
                'average_rating' => 4.7,
                'xp' => 340,
                'level' => 17,
            ],
            [
                'name' => 'Lindiwe Nkosi',
                'email' => 'lindiwe@checkstar.co.za',
                'store_slug' => 'durban-central',
                'vehicle_type' => 'scooter',
                'total_deliveries' => 28,
                'average_rating' => 4.5,
                'xp' => 210,
                'level' => 10,
            ],
            [
                'name' => 'Sipho Dlamini',
                'email' => 'sipho@checkstar.co.za',
                'store_slug' => 'umhlanga',
                'vehicle_type' => 'motorbike',
                'total_deliveries' => 112,
                'average_rating' => 4.9,
                'xp' => 890,
                'level' => 44,
            ],
            [
                'name' => 'Zanele Khumalo',
                'email' => 'zanele@checkstar.co.za',
                'store_slug' => 'umhlanga',
                'vehicle_type' => 'motorbike',
                'total_deliveries' => 67,
                'average_rating' => 4.3,
                'xp' => 510,
                'level' => 25,
            ],
            [
                'name' => 'Bongani Zulu',
                'email' => 'bongani@checkstar.co.za',
                'store_slug' => 'pinetown',
                'vehicle_type' => 'scooter',
                'total_deliveries' => 15,
                'average_rating' => 4.1,
                'xp' => 110,
                'level' => 5,
            ],
        ];

        foreach ($riderData as $data) {
            // Never trust hard-coded store ids: resolve by slug (MySQL does
            // not reset auto-increment after rolled-back transactions, so
            // literal ids only line up on a pristine database).
            $store = Store::where('slug', $data['store_slug'])->first();
            if ($store === null) {
                throw new \RuntimeException("RiderSeeder: unknown store slug [{$data['store_slug']}] — run StoreSeeder first.");
            }
            $data['store_id'] = $store->id;
            unset($data['store_slug']);

            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('password'),
                    'role' => UserRole::Rider,
                    'phone' => '+27 76 000 0000',
                    'is_active' => true,
                ]
            );

            Rider::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'store_id' => $data['store_id'],
                    'is_available' => false,
                    'vehicle_type' => $data['vehicle_type'],
                    'total_deliveries' => $data['total_deliveries'],
                    'average_rating' => $data['average_rating'],
                    'xp' => $data['xp'],
                    'level' => $data['level'],
                ]
            );
        }
    }
}
