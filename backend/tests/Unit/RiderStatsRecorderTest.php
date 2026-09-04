<?php

namespace Tests\Unit;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Review;
use App\Models\Rider;
use App\Models\Store;
use App\Models\User;
use App\Services\RiderStatsRecorder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RiderStatsRecorderTest extends TestCase
{
    use RefreshDatabase;

    private RiderStatsRecorder $service;

    private Rider $rider;

    private Store $store;

    private User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new RiderStatsRecorder;

        $user = User::create([
            'name' => 'Rider One',
            'email' => 'rider@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Rider,
            'is_active' => true,
        ]);

        $this->rider = Rider::create([
            'user_id' => $user->id,
            'is_available' => true,
            'max_radius_km' => 10,
            'total_deliveries' => 0,
            'average_rating' => 0,
            'xp' => 0,
            'level' => 1,
        ]);

        $this->store = Store::create([
            'name' => 'Test Store',
            'slug' => 'test-store',
            'city' => 'Durban',
            'province' => 'KZN',
            'postal_code' => '4001',
            'address' => '123 Test St',
            'phone' => '0311234567',
            'latitude' => -29.8587,
            'longitude' => 31.0218,
            'delivery_radius_km' => 10,
            'is_active' => true,
        ]);

        $this->customer = User::create([
            'name' => 'Customer',
            'email' => 'customer@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);
    }

    private function createReview(Rider $rider, int $rating): Review
    {
        $order = Order::create([
            'order_number' => 'ORD-'.uniqid(),
            'customer_id' => $this->customer->id,
            'rider_id' => $rider->id,
            'store_id' => $this->store->id,
            'status' => OrderStatus::Delivered,
            'payment_status' => PaymentStatus::Paid,
            'subtotal' => 50,
            'delivery_fee' => 10,
            'total' => 60,
            'delivery_latitude' => -29.8600,
            'delivery_longitude' => 31.0200,
        ]);

        return Review::create([
            'order_id' => $order->id,
            'reviewer_id' => $this->customer->id,
            'rider_id' => $rider->id,
            'rating' => $rating,
            'created_at' => now(),
        ]);
    }

    public function test_first_review_sets_average_rating(): void
    {
        $this->createReview($this->rider, 5);
        $this->service->recordReview($this->rider, 5);

        $fresh = $this->rider->fresh();
        $this->assertEquals(5.0, (float) $fresh->average_rating);
    }

    public function test_second_review_computes_weighted_average(): void
    {
        $this->createReview($this->rider, 5);
        $this->service->recordReview($this->rider, 5);

        $this->createReview($this->rider, 3);
        $this->service->recordReview($this->rider, 3);

        $fresh = $this->rider->fresh();
        // (5 * 1 + 3) / 2 = 4.0
        $this->assertEquals(4.0, (float) $fresh->average_rating);
    }

    public function test_multiple_reviews_compute_correct_average(): void
    {
        $this->createReview($this->rider, 5);
        $this->service->recordReview($this->rider, 5);

        $this->createReview($this->rider, 4);
        $this->service->recordReview($this->rider, 4);

        $this->createReview($this->rider, 3);
        $this->service->recordReview($this->rider, 3);

        $fresh = $this->rider->fresh();
        // (5 + 4 + 3) / 3 = 4.0
        $this->assertEquals(4.0, (float) $fresh->average_rating);
    }

    public function test_review_count_matches_database(): void
    {
        $this->createReview($this->rider, 5);
        $this->service->recordReview($this->rider, 5);

        $this->createReview($this->rider, 4);
        $this->service->recordReview($this->rider, 4);

        $reviewCount = Review::where('rider_id', $this->rider->id)->count();
        $this->assertEquals(2, $reviewCount);
    }

    public function test_rider_must_exist_to_record(): void
    {
        $deletedRider = Rider::create([
            'user_id' => User::create([
                'name' => 'Deleted',
                'email' => 'deleted@test.com',
                'password' => bcrypt('password'),
                'role' => UserRole::Rider,
                'is_active' => true,
            ])->id,
            'is_available' => false,
            'max_radius_km' => 5,
            'total_deliveries' => 0,
            'average_rating' => 0,
            'xp' => 0,
            'level' => 1,
        ]);

        $deletedRider->delete();

        // Should not throw — silently returns
        $this->service->recordReview($deletedRider, 5);

        $this->assertNull($deletedRider->fresh());
    }

    public function test_weighted_average_is_accurate_with_decimals(): void
    {
        $this->createReview($this->rider, 5);
        $this->service->recordReview($this->rider, 5);

        $this->createReview($this->rider, 2);
        $this->service->recordReview($this->rider, 2);

        $fresh = $this->rider->fresh();
        // (5 + 2) / 2 = 3.5
        $this->assertEquals(3.5, (float) $fresh->average_rating);
    }
}
