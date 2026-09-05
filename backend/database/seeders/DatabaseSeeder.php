<?php

namespace Database\Seeders;

use App\Enums\UserRole;
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
    }
}
