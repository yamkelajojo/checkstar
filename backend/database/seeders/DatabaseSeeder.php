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
        User::create([
            'name' => 'Developer',
            'email' => 'dev@checkstar.co.za',
            'password' => Hash::make('password'),
            'role' => UserRole::Developer,
            'phone' => '+27 82 000 0000',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'John Customer',
            'email' => 'john@example.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Customer,
            'phone' => '+27 72 000 0000',
            'is_active' => true,
        ]);

        $this->call([
            StoreSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            RiderSeeder::class,
            RecipeSeeder::class,
            CommunityPostSeeder::class,
        ]);
    }
}
