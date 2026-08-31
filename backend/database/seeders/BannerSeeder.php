<?php

namespace Database\Seeders;

use App\Models\BannerCreative;
use App\Models\Store;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class BannerSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::first();

        $banners = [
            [
                'name' => 'Welcome to Checkstar',
                'store_id' => $store?->id,
                'status' => 'published',
                'start_date' => Carbon::now()->subDays(7),
                'end_date' => Carbon::now()->addDays(60),
                'created_by' => 1,
                'slides' => [
                    [
                        'title' => 'Fresh Groceries, Delivered Fast',
                        'subtitle' => 'Durban\'s favourite supermarket — now online',
                        'ctaLabel' => 'Shop Now',
                        'url' => '/products',
                        'bgType' => 'gradient',
                        'colors' => ['#EB6522', '#F58220'],
                        'pattern' => 'dots',
                    ],
                    [
                        'title' => 'Free Delivery on First Order',
                        'subtitle' => 'Use code WELCOME at checkout',
                        'ctaLabel' => 'Get Started',
                        'url' => '/products',
                        'bgType' => 'gradient',
                        'colors' => ['#1B1816', '#3D3530'],
                        'pattern' => 'lines',
                    ],
                    [
                        'title' => 'Winter Warmers Sale',
                        'subtitle' => 'Up to 30% off selected items',
                        'ctaLabel' => 'View Specials',
                        'url' => '/specials',
                        'bgType' => 'gradient',
                        'colors' => ['#2563EB', '#1D4ED8'],
                        'pattern' => 'circles',
                    ],
                ],
            ],
            [
                'name' => 'Spring Promo',
                'store_id' => $store?->id,
                'status' => 'published',
                'start_date' => Carbon::now()->subDays(2),
                'end_date' => Carbon::now()->addDays(30),
                'created_by' => 1,
                'slides' => [
                    [
                        'title' => 'Spring Into Savings',
                        'subtitle' => 'Fresh produce at unbeatable prices',
                        'ctaLabel' => 'Shop Fresh',
                        'url' => '/products',
                        'bgType' => 'gradient',
                        'colors' => ['#16A34A', '#15803D'],
                        'pattern' => 'dots',
                    ],
                    [
                        'title' => 'Download the App',
                        'subtitle' => 'Shop, track, and save — all in one place',
                        'ctaLabel' => 'Get the App',
                        'url' => '/about',
                        'bgType' => 'solid',
                        'colors' => ['#EB6522'],
                        'pattern' => 'lines',
                    ],
                ],
            ],
        ];

        foreach ($banners as $bannerData) {
            BannerCreative::create($bannerData);
        }
    }
}
