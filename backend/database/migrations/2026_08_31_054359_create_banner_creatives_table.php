<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banner_creatives', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('store_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->json('slides');
            $table->string('status')->default('draft'); // draft, published
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->timestamps();

            $table->index(['status', 'start_date', 'end_date']);
            $table->index('store_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banner_creatives');
    }
};
