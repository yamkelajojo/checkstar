<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMessageReplyTest extends TestCase
{
    use RefreshDatabase;

    public function test_developer_can_reply_to_contact_message(): void
    {
        $developer = User::factory()->create(['role' => UserRole::Developer]);
        $message = ContactMessage::create([
            'name' => 'Thandi',
            'email' => 'thandi@example.com',
            'subject' => 'Delivery window',
            'message' => 'Can I pick a delivery window?',
        ]);

        $this->actingAs($developer)
            ->postJson("/api/admin/messages/{$message->id}/reply", [
                'body' => 'Yes — choose a slot at checkout.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.reply_body', 'Yes — choose a slot at checkout.')
            ->assertJsonPath('data.is_read', true);

        $this->assertNotNull($message->fresh()->replied_at);
    }

    public function test_developer_can_mark_message_read(): void
    {
        $developer = User::factory()->create(['role' => UserRole::Developer]);
        $message = ContactMessage::create([
            'name' => 'Nomsa',
            'email' => 'nomsa@example.com',
            'message' => 'Weekend delivery?',
        ]);
        $this->assertFalse((bool) $message->is_read);

        $this->actingAs($developer)
            ->patchJson("/api/admin/messages/{$message->id}/read", ['read' => true])
            ->assertStatus(200)
            ->assertJsonPath('data.is_read', true);
    }

    public function test_mark_read_can_mark_unread_again(): void
    {
        $developer = User::factory()->create(['role' => UserRole::Developer]);
        $message = ContactMessage::create([
            'name' => 'Pieter',
            'email' => 'pieter@example.com',
            'message' => 'Bulk pricing?',
            'is_read' => true,
        ]);

        $this->actingAs($developer)
            ->patchJson("/api/admin/messages/{$message->id}/read", ['read' => false])
            ->assertStatus(200)
            ->assertJsonPath('data.is_read', false);
    }

    public function test_mark_read_toggles_when_flag_omitted(): void
    {
        $developer = User::factory()->create(['role' => UserRole::Developer]);
        $message = ContactMessage::create([
            'name' => 'Zanele',
            'email' => 'zanele@example.com',
            'message' => 'Hello',
            'is_read' => false,
        ]);

        $this->actingAs($developer)
            ->patchJson("/api/admin/messages/{$message->id}/read")
            ->assertStatus(200)
            ->assertJsonPath('data.is_read', true);
    }

    public function test_customer_cannot_mark_read(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $message = ContactMessage::create([
            'name' => 'Sipho',
            'email' => 'sipho@example.com',
            'message' => 'Hello',
        ]);

        $this->actingAs($customer)
            ->patchJson("/api/admin/messages/{$message->id}/read", ['read' => true])
            ->assertStatus(403);
    }

    public function test_customer_cannot_reply(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $message = ContactMessage::create([
            'name' => 'Sipho',
            'email' => 'sipho@example.com',
            'message' => 'Hello',
        ]);

        $this->actingAs($customer)
            ->postJson("/api/admin/messages/{$message->id}/reply", ['body' => 'hi'])
            ->assertStatus(403);
    }
}
