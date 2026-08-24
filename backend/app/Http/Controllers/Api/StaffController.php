<?php

namespace App\Http\Controllers\Api;

use App\Enums\StaffRole;
use App\Http\Controllers\Controller;
use App\Models\StoreStaff;
use App\Services\StoreContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function __construct(private StoreContext $storeContext)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:' . implode(',', array_column(StaffRole::cases(), 'value')),
            'store_id' => 'nullable|integer|exists:stores,id',
        ]);

        $store = $this->storeContext->resolve($request->user(), $validated['store_id'] ?? null);

        $assignment = StoreStaff::create([
            'user_id' => $validated['user_id'],
            'store_id' => $store->id,
            'role' => $validated['role'],
        ]);

        return response()->json(['data' => $assignment->load('user', 'store')], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->query('store_id') !== null ? (int) $request->query('store_id') : null);

        $assignment = StoreStaff::where('id', $id)->where('store_id', $store->id)->firstOrFail();
        $assignment->delete();

        return response()->json(['message' => 'Staff removed']);
    }
}
