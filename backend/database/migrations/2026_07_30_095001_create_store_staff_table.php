<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 50);
            $table->timestamps();

            $table->unique(['store_id', 'user_id']);
            $table->unique('user_id');
            $table->index('user_id');
            $table->index('store_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_staff');
    }
};
