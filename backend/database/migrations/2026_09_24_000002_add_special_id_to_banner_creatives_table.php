<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A banner can be the visual face of a sale.
 *
 * `special_id` nullable: a banner either links to a sale (clicking it takes
 * customers to that sale's products) or is a standalone branding banner
 * (download the app, announcements…). Deleting a sale removes its linked
 * banner (nullOnDelete).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('banner_creatives', function (Blueprint $table) {
            $table->foreignId('special_id')->nullable()->after('store_id')
                ->constrained()->nullOnDelete();
            $table->index('special_id');
        });
    }

    public function down(): void
    {
        Schema::table('banner_creatives', function (Blueprint $table) {
            $table->dropConstrainedForeignId('special_id');
        });
    }
};
