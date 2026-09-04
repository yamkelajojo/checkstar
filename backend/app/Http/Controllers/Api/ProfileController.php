<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email,'.$request->user()->id,
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $filtered = array_filter($validated, fn ($v) => $v !== null);
        if (isset($filtered['email']) && $filtered['email'] !== $user->email) {
            $filtered['email_verified_at'] = null;
        }
        $user->update($filtered);

        return response()->json($user->fresh());
    }
}
