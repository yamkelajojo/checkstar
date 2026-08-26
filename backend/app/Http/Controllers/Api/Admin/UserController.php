<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->has('per_page') ? max(1, min((int) $request->query('per_page'), 100)) : 50;
        $paginator = User::with('rider')->orderByDesc('created_at')->paginate($perPage);
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
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'email' => 'string|email|max:255|unique:users,email,' . $id,
            'role' => 'string|in:developer,store_owner,store_manager,logistics_officer,customer,rider',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $user->update($validated);

        return response()->json(['data' => $user]);
    }

    public function destroy(int $id): JsonResponse
    {
        User::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
