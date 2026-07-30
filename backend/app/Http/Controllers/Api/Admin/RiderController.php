<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiderController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Rider::with('user', 'store')->get()]);
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
