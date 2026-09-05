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
        $emailChanged = isset($filtered['email']) && $filtered['email'] !== $user->email;
        if ($emailChanged) {
            $filtered['email_verified_at'] = null;
        }
        $user->update($filtered);

        // The new address must actually receive a verification link —
        // otherwise the customer is silently stranded unverified.
        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json($user->fresh());
    }
}
