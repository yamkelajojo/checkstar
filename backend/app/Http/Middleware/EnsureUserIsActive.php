<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Deactivated (suspended) users must lose API access immediately — not just
 * at their next login. Tokens are long-lived (Sanctum), so is_active is
 * re-checked on every authenticated API request.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            // Re-read from the database: suspension must take effect on the
            // very next request even though tokens are long-lived and the
            // guard may hold a cached model (always true under long-running
            // runtimes like Octane). A missing attribute (factory models may
            // omit schema-default columns) counts as active — the DB default
            // governs; an explicit false or a deleted row means suspended.
            $current = $user->fresh();

            if (! $current || ($current->is_active ?? true) === false) {
                abort(403, 'Account suspended.');
            }
        }

        return $next($request);
    }
}
