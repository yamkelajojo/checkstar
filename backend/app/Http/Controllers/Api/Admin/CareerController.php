<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CareerListing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CareerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->has('per_page') ? max(1, min((int) $request->query('per_page'), 100)) : 50;
        $paginator = CareerListing::orderByDesc('created_at')->paginate($perPage);
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
            'slug' => 'required|string|max:255|unique:career_listings',
            'description' => 'required|string',
            'requirements' => 'nullable|string',
            'location' => 'required|string|max:255',
            'type' => 'required|string|in:full_time,part_time,contract',
            'department' => 'nullable|string|max:100',
            'is_active' => 'boolean',
            'closes_at' => 'nullable|date',
        ]);

        return response()->json(['data' => CareerListing::create($validated)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $listing = CareerListing::findOrFail($id);

        $validated = $request->validate([
            'title' => 'string|max:255',
            'slug' => 'string|max:255|unique:career_listings,slug,'.$id,
            'description' => 'string',
            'requirements' => 'nullable|string',
            'location' => 'string|max:255',
            'type' => 'string|in:full_time,part_time,contract',
            'department' => 'nullable|string|max:100',
            'is_active' => 'boolean',
            'closes_at' => 'nullable|date',
        ]);

        $listing->update($validated);

        return response()->json(['data' => $listing]);
    }

    public function destroy(int $id): JsonResponse
    {
        CareerListing::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
