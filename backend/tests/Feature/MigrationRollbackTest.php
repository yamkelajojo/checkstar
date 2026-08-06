<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MigrationRollbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_nullable_store_id_migration_can_roll_back(): void
    {
        $this->artisan('migrate:rollback', ['--step' => 1])->assertExitCode(0);

        $columns = collect(Schema::getColumns('orders'))->first(fn ($col) => $col['name'] === 'store_id');
        $this->assertNotNull($columns, 'store_id column missing after rollback');
        $this->assertFalse($columns['nullable'], 'store_id should be NOT NULL after rollback');

        $storeFk = collect(Schema::getForeignKeys('orders'))
            ->first(fn ($fk) => $fk['columns'] === ['store_id']);
        $this->assertNotNull($storeFk, 'store_id foreign key not restored after rollback');
        $this->assertSame(['id'], $storeFk['foreign_columns']);
        $this->assertSame('cascade', $storeFk['on_delete']);

        $this->artisan('migrate')->assertExitCode(0);

        $this->assertTrue(Schema::hasColumn('orders', 'store_id'));
    }
}
