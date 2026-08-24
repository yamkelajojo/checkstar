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
