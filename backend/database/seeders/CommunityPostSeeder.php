<?php

namespace Database\Seeders;

use App\Models\CommunityPost;
use Illuminate\Database\Seeder;

class CommunityPostSeeder extends Seeder
{
    public function run(): void
    {
        CommunityPost::firstOrCreate(['slug' => 'checkstar-supports-local-schools'], [
            'title' => 'Checkstar Supports Local Schools',
            
            'content' => 'We donated school supplies to 5 primary schools in the Durban area. Thank you to our customers for making this possible!',
            'category' => 'csr',
            'event_date' => '2026-06-15',
            'is_published' => true,
        ]);

        CommunityPost::firstOrCreate(['slug' => 'umhlanga-grand-opening'], [
            'title' => 'Store Grand Opening - Umhlanga',
            
            'content' => 'Our new Umhlanga store is now open! Come visit us at 45 Lighthouse Road.',
            'category' => 'gallery',
            'event_date' => '2026-05-01',
            'is_published' => true,
        ]);

        CommunityPost::firstOrCreate(['slug' => 'food-drive-2026'], [
            'title' => 'Food Drive 2026',
            
            'content' => 'Join us for our annual food drive. Donate non-perishable items at any Checkstar store.',
            'category' => 'csr',
            'event_date' => '2026-07-20',
            'is_published' => true,
        ]);

        CommunityPost::firstOrCreate(['slug' => 'durban-beach-cleanup'], [
            'title' => 'Durban Beach Clean-up',
            
            'content' => 'Our team spent the morning cleaning up North Beach. Small actions make a big difference!',
            'category' => 'gallery',
            'event_date' => '2026-04-22',
            'is_published' => true,
        ]);
    }
}
