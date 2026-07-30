<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->text('description')->nullable();
            $table->json('ingredients');
            $table->text('method');
            $table->string('image', 255)->nullable();
            $table->string('category', 50)->nullable();
            $table->unsignedInteger('prep_time')->nullable();
            $table->unsignedInteger('cook_time')->nullable();
            $table->unsignedInteger('servings')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_featured', 'is_published']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipes');
    }
};
