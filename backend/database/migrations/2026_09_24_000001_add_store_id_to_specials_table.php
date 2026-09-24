<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sales (Special) become store-owned content.
 *
 * `store_id` null = chain-wide sale (developer-created only). Store owners
 * and managers create sales for their own store; the admin API scopes by it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('specials', function (Blueprint $table) {
            $table->foreignId('store_id')->nullable()->after('sort_order')
                ->constrained()->nullOnDelete();
            $table->index('store_id');
        });
    }

    public function down(): void
    {
        Schema::table('specials', function (Blueprint $table) {
            $table->dropConstrainedForeignId('store_id');
        });
    }
};
