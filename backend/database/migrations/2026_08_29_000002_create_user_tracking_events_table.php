<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_tracking_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->enum('event_type', [
                'product_view',
                'search',
                'add_to_cart',
                'remove_from_cart',
                'checkout',
            ]);
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('search_query', 255)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('customer_id');
            $table->index('event_type');
            $table->index('created_at');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_tracking_events');
    }
};
