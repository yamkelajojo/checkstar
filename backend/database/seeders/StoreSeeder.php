<?php

namespace Database\Seeders;

use App\Models\Store;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    public function run(): void
    {
        Store::firstOrCreate(['slug' => 'durban-central'], [
            'name' => 'Checkstar Durban Central',
                        'description' => 'Our flagship store in the heart of Durban.',
            'address' => '123 West Street',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4001',
            'latitude' => -29.8587,
            'longitude' => 31.0218,
            'delivery_radius_km' => 10,
            'phone' => '+27 31 555 0100',
            'email' => 'central@checkstar.co.za',
            'trading_hours' => json_encode([
                'monday' => ['open' => '07:00', 'close' => '20:00'],
                'tuesday' => ['open' => '07:00', 'close' => '20:00'],
                'wednesday' => ['open' => '07:00', 'close' => '20:00'],
                'thursday' => ['open' => '07:00', 'close' => '20:00'],
                'friday' => ['open' => '07:00', 'close' => '21:00'],
                'saturday' => ['open' => '08:00', 'close' => '20:00'],
                'sunday' => ['open' => '09:00', 'close' => '17:00'],
            ]),
            'is_active' => true,
        ]);

        Store::firstOrCreate(['slug' => 'umhlanga'], [
            'name' => 'Checkstar Umhlanga',
                        'description' => 'Serving the Umhlanga community.',
            'address' => '45 Lighthouse Road',
            'city' => 'Umhlanga',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4319',
            'latitude' => -29.7267,
            'longitude' => 31.0856,
            'delivery_radius_km' => 12,
            'phone' => '+27 31 555 0200',
            'email' => 'umhlanga@checkstar.co.za',
            'trading_hours' => json_encode([
                'monday' => ['open' => '07:00', 'close' => '20:00'],
                'tuesday' => ['open' => '07:00', 'close' => '20:00'],
                'wednesday' => ['open' => '07:00', 'close' => '20:00'],
                'thursday' => ['open' => '07:00', 'close' => '20:00'],
                'friday' => ['open' => '07:00', 'close' => '21:00'],
                'saturday' => ['open' => '08:00', 'close' => '20:00'],
                'sunday' => ['open' => '09:00', 'close' => '17:00'],
            ]),
            'is_active' => true,
        ]);

        Store::firstOrCreate(['slug' => 'pinetown'], [
            'name' => 'Checkstar Pinetown',
                        'description' => 'Your local Checkstar in Pinetown.',
            'address' => '78 Main Road',
            'city' => 'Pinetown',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '3610',
            'latitude' => -29.8167,
            'longitude' => 30.8833,
            'delivery_radius_km' => 10,
            'phone' => '+27 31 555 0300',
            'email' => 'pinetown@checkstar.co.za',
            'trading_hours' => json_encode([
                'monday' => ['open' => '07:00', 'close' => '20:00'],
                'tuesday' => ['open' => '07:00', 'close' => '20:00'],
                'wednesday' => ['open' => '07:00', 'close' => '20:00'],
                'thursday' => ['open' => '07:00', 'close' => '20:00'],
                'friday' => ['open' => '07:00', 'close' => '21:00'],
                'saturday' => ['open' => '08:00', 'close' => '20:00'],
                'sunday' => ['open' => '09:00', 'close' => '17:00'],
            ]),
            'is_active' => true,
        ]);
    }
}
