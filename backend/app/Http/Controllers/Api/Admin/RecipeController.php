<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Recipe::orderByDesc('created_at')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:recipes',
            'description' => 'nullable|string',
            'ingredients' => 'required|array',
            'method' => 'required|string',
            'image' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:50',
            'prep_time' => 'nullable|integer',
            'cook_time' => 'nullable|integer',
            'servings' => 'nullable|integer',
            'is_featured' => 'boolean',
            'is_published' => 'boolean',
        ]);

        return response()->json(['data' => Recipe::create($validated)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $recipe = Recipe::findOrFail($id);

        $validated = $request->validate([
            'title' => 'string|max:255',
            'slug' => 'string|max:255|unique:recipes,slug,' . $id,
            'description' => 'nullable|string',
            'ingredients' => 'array',
            'method' => 'string',
            'image' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:50',
            'prep_time' => 'nullable|integer',
            'cook_time' => 'nullable|integer',
            'servings' => 'nullable|integer',
            'is_featured' => 'boolean',
            'is_published' => 'boolean',
        ]);

        $recipe->update($validated);

        return response()->json(['data' => $recipe]);
    }

    public function destroy(int $id): JsonResponse
    {
        Recipe::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
