<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // 'delivery' (rider dispatch, the historical behaviour) or
            // 'pickup' (customer collects from the fulfilment store — no
            // rider, no delivery fee, no delivery coordinates).
            $table->string('fulfilment_method', 20)->default('delivery')->after('payment_method');
            $table->index('fulfilment_method');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['fulfilment_method']);
            $table->dropColumn('fulfilment_method');
        });
    }
};
