<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StoreController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->has('per_page') ? max(1, min((int) $request->query('per_page'), 100)) : 50;
        $paginator = Store::with('owner')->paginate($perPage);
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
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:stores',
            'description' => 'nullable|string',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'delivery_radius_km' => 'numeric|min:0',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|string|email|max:255',
            'trading_hours' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        return response()->json(['data' => Store::create($validated)], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => Store::with('owner:id,name,email')->findOrFail($id)]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $store = Store::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'slug' => 'string|max:255|unique:stores,slug,'.$id,
            'description' => 'nullable|string',
            'address' => 'string|max:255',
            'city' => 'string|max:100',
            'province' => 'string|max:100',
            'postal_code' => 'string|max:20',
            'latitude' => 'numeric',
            'longitude' => 'numeric',
            'delivery_radius_km' => 'numeric|min:0',
            'phone' => 'string|max:20',
            'email' => 'nullable|string|email|max:255',
            'trading_hours' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $store->update($validated);

        return response()->json(['data' => $store]);
    }

    public function destroy(int $id): JsonResponse
    {
        $store = Store::findOrFail($id);

        $activeOrders = DB::table('orders')
            ->where('store_id', $id)
            ->whereNotIn('status', ['delivered', 'cancelled'])
            ->count();
        if ($activeOrders > 0) {
            return response()->json(['message' => 'Cannot delete store with active orders', 'reason' => 'has_active_orders'], 409);
        }

        // orders.store_id now RESTRICTs at the DB level (history must never
        // cascade away), so any historical order also blocks deletion.
        $orderCount = DB::table('orders')->where('store_id', $id)->count();
        if ($orderCount > 0) {
            return response()->json([
                'message' => 'Cannot delete a store with order history — deactivate it instead',
                'reason' => 'has_order_history',
            ], 409);
        }

        $riderCount = DB::table('riders')->where('store_id', $id)->count();
        if ($riderCount > 0) {
            return response()->json(['message' => 'Cannot delete store with assigned riders', 'reason' => 'has_riders'], 409);
        }

        $staffCount = DB::table('store_staff')->where('store_id', $id)->count();
        if ($staffCount > 0) {
            return response()->json(['message' => 'Cannot delete store with assigned staff', 'reason' => 'has_staff'], 409);
        }

        $store->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
