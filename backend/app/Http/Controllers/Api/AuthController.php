<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => UserRole::Customer,
            'phone' => $validated['phone'] ?? null,
            'is_active' => true,
        ]);

        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
        }

        return response()->json(['user' => $user, 'token' => $user->createToken('mobile')->plainTextToken], 201);
    }

    public function registerRider(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'vehicle_type' => 'nullable|string|in:motorbike,scooter,bicycle,bike,car',
            'banking_details' => 'nullable|array',
            'banking_details.bank' => 'nullable|string|max:100',
            'banking_details.account_number' => 'nullable|string|max:50',
            'banking_details.branch_code' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => UserRole::Rider,
            'phone' => $validated['phone'] ?? null,
            'is_active' => true,
        ]);

        $user->rider()->create([
            'vehicle_type' => $validated['vehicle_type'] ?? null,
            'banking_details' => $validated['banking_details'] ?? null,
        ]);

        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
        }

        return response()->json(['user' => $user->load('rider'), 'token' => $user->createToken('mobile')->plainTextToken], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Account suspended.'], 403);
        }

        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
        }

        return response()->json(['user' => $user->load(['rider', 'store']), 'token' => $user->createToken('mobile')->plainTextToken]);
    }

    public function logout(Request $request): JsonResponse
    {
        // Revoke Sanctum token if present (mobile / Bearer flow)
        $user = $request->user();
        if ($user) {
            $token = $user->currentAccessToken();
            if ($token) {
                $token->delete();
            } else {
                // Fallback: revoke all tokens if current cannot be determined
                // (e.g. transient test) — but avoid blanket delete in session flow
                if (!$request->hasSession() || $request->bearerToken()) {
                    $user->tokens()->delete();
                }
            }
        }

        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out']);
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user()->load(['rider', 'store', 'storeStaff.store']);

        return response()->json(['user' => $user]);
    }
}
