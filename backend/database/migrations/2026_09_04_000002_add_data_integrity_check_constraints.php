<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Database-level CHECK constraints for the invariants the application layer
 * already enforces. Application validation can be bypassed by direct writes,
 * concurrent paths, or bugs — these constraints make negative stock, negative
 * money, and zero/negative quantities impossible to persist on the primary
 * engines (MySQL 8.0.16+/MariaDB enforce CHECK; sqlite does not support
 * adding CHECK constraints to existing tables, so the test connection skips).
 */
return new class extends Migration
{
    /**
     * @var array<int, array{table: string, name: string, sql: string}>
     */
    private array $constraints = [
        // Stock integrity — oversell is the core money/stock invariant.
        ['table' => 'store_product', 'name' => 'chk_store_product_stock_non_negative', 'sql' => 'stock_quantity >= 0'],
        ['table' => 'store_product', 'name' => 'chk_store_product_reserved_non_negative', 'sql' => 'reserved_quantity >= 0'],
        ['table' => 'store_product', 'name' => 'chk_store_product_reserved_within_stock', 'sql' => 'reserved_quantity <= stock_quantity'],

        // Cart & order line integrity.
        ['table' => 'cart_items', 'name' => 'chk_cart_items_quantity_positive', 'sql' => 'quantity > 0'],
        ['table' => 'order_items', 'name' => 'chk_order_items_quantity_positive', 'sql' => 'quantity > 0'],
        ['table' => 'order_items', 'name' => 'chk_order_items_unit_price_non_negative', 'sql' => 'unit_price >= 0'],
        ['table' => 'order_items', 'name' => 'chk_order_items_total_price_non_negative', 'sql' => 'total_price >= 0'],

        // Money can never be negative.
        ['table' => 'orders', 'name' => 'chk_orders_subtotal_non_negative', 'sql' => 'subtotal >= 0'],
        ['table' => 'orders', 'name' => 'chk_orders_delivery_fee_non_negative', 'sql' => 'delivery_fee >= 0'],
        ['table' => 'orders', 'name' => 'chk_orders_total_non_negative', 'sql' => 'total >= 0'],
        ['table' => 'products', 'name' => 'chk_products_price_non_negative', 'sql' => 'price >= 0'],
        ['table' => 'products', 'name' => 'chk_products_sale_price_non_negative', 'sql' => 'sale_price IS NULL OR sale_price >= 0'],
    ];

    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            // sqlite (used by the test suite) cannot add CHECK constraints to
            // an existing table without a table rebuild; the application layer
            // already enforces these invariants under test.
            return;
        }

        foreach ($this->constraints as $constraint) {
            if (! Schema::hasTable($constraint['table'])) {
                continue;
            }

            DB::statement(sprintf(
                'ALTER TABLE `%s` ADD CONSTRAINT `%s` CHECK (%s)',
                $constraint['table'],
                $constraint['name'],
                $constraint['sql'],
            ));
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        foreach ($this->constraints as $constraint) {
            if (! Schema::hasTable($constraint['table'])) {
                continue;
            }

            DB::statement(sprintf(
                'ALTER TABLE `%s` DROP CONSTRAINT `%s`',
                $constraint['table'],
                $constraint['name'],
            ));
        }
    }
};
