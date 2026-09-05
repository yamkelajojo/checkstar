<?php

namespace App\Providers;

use App\Models\User;
use App\Services\RoutingService;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Auth\Notifications\VerifyEmail as VerifyEmailNotification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(RoutingService::class, function ($app) {
            return new RoutingService;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Laravel's default reset email links to the named route
        // `password.reset`, which does not exist in this API-only
        // application (the mail would fatal with RouteNotFoundException).
        // Build an SPA link instead; the reset page calls the API.
        ResetPasswordNotification::createUrlUsing(function (User $user, string $token) {
            $frontend = rtrim((string) config('app.frontend_url'), '/');

            return $frontend.'/auth/reset-password?token='.$token.'&email='.urlencode($user->getEmailForPasswordReset());
        });

        // Same for verification: the email links to the SPA, which replays the
        // signed API request (same path + query, so the signature validates)
        // and shows a human result page instead of raw JSON.
        VerifyEmailNotification::createUrlUsing(function (User $user) {
            $frontend = rtrim((string) config('app.frontend_url'), '/');
            $expires = now()->addMinutes((int) config('auth.verification.expire', 60));
            $hash = sha1($user->getEmailForVerification());

            $signed = URL::temporarySignedRoute('verification.verify', $expires, ['id' => $user->getKey(), 'hash' => $hash]);
            $query = parse_url($signed, PHP_URL_QUERY) ?: '';

            return $frontend.'/auth/verify-email?'.$query.'&id='.$user->getKey().'&hash='.$hash;
        });
    }
}
