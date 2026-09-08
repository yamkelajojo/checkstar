<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Rider;
use App\Models\Store;
use App\Models\StoreStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * The demo dataset must let a human exercise every console right after
 * `migrate --seed`: customer app (John), admin console (developer) AND the
 * store operations console (a manager linked to the flagship store — before
* this seeder existed, no login could reach /operations without hand-made
 * tinker rows). Re-seeding must not explode on unique indexes.
 */
class DatabaseSeedingTest extends TestCase
{
    use RefreshDatabase;

    public function test_seed_creates_demo_logins_for_every_console(): void
    {
        $this->artisan('db:seed')->assertSuccessful();

        // Customer app.
        $customer = User::where('email', 'john@example.com')->first();
        $this->assertNotNull($customer);
        $this->assertSame(UserRole::Customer, $customer->role);
        $this->assertTrue(Hash::check('password', $customer->password));

        // Admin console.
        $developer = User::where('email', 'dev@checkstar.co.za')->first();
        $this->assertNotNull($developer);
        $this->assertSame(UserRole::Developer, $developer->role);

        // Store operations console: a manager linked to a real store.
        $manager = User::where('email', 'manager@checkstar.co.za')->first();
        $this->assertNotNull($manager, 'Seeded store manager missing — ops console unreachable via demo logins');
        $this->assertSame(UserRole::StoreManager, $manager->role);

        $staff = StoreStaff::where('user_id', $manager->id)->first();
        $this->assertNotNull($staff);
        $this->assertNotNull(Store::find($staff->store_id));
        $this->assertSame('store_manager', $staff->role->value);

        // Store owner: resolves its Store via stores.owner_id.
        $owner = User::where('email', 'owner@checkstar.co.za')->first();
        $this->assertNotNull($owner);
        $this->assertSame(UserRole::StoreOwner, $owner->role);
        $this->assertTrue(Hash::check('password', $owner->password));
        $this->assertSame(
            Store::where('slug', 'durban-central')->first()?->id,
            $owner->store?->id,
            'Demo owner must own the flagship store'
        );

        // Logistics officer: resolves a Store via StoreStaff, like the manager.
        $logistics = User::where('email', 'logistics@checkstar.co.za')->first();
        $this->assertNotNull($logistics);
        $this->assertSame(UserRole::LogisticsOfficer, $logistics->role);
        $logisticsStaff = StoreStaff::where('user_id', $logistics->id)->first();
        $this->assertNotNull($logisticsStaff);
        $this->assertNotNull(Store::find($logisticsStaff->store_id));
        $this->assertSame('logistics_officer', $logisticsStaff->role->value);

        // Mock shopper for the customer app.
        $mock = User::where('email', 'mock@checkstar.co.za')->first();
        $this->assertNotNull($mock);
        $this->assertSame(UserRole::Customer, $mock->role);
        $this->assertTrue(Hash::check('password', $mock->password));

        // Rider app.
        $this->assertTrue(Rider::exists());
        $riderUser = Rider::with('user')->first()->user;
        $this->assertTrue(Hash::check('password', $riderUser->password));
    }

    public function test_seeding_twice_is_idempotent(): void
    {
        $this->artisan('db:seed')->assertSuccessful();
        $this->artisan('db:seed')->assertSuccessful();

        $this->assertSame(1, User::where('email', 'john@example.com')->count());
        $this->assertSame(1, User::where('email', 'dev@checkstar.co.za')->count());
        $this->assertSame(1, User::where('email', 'manager@checkstar.co.za')->count());
        $this->assertSame(1, User::where('email', 'owner@checkstar.co.za')->count());
        $this->assertSame(1, User::where('email', 'logistics@checkstar.co.za')->count());
        $this->assertSame(1, User::where('email', 'mock@checkstar.co.za')->count());

        $owner = User::where('email', 'owner@checkstar.co.za')->first();
        $flagship = Store::where('slug', 'durban-central')->first();
        $this->assertNotNull($owner);
        $this->assertNotNull($flagship);
        $this->assertSame(
            (int) $owner->id,
            (int) $flagship->owner_id,
            'Re-seeding must keep the demo owner on the flagship store'
        );
    }
}
