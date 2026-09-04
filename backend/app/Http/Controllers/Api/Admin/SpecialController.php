<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Special;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpecialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->has('per_page') ? max(1, min((int) $request->query('per_page'), 100)) : 50;
        $paginator = Special::with('products')->orderByDesc('created_at')->paginate($perPage);
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
            'slug' => 'required|string|max:255|unique:specials',
            'description' => 'nullable|string',
            'banner_image' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
        ]);

        return response()->json(['data' => Special::create($validated)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $special = Special::findOrFail($id);

        $validated = $request->validate([
            'title' => 'string|max:255',
            'slug' => 'string|max:255|unique:specials,slug,'.$id,
            'description' => 'nullable|string',
            'banner_image' => 'nullable|string|max:255',
            'start_date' => 'date',
            'end_date' => 'date|after:start_date',
            'is_active' => 'boolean',
        ]);

        $special->update($validated);

        return response()->json(['data' => $special]);
    }

    public function destroy(int $id): JsonResponse
    {
        Special::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
