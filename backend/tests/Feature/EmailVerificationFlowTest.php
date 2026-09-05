<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EmailVerificationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_sends_the_verification_email_with_an_spa_link(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Verify Me',
            'email' => 'verify-me@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'verify-me@example.com')->firstOrFail();

        Notification::assertSentTo($user, VerifyEmail::class, function (VerifyEmail $notification) use ($user): bool {
            $url = $notification->toMail($user)->actionUrl;

            // The email must land on the SPA page, which replays the signed
            // API request — not on the bare API route (raw JSON) and not on a
            // named route that doesn't exist.
            return $url !== null
                && str_contains($url, '/auth/verify-email?')
                && str_contains($url, 'expires=')
                && str_contains($url, 'signature=')
                && str_contains($url, 'id=' . $user->getKey())
                && str_contains($url, 'hash=');
        });
    }

    public function test_verify_email_marks_the_user_verified(): void
    {
        $user = User::factory()->create(['role' => UserRole::Customer, 'email_verified_at' => null]);

        $hash = sha1($user->getEmailForVerification());
        $signed = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->getKey(), 'hash' => $hash],
        );

        // Replay the signed URL exactly as the SPA page would.
        $path = parse_url($signed, PHP_URL_PATH);
        $query = parse_url($signed, PHP_URL_QUERY);

        $this->getJson($path . '?' . $query)
            ->assertStatus(200)
            ->assertJsonPath('message', 'Email verified successfully.');

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_verify_email_rejects_a_wrong_hash(): void
    {
        $user = User::factory()->create(['role' => UserRole::Customer, 'email_verified_at' => null]);

        $signed = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->getKey(), 'hash' => sha1('someone-else@example.com')],
        );

        $path = parse_url($signed, PHP_URL_PATH);
        $query = parse_url($signed, PHP_URL_QUERY);

        $this->getJson($path . '?' . $query)
            ->assertStatus(400);

        $this->assertNull($user->fresh()->email_verified_at);
    }
}
