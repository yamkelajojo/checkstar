<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserAddress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AddressBookTest extends TestCase
{
    use RefreshDatabase;

    private function makeCustomer(): User
    {
        return User::create([
            'name' => 'Address Owner',
            'email' => 'addresses@example.com',
            'password' => Hash::make('password123'),
            'role' => \App\Enums\UserRole::Customer,
            'phone' => '+27 82 555 0100',
            'is_active' => true,
        ]);
    }

    private function validPayload(array $over = []): array
    {
        return array_merge([
            'label' => 'Home',
            'address' => '12 Flint Road, Umgeni Park, Durban',
            'latitude' => -29.8123,
            'longitude' => 31.0099,
            'is_default' => true,
        ], $over);
    }

    public function test_customer_can_save_list_update_and_delete_addresses(): void
    {
        $customer = $this->makeCustomer();

        $created = $this->actingAs($customer)->postJson('/api/addresses', $this->validPayload());
        $created->assertStatus(201)
            ->assertJsonPath('data.label', 'Home')
            ->assertJsonPath('data.is_default', true);

        $second = $this->actingAs($customer)->postJson('/api/addresses', $this->validPayload([
            'label' => 'Work',
            'address' => '45 Umbilo Road, Durban Central',
            'latitude' => -29.8671,
            'longitude' => 31.0052,
            'is_default' => false,
        ]));
        $second->assertStatus(201)->assertJsonPath('data.label', 'Work');

        $list = $this->actingAs($customer)->getJson('/api/addresses');
        $list->assertStatus(200)->assertJsonCount(2, 'data');

        $workId = $second->json('data.id');

        $updated = $this->actingAs($customer)->putJson("/api/addresses/{$workId}", [
            'label' => 'Office',
            'address' => '45 Umbilo Road, Durban Central',
            'latitude' => -29.8671,
            'longitude' => 31.0052,
        ]);
        $updated->assertStatus(200)->assertJsonPath('data.label', 'Office');

        $deleted = $this->actingAs($customer)->deleteJson("/api/addresses/{$workId}");
        $deleted->assertStatus(200);

        $this->assertSame(1, $customer->addresses()->count());
    }

    public function test_exactly_one_default_is_kept_and_reassignment_demotes_the_previous_holder(): void
    {
        $customer = $this->makeCustomer();

        $home = $this->actingAs($customer)->postJson('/api/addresses', $this->validPayload())->json('data');
        $work = $this->actingAs($customer)->postJson('/api/addresses', $this->validPayload([
            'label' => 'Work',
            'address' => '45 Umbilo Road, Durban Central',
            'latitude' => -29.8671,
            'longitude' => 31.0052,
        ]))->json('data');

        // Explicit is_default on the new address must demote Home.
        $work = $this->actingAs($customer)->putJson("/api/addresses/{$work['id']}", [
            'label' => 'Work',
            'address' => '45 Umbilo Road, Durban Central',
            'latitude' => -29.8671,
            'longitude' => 31.0052,
            'is_default' => true,
        ])->json('data');

        $this->assertTrue((bool) UserAddress::find($work['id'])->is_default);
        $this->assertFalse((bool) UserAddress::find($home['id'])->is_default);

        // Deleting the default promotes another address — a customer never
        // ends up with no default.
        $this->actingAs($customer)->deleteJson("/api/addresses/{$work['id']}");
        $remaining = UserAddress::find($home['id']);
        $this->assertTrue((bool) $remaining->is_default);
    }

    public function test_addresses_require_coordinates_because_checkout_resolves_stores_from_them(): void
    {
        $customer = $this->makeCustomer();

        $response = $this->actingAs($customer)->postJson('/api/addresses', [
            'label' => 'Home',
            'address' => '12 Flint Road, Durban',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['latitude', 'longitude']);
    }

    public function test_addresses_are_scoped_to_their_owner(): void
    {
        $owner = $this->makeCustomer();
        $stranger = User::create([
            'name' => 'Stranger',
            'email' => 'stranger@example.com',
            'password' => Hash::make('password123'),
            'role' => \App\Enums\UserRole::Customer,
            'phone' => '+27 82 555 0199',
            'is_active' => true,
        ]);

        $address = $this->actingAs($owner)->postJson('/api/addresses', $this->validPayload())->json('data');

        $this->actingAs($stranger)
            ->putJson("/api/addresses/{$address['id']}", $this->validPayload(['label' => 'Hacked']))
            ->assertStatus(404);

        $this->actingAs($stranger)
            ->deleteJson("/api/addresses/{$address['id']}")
            ->assertStatus(404);

        $this->assertSame('Home', UserAddress::find($address['id'])->label);
    }
}
