<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_special', function (Blueprint $table) {
            if (! Schema::hasColumn('product_special', 'special_price')) {
                $table->decimal('special_price', 10, 2)->nullable()->after('special_id');
                $table->index('special_price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_special', function (Blueprint $table) {
            if (Schema::hasColumn('product_special', 'special_price')) {
                $table->dropColumn('special_price');
            }
        });
    }
};
