<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop the foreign key first
            $table->dropForeign(['store_id']);
            // Make the column nullable
            $table->foreignId('store_id')->nullable()->change();
            // Re-add the foreign key constraint
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['store_id']);
            $table->foreignId('store_id')->nullable(false)->change();
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });
    }
};
