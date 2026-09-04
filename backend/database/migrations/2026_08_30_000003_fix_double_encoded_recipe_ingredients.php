<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $recipes = DB::table('recipes')->select('id', 'ingredients')->get();

        foreach ($recipes as $recipe) {
            $ingredients = $recipe->ingredients;

            if (! is_string($ingredients)) {
                continue;
            }

            $decoded = json_decode($ingredients, true);

            if (is_array($decoded)) {
                DB::table('recipes')
                    ->where('id', $recipe->id)
                    ->update(['ingredients' => $decoded]);
            }
        }
    }

    public function down(): void
    {
        // Irreversible — the original double-encoded data is lost.
    }
};
