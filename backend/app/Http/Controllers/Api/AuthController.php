<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\RegisterRiderRequest;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

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

    public function registerRider(RegisterRiderRequest $request): JsonResponse
    {
        $validated = $request->validated();

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

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->is_active) {
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
        $user = $request->user();
        if ($user) {
            $token = $user->currentAccessToken();
            if ($token) {
                $token->delete();
            } else {
                if (! $request->hasSession() || $request->bearerToken()) {
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

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json(['token' => $token]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => 'Password reset link sent to your email.'])
            : response()->json(['message' => 'Unable to send reset link.'], 500);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:8',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Password has been reset.'])
            : response()->json(['message' => 'Invalid or expired reset token.'], 400);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $user = User::findOrFail($request->route('id'));

        if (! hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid verification link.'], 400);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return response()->json(['message' => 'Email verified successfully.']);
    }

    public function sendEmailVerificationNotification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent.']);
    }

    public function deviceToken(Request $request): JsonResponse
    {
        $request->validate([
            'push_token' => 'required|string',
            'platform' => 'required|string|in:ios,android',
        ]);

        $request->user()->update([
            'push_token' => $request->input('push_token'),
        ]);

        return response()->json(['message' => 'Device token registered.']);
    }

    public function removeDeviceToken(Request $request): JsonResponse
    {
        $request->user()->update([
            'push_token' => null,
        ]);

        return response()->json(['message' => 'Device token removed.']);
    }
}
