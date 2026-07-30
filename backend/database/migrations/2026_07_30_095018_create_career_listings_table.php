<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('career_listings', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->text('description');
            $table->text('requirements')->nullable();
            $table->string('location', 255);
            $table->string('type', 50);
            $table->string('department', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->date('closes_at')->nullable();
            $table->timestamps();

            $table->index('is_active');
            $table->index('department');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('career_listings');
    }
};
