<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rider_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rider_id')->constrained()->cascadeOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('accuracy', 5, 2)->nullable();
            $table->timestamp('recorded_at');

            $table->index(['rider_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rider_locations');
    }
};
