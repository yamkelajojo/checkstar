<?php

namespace Database\Seeders;

use App\Models\CommunityPost;
use Illuminate\Database\Seeder;

class CommunityPostSeeder extends Seeder
{
    public function run(): void
    {
        CommunityPost::create([
            'title' => 'Checkstar Supports Local Schools',
            'slug' => 'checkstar-supports-local-schools',
            'content' => 'We donated school supplies to 5 primary schools in the Durban area. Thank you to our customers for making this possible!',
            'category' => 'csr',
            'event_date' => '2026-06-15',
            'is_published' => true,
        ]);

        CommunityPost::create([
            'title' => 'Store Grand Opening - Umhlanga',
            'slug' => 'umhlanga-grand-opening',
            'content' => 'Our new Umhlanga store is now open! Come visit us at 45 Lighthouse Road.',
            'category' => 'gallery',
            'event_date' => '2026-05-01',
            'is_published' => true,
        ]);

        CommunityPost::create([
            'title' => 'Food Drive 2026',
            'slug' => 'food-drive-2026',
            'content' => 'Join us for our annual food drive. Donate non-perishable items at any Checkstar store.',
            'category' => 'csr',
            'event_date' => '2026-07-20',
            'is_published' => true,
        ]);

        CommunityPost::create([
            'title' => 'Durban Beach Clean-up',
            'slug' => 'durban-beach-cleanup',
            'content' => 'Our team spent the morning cleaning up North Beach. Small actions make a big difference!',
            'category' => 'gallery',
            'event_date' => '2026-04-22',
            'is_published' => true,
        ]);
    }
}
