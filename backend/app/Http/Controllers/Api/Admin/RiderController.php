<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->has('per_page') ? max(1, min((int) $request->query('per_page'), 100)) : 50;
        $paginator = Rider::with('user', 'store')->paginate($perPage);
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

    public function update(Request $request, int $id): JsonResponse
    {
        $rider = Rider::findOrFail($id);

        $validated = $request->validate([
            'store_id' => 'nullable|exists:stores,id',
            'is_available' => 'boolean',
            'vehicle_type' => 'nullable|string|max:50',
            'max_radius_km' => 'numeric|min:0',
            'suspended_at' => 'nullable|date',
        ]);

        $rider->update($validated);

        return response()->json(['data' => $rider->load('user', 'store')]);
    }
}
