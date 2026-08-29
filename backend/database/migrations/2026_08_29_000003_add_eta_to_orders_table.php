<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->integer('eta_seconds')->nullable()->after('delivery_notes');
            $table->timestamp('eta_updated_at')->nullable()->after('eta_seconds');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['eta_seconds', 'eta_updated_at']);
        });
    }
};
