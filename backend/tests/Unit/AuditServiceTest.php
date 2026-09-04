<?php

namespace Tests\Unit;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditServiceTest extends TestCase
{
    use RefreshDatabase;

    private AuditService $service;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new AuditService;

        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);
    }

    public function test_log_creates_audit_log_with_user_model(): void
    {
        $result = $this->service->log($this->user, 'confirmed', 'order', 1, ['key' => 'value']);

        $this->assertNotNull($result);
        $this->assertEquals($this->user->id, $result->user_id);
        $this->assertEquals('confirmed', $result->action);
        $this->assertEquals('order', $result->entity_type);
        $this->assertEquals(1, $result->entity_id);
        $this->assertEquals(['key' => 'value'], $result->metadata);
    }

    public function test_log_creates_audit_log_with_user_id_int(): void
    {
        $result = $this->service->log($this->user->id, 'dispatched', 'order', 42);

        $this->assertNotNull($result);
        $this->assertEquals($this->user->id, $result->user_id);
        $this->assertEquals('dispatched', $result->action);
        $this->assertEquals('order', $result->entity_type);
        $this->assertEquals(42, $result->entity_id);
    }

    public function test_log_order_confirmed(): void
    {
        $result = $this->service->logOrderConfirmed($this->user, 10);

        $this->assertNotNull($result);
        $this->assertEquals('confirmed', $result->action);
        $this->assertEquals('order', $result->entity_type);
        $this->assertEquals(10, $result->entity_id);
    }

    public function test_log_order_dispatched_includes_rider_id(): void
    {
        $result = $this->service->logOrderDispatched($this->user, 10, 5);

        $this->assertNotNull($result);
        $this->assertEquals('dispatched', $result->action);
        $this->assertEquals(5, $result->metadata['rider_id']);
    }

    public function test_log_order_dispatched_without_rider_id(): void
    {
        $result = $this->service->logOrderDispatched($this->user, 10, null);

        $this->assertNotNull($result);
        $this->assertEquals('dispatched', $result->action);
        $this->assertArrayNotHasKey('rider_id', $result->metadata);
    }

    public function test_log_order_delivered(): void
    {
        $result = $this->service->logOrderDelivered($this->user, 10);

        $this->assertNotNull($result);
        $this->assertEquals('delivered', $result->action);
    }

    public function test_log_order_cancelled_includes_reason(): void
    {
        $result = $this->service->logOrderCancelled($this->user, 10, 'out_of_stock');

        $this->assertNotNull($result);
        $this->assertEquals('cancelled', $result->action);
        $this->assertEquals('out_of_stock', $result->metadata['reason']);
    }

    public function test_log_order_cancelled_without_reason(): void
    {
        $result = $this->service->logOrderCancelled($this->user, 10);

        $this->assertNotNull($result);
        $this->assertEquals('cancelled', $result->action);
        $this->assertArrayNotHasKey('reason', $result->metadata);
    }

    public function test_log_rider_available(): void
    {
        $result = $this->service->logRiderAvailable($this->user, 7);

        $this->assertNotNull($result);
        $this->assertEquals('available', $result->action);
        $this->assertEquals('rider', $result->entity_type);
        $this->assertEquals(7, $result->entity_id);
    }

    public function test_log_rider_unavailable(): void
    {
        $result = $this->service->logRiderUnavailable($this->user, 7);

        $this->assertNotNull($result);
        $this->assertEquals('unavailable', $result->action);
        $this->assertEquals('rider', $result->entity_type);
    }

    public function test_log_manual_dispatch(): void
    {
        $result = $this->service->logManualDispatch($this->user, 10, 5, ['manual' => true]);

        $this->assertNotNull($result);
        $this->assertEquals('manual_dispatch', $result->action);
        $this->assertEquals(5, $result->metadata['rider_id']);
        $this->assertTrue($result->metadata['manual']);
    }

    public function test_for_entity_returns_logs_for_entity(): void
    {
        $this->service->log($this->user, 'confirmed', 'order', 10);
        $this->service->log($this->user, 'dispatched', 'order', 10);
        $this->service->log($this->user, 'confirmed', 'order', 20);

        $logs = $this->service->forEntity('order', 10);

        $this->assertCount(2, $logs);
    }

    public function test_for_entity_respects_limit(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->service->log($this->user, "action_{$i}", 'order', 10);
        }

        $logs = $this->service->forEntity('order', 10, 3);

        $this->assertCount(3, $logs);
    }

    public function test_for_user_returns_logs_for_user(): void
    {
        $this->service->log($this->user, 'confirmed', 'order', 10);

        $otherUser = User::create([
            'name' => 'Other',
            'email' => 'other@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);
        $this->service->log($otherUser, 'confirmed', 'order', 20);

        $logs = $this->service->forUser($this->user->id);

        $this->assertCount(1, $logs);
        $this->assertEquals($this->user->id, $logs->first()->user_id);
    }

    public function test_in_range_returns_logs_within_date_range(): void
    {
        $this->service->log($this->user, 'confirmed', 'order', 10);

        $logs = $this->service->inRange(
            now()->subHour()->toDateTimeString(),
            now()->addHour()->toDateTimeString()
        );

        $this->assertCount(1, $logs);
    }

    public function test_in_range_excludes_out_of_range_logs(): void
    {
        $this->service->log($this->user, 'confirmed', 'order', 10);

        $logs = $this->service->inRange(
            now()->addHour()->toDateTimeString(),
            now()->addHours(2)->toDateTimeString()
        );

        $this->assertCount(0, $logs);
    }

    public function test_extra_metadata_merged_into_log(): void
    {
        $result = $this->service->logOrderConfirmed($this->user, 10, ['extra_key' => 'extra_value']);

        $this->assertEquals('extra_value', $result->metadata['extra_key']);
    }
}
