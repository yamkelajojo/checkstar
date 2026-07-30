<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('riders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('store_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_available')->default(false);
            $table->string('vehicle_type', 50)->nullable();
            $table->decimal('max_radius_km', 5, 2)->default(10);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->json('banking_details')->nullable();
            $table->unsignedInteger('total_deliveries')->default(0);
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->unsignedInteger('xp')->default(0);
            $table->unsignedInteger('level')->default(1);
            $table->timestamp('suspended_at')->nullable();
            $table->timestamps();

            $table->index(['is_available', 'store_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('riders');
    }
};
