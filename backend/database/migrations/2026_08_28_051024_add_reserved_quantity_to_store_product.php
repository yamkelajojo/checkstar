<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store_product', function (Blueprint $table) {
            $table->integer('reserved_quantity')->default(0)->after('stock_quantity');
        });
    }

    public function down(): void
    {
        Schema::table('store_product', function (Blueprint $table) {
            $table->dropColumn('reserved_quantity');
        });
    }
};
