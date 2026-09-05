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
    }
}
