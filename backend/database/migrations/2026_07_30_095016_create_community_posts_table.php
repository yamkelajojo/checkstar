<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_posts', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->text('content')->nullable();
            $table->string('image', 255)->nullable();
            $table->string('category', 50);
            $table->date('event_date')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['category', 'is_published']);
            $table->index('event_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_posts');
    }
};
