<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('slug', 255)->unique();
            $table->text('description')->nullable();
            $table->string('address', 255);
            $table->string('city', 100);
            $table->string('province', 100);
            $table->string('postal_code', 20);
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('delivery_radius_km', 5, 2)->default(10);
            $table->string('phone', 20);
            $table->string('email', 255)->nullable();
            $table->json('trading_hours')->nullable();
            $table->string('logo', 255)->nullable();
            $table->string('image', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['latitude', 'longitude']);
            $table->index('is_active');
            $table->unique(['city', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
