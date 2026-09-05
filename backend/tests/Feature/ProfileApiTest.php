<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Profile self-service contract: only name/email/phone/avatar are editable,
 * changing the email resets verification (the user must re-verify the new
 * address), and the response is the bare user JSON (no envelope).
 */
class ProfileApiTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create([
            'role' => UserRole::Customer,
            'email' => 'profile-original@example.com',
            'email_verified_at' => now(),
        ]);
    }

    public function test_customer_can_update_name_and_phone(): void
    {
        $this->actingAs($this->customer)
            ->putJson('/api/profile', ['name' => 'New Name', 'phone' => '+27 82 111 2222'])
            ->assertStatus(200)
            ->assertJsonPath('name', 'New Name');

        $fresh = $this->customer->fresh();
        $this->assertSame('New Name', $fresh->name);
        $this->assertNotNull($fresh->email_verified_at);
    }

    public function test_changing_email_resets_verification(): void
    {
        $this->actingAs($this->customer)
            ->putJson('/api/profile', ['email' => 'profile-new@example.com'])
            ->assertStatus(200)
            ->assertJsonPath('email', 'profile-new@example.com');

        $fresh = $this->customer->fresh();
        $this->assertNull($fresh->email_verified_at);
    }

    public function test_keeping_the_same_email_keeps_verification(): void
    {
        $this->actingAs($this->customer)
            ->putJson('/api/profile', ['email' => 'profile-original@example.com'])
            ->assertStatus(200);

        $this->assertNotNull($this->customer->fresh()->email_verified_at);
    }

    public function test_email_conflicts_are_422(): void
    {
        User::factory()->create(['role' => UserRole::Customer, 'email' => 'taken@example.com']);

        $this->actingAs($this->customer)
            ->putJson('/api/profile', ['email' => 'taken@example.com'])
            ->assertStatus(422);
    }

    public function test_role_is_not_mass_assignable(): void
    {
        $this->actingAs($this->customer)
            ->putJson('/api/profile', ['role' => 'developer'])
            ->assertStatus(200);

        $this->assertSame(UserRole::Customer, $this->customer->fresh()->role);
    }
}
