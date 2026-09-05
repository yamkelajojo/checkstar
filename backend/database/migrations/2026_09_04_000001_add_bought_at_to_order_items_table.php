<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-item "bought" tracking.
 *
 * Replaces the per-ORDER ItemsBought activity-log guard as the idempotency
 * mechanism for markItemsBought: an order item is bought exactly once
 * (bought_at flips from NULL), so partial batches can be continued safely
 * and concurrent calls cannot double-decrement stock.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->timestamp('bought_at')->nullable()->after('product_snapshot');
            $table->index(['order_id', 'bought_at']);
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['order_id', 'bought_at']);
            $table->dropColumn('bought_at');
        });
    }
};
