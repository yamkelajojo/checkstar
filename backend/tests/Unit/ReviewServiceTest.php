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
use App\Services\GamificationService;
use App\Services\ReviewService;
use App\Services\RiderStatsRecorder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewServiceTest extends TestCase
{
    use RefreshDatabase;

    private ReviewService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->app->bind(ReviewService::class, fn () => new ReviewService(
            new RiderStatsRecorder,
            new GamificationService,
        ));

        $this->service = app(ReviewService::class);
    }

    private function createStore(): Store
    {
        return Store::create([
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
    }

    private function createRider(): Rider
    {
        $user = User::create([
            'name' => 'Rider One',
            'email' => 'rider@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Rider,
            'is_active' => true,
        ]);

        return Rider::create([
            'user_id' => $user->id,
            'is_available' => true,
            'max_radius_km' => 10,
            'total_deliveries' => 0,
            'average_rating' => 0,
            'xp' => 0,
            'level' => 1,
        ]);
    }

    private function createCustomer(): User
    {
        return User::create([
            'name' => 'Customer One',
            'email' => 'customer@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);
    }

    private function createDeliveredOrder(Rider $rider, User $customer): Order
    {
        return Order::create([
            'order_number' => 'ORD-'.uniqid(),
            'customer_id' => $customer->id,
            'rider_id' => $rider->id,
            'store_id' => $this->createStore()->id,
            'status' => OrderStatus::Delivered,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 100,
            'delivery_fee' => 10,
            'total' => 110,
            'delivery_latitude' => -29.8600,
            'delivery_longitude' => 31.0200,
        ]);
    }

    public function test_submit_review_success(): void
    {
        $rider = $this->createRider();
        $customer = $this->createCustomer();
        $order = $this->createDeliveredOrder($rider, $customer);

        $result = $this->service->submitReview($customer, $order->id, 5, 'Great delivery!');

        $this->assertTrue($result['success']);
        $this->assertEquals('Review submitted', $result['message']);
        $this->assertNotNull($result['order']);

        $review = Review::where('order_id', $order->id)->first();
        $this->assertNotNull($review);
        $this->assertEquals(5, $review->rating);
        $this->assertEquals('Great delivery!', $review->comment);
        $this->assertEquals($customer->id, $review->reviewer_id);
        $this->assertEquals($rider->id, $review->rider_id);
    }

    public function test_submit_review_updates_order_rating(): void
    {
        $rider = $this->createRider();
        $customer = $this->createCustomer();
        $order = $this->createDeliveredOrder($rider, $customer);

        $this->service->submitReview($customer, $order->id, 4);

        $fresh = $order->fresh();
        $this->assertEquals(4, $fresh->rider_rating);
        $this->assertEquals(null, $fresh->rider_review);
    }

    public function test_submit_review_rejects_order_without_rider(): void
    {
        $customer = $this->createCustomer();
        $store = $this->createStore();

        $order = Order::create([
            'order_number' => 'ORD-'.uniqid(),
            'customer_id' => $customer->id,
            'rider_id' => null,
            'store_id' => $store->id,
            'status' => OrderStatus::Delivered,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 100,
            'delivery_fee' => 10,
            'total' => 110,
            'delivery_latitude' => -29.8600,
            'delivery_longitude' => 31.0200,
        ]);

        $result = $this->service->submitReview($customer, $order->id, 5);

        $this->assertFalse($result['success']);
        $this->assertEquals('No rider assigned to this order', $result['message']);
    }

    public function test_submit_review_rejects_non_delivered_order(): void
    {
        $rider = $this->createRider();
        $customer = $this->createCustomer();
        $store = $this->createStore();

        $order = Order::create([
            'order_number' => 'ORD-'.uniqid(),
            'customer_id' => $customer->id,
            'rider_id' => $rider->id,
            'store_id' => $store->id,
            'status' => OrderStatus::Confirmed,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 100,
            'delivery_fee' => 10,
            'total' => 110,
            'delivery_latitude' => -29.8600,
            'delivery_longitude' => 31.0200,
        ]);

        $result = $this->service->submitReview($customer, $order->id, 5);

        $this->assertFalse($result['success']);
        $this->assertEquals('Order must be delivered before reviewing', $result['message']);
    }

    public function test_submit_review_rejects_duplicate_review(): void
    {
        $rider = $this->createRider();
        $customer = $this->createCustomer();
        $order = $this->createDeliveredOrder($rider, $customer);

        $this->service->submitReview($customer, $order->id, 5);
        $result = $this->service->submitReview($customer, $order->id, 4);

        $this->assertFalse($result['success']);
        $this->assertEquals('Already reviewed', $result['message']);
    }

    public function test_submit_review_creates_review_record(): void
    {
        $rider = $this->createRider();
        $customer = $this->createCustomer();
        $order = $this->createDeliveredOrder($rider, $customer);

        $this->service->submitReview($customer, $order->id, 3, 'OK');

        $this->assertDatabaseHas('reviews', [
            'order_id' => $order->id,
            'reviewer_id' => $customer->id,
            'rider_id' => $rider->id,
            'rating' => 3,
            'comment' => 'OK',
        ]);
    }

    public function test_submit_review_updates_rider_average_rating(): void
    {
        $rider = $this->createRider();
        $customer = $this->createCustomer();
        $order = $this->createDeliveredOrder($rider, $customer);

        $this->service->submitReview($customer, $order->id, 5);

        $fresh = $rider->fresh();
        $this->assertEquals(5.0, (float) $fresh->average_rating);
    }

    public function test_submit_review_throws_on_nonexistent_order(): void
    {
        $customer = $this->createCustomer();

        $this->expectException(ModelNotFoundException::class);

        $this->service->submitReview($customer, 99999, 5);
    }
}
