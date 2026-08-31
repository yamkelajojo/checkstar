<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('behavioral_signals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('signal', 50);
            $table->float('weight')->default(0);
            $table->json('context')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('customer_id');
            $table->index('signal');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('behavioral_signals');
    }
};
