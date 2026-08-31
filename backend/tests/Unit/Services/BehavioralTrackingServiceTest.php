<?php

namespace Tests\Unit\Services;

use App\Services\BehavioralTrackingService;
use Tests\TestCase;
use Illuminate\Support\Facades\Log;

class BehavioralTrackingServiceTest extends TestCase
{
    private BehavioralTrackingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Log::shouldReceive('debug')->byDefault();
        Log::shouldReceive('info')->byDefault();
        $this->service = new BehavioralTrackingService();
    }

    public function test_signal_taxonomy_has_explicit_intent_tier(): void
    {
        $this->assertEquals(5.0, $this->service->getSignalWeight('contact'));
        $this->assertEquals(3.0, $this->service->getSignalWeight('save'));
    }

    public function test_capture_does_not_throw(): void
    {
        // Fire-and-forget: must never break
        $this->service->capture('search', ['query' => 'bread']);
        $this->service->capture('contact', ['product_id' => 42]);
        $this->service->capture('bounce', ['duration_ms' => 3000]);
        $this->addToAssertionCount(1); // If we reach here, no exception thrown
    }

    public function test_negative_signals_have_negative_weights(): void
    {
        $this->assertLessThan(0, $this->service->getSignalWeight('bounce'));
        $this->assertLessThan(0, $this->service->getSignalWeight('unsave'));
    }
}
