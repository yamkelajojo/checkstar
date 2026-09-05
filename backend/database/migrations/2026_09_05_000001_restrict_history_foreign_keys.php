<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Financial and review history must never disappear as a side effect of an
 * admin delete. The original cascade chain made these wipes possible:
 *   delete store    → orders cascade     → order_items, reviews, transactions…
 *   delete category → products cascade   → order_items, stock…
 *   delete customer → orders cascade     → same
 * This migration re-creates the history-bearing foreign keys as RESTRICT so
 * the database itself refuses, on every engine that enforces FKs (MySQL,
 * MariaDB, Postgres). Ephemeral data (carts, favourites, audit logs) keeps
 * its cascade. SQLite (the test driver) cannot alter FKs without a table
 * rebuild — the application-level guards in the admin controllers cover it.
 */
return new class extends Migration
{
    /**
     * @var array<int, array{table: string, column: string, ref: string}>
     */
    private array $restrictions = [
        ['table' => 'orders', 'column' => 'store_id', 'ref' => 'stores'],
        ['table' => 'orders', 'column' => 'customer_id', 'ref' => 'users'],
        ['table' => 'order_items', 'column' => 'product_id', 'ref' => 'products'],
        ['table' => 'transactions', 'column' => 'order_id', 'ref' => 'orders'],
        ['table' => 'transactions', 'column' => 'user_id', 'ref' => 'users'],
        ['table' => 'reviews', 'column' => 'rider_id', 'ref' => 'riders'],
        ['table' => 'store_product', 'column' => 'product_id', 'ref' => 'products'],
    ];

    public function up(): void
    {
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb', 'pgsql'], true)) {
            return;
        }

        foreach ($this->restrictions as $r) {
            if (! Schema::hasTable($r['table']) || ! Schema::hasColumn($r['table'], $r['column'])) {
                continue;
            }

            Schema::table($r['table'], function (Blueprint $table) use ($r): void {
                $table->dropForeign([$r['column']]);
                $table->foreign($r['column'])
                    ->references('id')
                    ->on($r['ref'])
                    ->restrictOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb', 'pgsql'], true)) {
            return;
        }

        foreach ($this->restrictions as $r) {
            if (! Schema::hasTable($r['table']) || ! Schema::hasColumn($r['table'], $r['column'])) {
                continue;
            }

            Schema::table($r['table'], function (Blueprint $table) use ($r): void {
                $table->dropForeign([$r['column']]);
                $table->foreign($r['column'])
                    ->references('id')
                    ->on($r['ref'])
                    ->cascadeOnDelete();
            });
        }
    }
};
