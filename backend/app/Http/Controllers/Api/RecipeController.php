<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    private function absolutizeImage(Recipe $recipe): Recipe
    {
        if ($recipe->image !== null) {
            $recipe->image = rtrim(request()->getSchemeAndHttpHost(), '/').'/'.ltrim($recipe->image, '/');
        }

        return $recipe;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Recipe::where('is_published', true);

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $recipes = $query->orderByDesc('created_at')->get()
            ->each(fn (Recipe $recipe) => $this->absolutizeImage($recipe));

        return response()->json(['data' => $recipes]);
    }

    public function show(string $slug): JsonResponse
    {
        $recipe = Recipe::where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return response()->json(['data' => $this->absolutizeImage($recipe)]);
    }
}
