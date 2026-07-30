<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Recipe::where('is_published', true);

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $recipes = $query->orderByDesc('created_at')->get();

        return response()->json(['data' => $recipes]);
    }

    public function show(string $slug): JsonResponse
    {
        $recipe = Recipe::where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return response()->json(['data' => $recipe]);
    }
}
