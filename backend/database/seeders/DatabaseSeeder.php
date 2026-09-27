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
        // must opt in (and should override the credentials) via env. An
        // env var that is present but EMPTY counts as unset (`?:`), or the
        // demo accounts would ship with empty-string passwords.
        $developerPassword = env('DEVELOPER_PASSWORD') ?: 'password';
        $seedDemoAccounts = ! app()->environment('production') || $developerPassword !== 'password';

        if ($seedDemoAccounts) {
            User::firstOrCreate(
                ['email' => env('DEVELOPER_EMAIL') ?: 'dev@checkstar.co.za'],
                [
                    'name' => 'Developer',
                    'password' => Hash::make($developerPassword),
                    'role' => UserRole::Developer,
                    'phone' => '+27 82 000 0000',
                    'is_active' => true,
                ]
            );
        }

        // firstOrCreate keeps `db:seed` idempotent instead of dying on the
        // users.email unique index when demo data already exists.
        User::firstOrCreate(
            ['email' => env('DEMO_CUSTOMER_EMAIL') ?: 'john@example.com'],
            [
                'name' => 'John Customer',
                'password' => Hash::make(env('DEMO_CUSTOMER_PASSWORD') ?: 'password'),
                'role' => UserRole::Customer,
                'phone' => '+27 72 000 0000',
                'is_active' => true,
            ]
        );

        $this->call([
            StoreSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            SouthAfricanPantrySeeder::class,
            RiderSeeder::class,
            OrderSeeder::class,
            RecipeSeeder::class,
            SouthAfricanRecipeSeeder::class,
            CommunityPostSeeder::class,
            CareerSeeder::class,
            UserTrackingSeeder::class,
            RiderDeliverySeeder::class,
            SpecialSeeder::class,
            BannerSeeder::class,
        ]);

        // Demo store manager: without a staff-linked login the operations
        // console is unreachable from seeded data. Created after StoreSeeder
        // (it links to the flagship store). Same production guard as the
        // accounts above.
        if ($seedDemoAccounts) {
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

            // Demo store owner: resolves a Store through stores.owner_id
            // (see StoreContext / User::store). The flagship is only adopted
            // when unowned — never steal a real owner's store on re-seed.
            $owner = User::firstOrCreate(
                ['email' => 'owner@checkstar.co.za'],
                [
                    'name' => 'Store Owner',
                    'password' => Hash::make('password'),
                    'role' => UserRole::StoreOwner,
                    'phone' => '+27 82 000 0002',
                    'is_active' => true,
                ]
            );

            if ($flagship !== null && ($flagship->owner_id === null || (int) $flagship->owner_id === (int) $owner->id)) {
                $flagship->owner_id = $owner->id;
                $flagship->save();
            }

            // Demo logistics officer: resolves a Store through StoreStaff,
            // same as the manager.
            $logistics = User::firstOrCreate(
                ['email' => 'logistics@checkstar.co.za'],
                [
                    'name' => 'Logistics Officer',
                    'password' => Hash::make('password'),
                    'role' => UserRole::LogisticsOfficer,
                    'phone' => '+27 82 000 0003',
                    'is_active' => true,
                ]
            );

            if ($flagship !== null) {
                StoreStaff::firstOrCreate(
                    ['user_id' => $logistics->id],
                    ['store_id' => $flagship->id, 'role' => 'logistics_officer']
                );
            }

            // Demo/mock shopper for trying the customer app (cart, checkout).
            User::firstOrCreate(
                ['email' => 'mock@checkstar.co.za'],
                [
                    'name' => 'Mock Shopper',
                    'password' => Hash::make('password'),
                    'role' => UserRole::Customer,
                    'phone' => '+27 72 000 0001',
                    'is_active' => true,
                ]
            );
        }
    }
}
