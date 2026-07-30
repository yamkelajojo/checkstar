<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rider_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rider_id')->constrained()->cascadeOnDelete();
            $table->string('badge_type', 50);
            $table->json('metadata')->nullable();
            $table->timestamp('awarded_at');

            $table->unique(['rider_id', 'badge_type']);
            $table->index('rider_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rider_badges');
    }
};
