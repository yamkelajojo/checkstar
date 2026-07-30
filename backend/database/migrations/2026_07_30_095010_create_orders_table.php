<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 20)->unique();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('rider_id')->nullable()->constrained('riders')->nullOnDelete();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('status', 50)->default('pending');
            $table->string('payment_status', 50)->default('pending');
            $table->text('delivery_address')->nullable();
            $table->decimal('delivery_latitude', 10, 7)->nullable();
            $table->decimal('delivery_longitude', 10, 7)->nullable();
            $table->text('delivery_notes')->nullable();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->unsignedTinyInteger('rider_rating')->nullable();
            $table->text('rider_review')->nullable();
            $table->timestamp('customer_confirmed_at')->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('rider_id');
            $table->index('store_id');
            $table->index('status');
            $table->index(['status', 'store_id']);
            $table->index('payment_status');
            $table->index('order_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
