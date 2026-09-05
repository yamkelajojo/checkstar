<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Store;
use App\Models\StoreStaff;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // The seeded developer account ships a well-known password by
        // default. Never create it implicitly in production — the operator
        // must opt in (and should override the credentials) via env.
        $seedDeveloper = ! app()->environment('production') || env('DEVELOPER_PASSWORD') !== null;

        if ($seedDeveloper) {
            User::firstOrCreate(
                ['email' => env('DEVELOPER_EMAIL', 'dev@checkstar.co.za')],
                [
                    'name' => 'Developer',
                    'password' => Hash::make(env('DEVELOPER_PASSWORD', 'password')),
                    'role' => UserRole::Developer,
                    'phone' => '+27 82 000 0000',
                    'is_active' => true,
                ]
            );
        }

        // firstOrCreate keeps `db:seed` idempotent instead of dying on the
        // users.email unique index when demo data already exists.
        User::firstOrCreate(
            ['email' => env('DEMO_CUSTOMER_EMAIL', 'john@example.com')],
            [
                'name' => 'John Customer',
                'password' => Hash::make(env('DEMO_CUSTOMER_PASSWORD', 'password')),
                'role' => UserRole::Customer,
                'phone' => '+27 72 000 0000',
                'is_active' => true,
            ]
        );

        $this->call([
            StoreSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            RiderSeeder::class,
            OrderSeeder::class,
            RecipeSeeder::class,
            CommunityPostSeeder::class,
            UserTrackingSeeder::class,
            RiderDeliverySeeder::class,
            SpecialSeeder::class,
            BannerSeeder::class,
        ]);

        // Demo store manager: without a staff-linked login the operations
        // console is unreachable from seeded data. Created after StoreSeeder
        // (it links to the flagship store). Same production guard as the
        // accounts above.
        if (! app()->environment('production') || env('DEVELOPER_PASSWORD') !== null) {
            $manager = User::firstOrCreate(
                ['email' => 'manager@checkstar.co.za'],
                [
                    'name' => 'Store Manager',
                    'password' => Hash::make('password'),
                    'role' => UserRole::StoreManager,
                    'phone' => '+27 82 000 0001',
                    'is_active' => true,
                ]
            );

            $flagship = Store::where('slug', 'durban-central')->first();
            if ($flagship !== null) {
                StoreStaff::firstOrCreate(
                    ['user_id' => $manager->id],
                    ['store_id' => $flagship->id, 'role' => 'store_manager']
                );
            }
        }
    }
}
