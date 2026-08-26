<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->has('per_page') ? max(1, min((int) $request->query('per_page'), 100)) : 50;
        $paginator = Recipe::orderByDesc('created_at')->paginate($perPage);
        if ($request->has('per_page') || $request->has('page')) {
            return response()->json($paginator);
        }
        return response()->json(['data' => $paginator->items(), 'meta' => [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]]);
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
