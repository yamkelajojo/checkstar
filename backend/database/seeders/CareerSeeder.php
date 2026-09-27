<?php

namespace Database\Seeders;

use App\Enums\CareerType;
use App\Models\CareerListing;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * The public Careers page and the admin Careers console both read from
 * `career_listings`, but nothing ever seeded it — so a freshly seeded
 * prototype showed an empty "no openings" state on a page whose whole job is
 * to list openings. Idempotent via firstOrCreate on slug.
 */
class CareerSeeder extends Seeder
{
    public function run(): void
    {
        $listings = [
            [
                'title' => 'Delivery Rider — Durban Central',
                'department' => 'Logistics',
                'location' => 'Durban Central, KwaZulu-Natal',
                'type' => CareerType::FullTime,
                'description' => 'Join the motorbike fleet delivering groceries across Durban Central. You will collect packed orders from the store, ride optimized routes, and hand over with a smile. A valid Code A licence and your own smartphone are required; the bike and delivery kit are ours.',
                'requirements' => "Valid South African Code A motorcycle licence\nOwn smartphone (Android 12+) for the rider app\nComfortable riding in city traffic, rain included\nCustomer-friendly and punctual",
            ],
            [
                'title' => 'Store Manager — Umhlanga',
                'department' => 'Store Operations',
                'location' => 'Umhlanga, KwaZulu-Natal',
                'type' => CareerType::FullTime,
                'description' => 'Own the day-to-day of our Umhlanga store: stock accuracy, staff rosters, freshness standards and the delivery pick-pack flow that feeds the rider fleet. You will run the store console daily and report to the store owner.',
                'requirements' => "3+ years retail management experience\nExperience with stock control and shrinkage management\nConfident with dashboards and inventory tooling\nMatric / Grade 12 or equivalent",
            ],
            [
                'title' => 'Pick-Pack Associate (Part-Time)',
                'department' => 'Store Operations',
                'location' => 'Durban Central, KwaZulu-Natal',
                'type' => CareerType::PartTime,
                'description' => 'Assemble customer orders from the shop floor as they come in, flag substitutions, and hand packed baskets to riders on time. Weekend availability is essential — that is when the order book peaks.',
                'requirements' => "Fast, careful and detail-oriented\nAble to work weekends and public holidays\nBasic smartphone literacy",
            ],
            [
                'title' => 'Logistics Officer — Dispatch Desk',
                'department' => 'Logistics',
                'location' => 'Durban (Hybrid)',
                'type' => CareerType::FullTime,
                'description' => 'Sit on the dispatch desk: monitor live deliveries, balance rider load across our three stores, and step in when auto-dispatch needs a human judgement call. You will live in the operations console and talk to riders all day.',
                'requirements' => "2+ years in dispatch, fleet or operations coordination\nCalm under pressure when the order book spikes\nComfortable reading maps, ETAs and live telemetry",
            ],
            [
                'title' => 'Full-Stack Developer (Laravel + Next.js)',
                'department' => 'Technology',
                'location' => 'Remote (South Africa)',
                'type' => CareerType::Contract,
                'description' => 'Help build the Checkstar commerce platform: a Laravel API, a Next.js storefront and an Expo mobile app used by customers and riders across Durban. Six-month contract with a view to permanent.',
                'requirements' => "Strong PHP/Laravel and TypeScript/React experience\nExperience shipping and operating production APIs\nFamiliarity with Expo / React Native is a plus",
            ],
            [
                'title' => 'Customer Care Consultant',
                'department' => 'Customer',
                'location' => 'Durban Central, KwaZulu-Natal',
                'type' => CareerType::PartTime,
                'description' => 'Be the voice of Checkstar: answer calls and messages about orders, refunds and deliveries, and turn every complaint into a reason to come back. Shift-based, including Saturday mornings.',
                'requirements' => "Excellent written and spoken English\nPatient, warm and solution-oriented\nPrevious contact-centre or retail service experience preferred",
            ],
        ];

        foreach ($listings as $listing) {
            CareerListing::firstOrCreate(
                ['slug' => Str::slug($listing['title'])],
                [
                    'title' => $listing['title'],
                    'description' => $listing['description'],
                    'requirements' => $listing['requirements'],
                    'location' => $listing['location'],
                    'type' => $listing['type'],
                    'department' => $listing['department'],
                    'is_active' => true,
                    'closes_at' => now()->addDays(45)->toDateString(),
                ]
            );
        }

        $this->command?->info('Careers seeded: '.count($listings).' listings.');
    }
}
