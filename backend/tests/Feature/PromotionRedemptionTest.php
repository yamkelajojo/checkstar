<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Promotion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PromotionRedemptionTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => UserRole::Customer]);
    }

    private function makePromotion(array $overrides = []): Promotion
    {
        return Promotion::create(array_merge([
            'code' => 'SAVE10',
            'type' => 'percentage',
            'value' => 10,
            'min_order_cents' => 0,
            'max_uses' => null,
            'used_count' => 0,
            'is_active' => true,
        ], $overrides));
    }

    public function test_validate_rejects_fully_redeemed_codes(): void
    {
        $this->makePromotion(['max_uses' => 5, 'used_count' => 5]);

        $this->actingAs($this->customer)
            ->postJson('/api/promotions/validate', ['code' => 'SAVE10'])
            ->assertStatus(422)
            ->assertJsonPath('error', 'Code fully redeemed');
    }

    public function test_validate_rejects_expired_codes(): void
    {
        $this->makePromotion(['expires_at' => now()->subDay()]);

        $this->actingAs($this->customer)
            ->postJson('/api/promotions/validate', ['code' => 'SAVE10'])
            ->assertStatus(422)
            ->assertJsonPath('error', 'Code expired');
    }

    public function test_validate_rejects_orders_below_the_minimum(): void
    {
        $this->makePromotion(['min_order_cents' => 5000]);

        $this->actingAs($this->customer)
            ->postJson('/api/promotions/validate', ['code' => 'SAVE10', 'subtotal_cents' => 4400])
            ->assertStatus(422)
            ->assertJsonPath('error', 'Minimum order amount not met')
            ->assertJsonPath('min_order_cents', 5000);
    }

    public function test_validate_computes_percentage_discount(): void
    {
        $this->makePromotion(['type' => 'percentage', 'value' => 10]);

        $this->actingAs($this->customer)
            ->postJson('/api/promotions/validate', ['code' => 'SAVE10', 'subtotal_cents' => 4400])
            ->assertStatus(200)
            ->assertJsonPath('valid', true)
            ->assertJsonPath('discount_cents', 440)
            ->assertJsonPath('new_total_cents', 3960);
    }

    public function test_validate_caps_fixed_discounts_at_the_subtotal(): void
    {
        $this->makePromotion(['type' => 'fixed', 'value' => 10000]);

        $this->actingAs($this->customer)
            ->postJson('/api/promotions/validate', ['code' => 'SAVE10', 'subtotal_cents' => 4400])
            ->assertStatus(200)
            ->assertJsonPath('discount_cents', 4400)
            ->assertJsonPath('new_total_cents', 0);
    }

    public function test_apply_increments_used_count(): void
    {
        $promo = $this->makePromotion();

        $this->actingAs($this->customer)
            ->postJson('/api/promotions/apply', ['code' => 'SAVE10'])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame(1, $promo->fresh()->used_count);
    }

    public function test_apply_can_never_overshoot_max_uses(): void
    {
        // Simulates the losing side of a concurrent race: the counter is
        // already at the cap when this apply lands.
        $promo = $this->makePromotion(['max_uses' => 2, 'used_count' => 2]);

        $this->actingAs($this->customer)
            ->postJson('/api/promotions/apply', ['code' => 'SAVE10'])
            ->assertStatus(422)
            ->assertJsonPath('error', 'Code fully redeemed');

        $this->assertSame(2, $promo->fresh()->used_count);
    }

    public function test_apply_redeems_the_final_allowed_use(): void
    {
        $promo = $this->makePromotion(['max_uses' => 2, 'used_count' => 1]);

        $this->actingAs($this->customer)
            ->postJson('/api/promotions/apply', ['code' => 'SAVE10'])
            ->assertStatus(200);

        $this->assertSame(2, $promo->fresh()->used_count);

        $this->actingAs($this->customer)
            ->postJson('/api/promotions/apply', ['code' => 'SAVE10'])
            ->assertStatus(422);

        $this->assertSame(2, $promo->fresh()->used_count);
    }
}
