<?php

namespace Database\Seeders;

use App\Models\BannerCreative;
use App\Models\Special;
use App\Models\Store;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class BannerSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::first();
        // Never trust user id 1 — resolve the seeded developer by email
        // (MySQL does not reset auto-increment after rolled-back
        // transactions, so literal ids only line up on a pristine DB).
        $creatorId = (int) (\App\Models\User::query()->min('id') ?? 0);
        if ($creatorId === 0) {
            $this->command?->warn('Skipped BannerSeeder: no users exist yet.');

            return;
        }

        // A banner is either a standalone branding banner or the visual
        // face of exactly one sale (special_id). The Winter Warmers sale
        // gets its own dedicated sale banner; the rest stay standalone.
        $winterWarmers = Special::where('slug', 'winter-warmers')->first();

        $banners = [
            [
                'name' => 'Winter Warmers Sale',
                'store_id' => $store?->id,
                'status' => 'published',
                'start_date' => Carbon::now()->subDays(14),
                'end_date' => Carbon::now()->addDays(30),
                'created_by' => $creatorId,
                'special_id' => $winterWarmers?->id,
                'slides' => [
                    [
                        'title' => 'Winter Warmers Sale',
                        'subtitle' => 'Up to 30% off selected items',
                        'ctaLabel' => 'View sale',
                        'url' => $winterWarmers ? '/specials/'.$winterWarmers->slug : '/specials',
                        'bgType' => 'gradient',
                        'colors' => ['#2563EB', '#1D4ED8'],
                        'pattern' => 'circles',
                    ],
                ],
            ],
            [
                'name' => 'Welcome to Checkstar',
                'store_id' => $store?->id,
                'status' => 'published',
                'start_date' => Carbon::now()->subDays(7),
                'end_date' => Carbon::now()->addDays(60),
                'created_by' => $creatorId,
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
                ],
            ],
            [
                'name' => 'Spring Promo',
                'store_id' => $store?->id,
                'status' => 'published',
                'start_date' => Carbon::now()->subDays(2),
                'end_date' => Carbon::now()->addDays(30),
                'created_by' => $creatorId,
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
            // banner_creatives has no unique key — match by name so
            // re-seeding does not stack duplicates.
            BannerCreative::firstOrCreate(['name' => $bannerData['name']], $bannerData);
        }
    }
}
