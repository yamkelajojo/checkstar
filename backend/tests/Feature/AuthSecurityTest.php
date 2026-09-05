<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

/**
 * Account lifecycle security:
 *  - suspended users lose API access on live tokens (not just at login)
 *  - password reset revokes all existing tokens
 *  - token refresh rotates (retires) the presented token
 *  - forgot-password never reveals whether an account exists
 */
class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(array $overrides = []): User
    {
        return User::create(array_merge([
            'name' => 'Test User',
            'email' => 'security@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ], $overrides));
    }

    public function test_suspended_user_is_rejected_with_a_live_token(): void
    {
        $user = $this->makeUser();
        $token = $user->createToken('mobile')->plainTextToken;

        $this->getJson('/api/auth/user', ['Authorization' => 'Bearer '.$token])->assertStatus(200);

        $user->update(['is_active' => false]);

        // Same token — must now be blocked by the active.user middleware.
        // Reset the cached guard so the request re-resolves the user from the
        // database exactly as a fresh production process would.
        auth()->forgetGuards();
        $this->getJson('/api/auth/user', ['Authorization' => 'Bearer '.$token])->assertStatus(403);
    }

    public function test_suspended_rider_cannot_claim_orders(): void
    {
        $user = $this->makeUser(['email' => 'rider-sec@example.com', 'role' => UserRole::Rider]);
        $token = $user->createToken('mobile')->plainTextToken;

        $user->update(['is_active' => false]);

        $this->postJson('/api/rider/toggle-availability', [], ['Authorization' => 'Bearer '.$token])
            ->assertStatus(403);
    }

    public function test_forgot_password_response_does_not_reveal_account_existence(): void
    {
        $responseUnknown = $this->postJson('/api/auth/forgot-password', [
            'email' => 'definitely-not-here@example.com',
        ]);

        $responseUnknown->assertStatus(200);

        $this->makeUser();
        $responseKnown = $this->postJson('/api/auth/forgot-password', [
            'email' => 'security@example.com',
        ]);

        $responseKnown->assertStatus(200);
        $this->assertSame(
            $responseUnknown->json('message'),
            $responseKnown->json('message'),
        );
    }

    public function test_password_reset_revokes_all_existing_tokens(): void
    {
        $user = $this->makeUser();
        $user->createToken('device-a');
        $user->createToken('device-b');
        $this->assertCount(2, $user->tokens()->get());

        $token = Password::createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertStatus(200);
        $this->assertCount(0, $user->tokens()->get());
        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    public function test_refresh_rotates_the_token(): void
    {
        $user = $this->makeUser();
        $token = $user->createToken('mobile')->plainTextToken;

        $response = $this->postJson('/api/auth/refresh', [], ['Authorization' => 'Bearer '.$token]);

        $response->assertStatus(200);
        $this->assertNotNull($response->json('token'));

        // The old token must no longer authenticate. Reset the cached guard
        // so this request re-validates the token against the database exactly
        // as a fresh production process would.
        auth()->forgetGuards();
        $this->getJson('/api/auth/user', ['Authorization' => 'Bearer '.$token])
            ->assertStatus(401);
    }
}
