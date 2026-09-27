<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Structural guard: every registered API route must resolve to a controller
 * method that actually exists.
 *
 * Why: `Route::apiResource()` happily registers a `show` route for a
 * controller that never implemented `show()`. The route table looked fine,
 * every feature test passed, and only a real GET to
 * `/api/admin/recipes/{id}` revealed the 500. This test makes the route
 * table itself the thing under test, so a declared-but-unimplemented
 * endpoint can never reach a browser again.
 */
class ApiRouteContractTest extends TestCase
{
    public function test_every_api_route_points_at_an_existing_controller_method(): void
    {
        $unresolvable = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();

            if (! str_starts_with($uri, 'api/')) {
                continue;
            }

            $action = $route->getAction('uses');

            // Closures are self-contained; only class@method strings can dangle.
            if (! is_string($action) || ! str_contains($action, '@')) {
                continue;
            }

            [$class, $method] = explode('@', $action, 2);

            if (! class_exists($class) || ! method_exists($class, $method)) {
                $unresolvable[] = implode('|', $route->methods()).' /'.$uri.' -> '.$action;
            }
        }

        $this->assertSame(
            [],
            $unresolvable,
            "These API routes reference controller methods that do not exist:\n".implode("\n", $unresolvable)
        );
    }

    public function test_no_api_route_is_registered_twice_for_the_same_method(): void
    {
        $seen = [];
        $duplicates = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            if (! str_starts_with($uri, 'api/')) {
                continue;
            }
            foreach ($route->methods() as $method) {
                if ($method === 'HEAD') {
                    continue;
                }
                $key = $method.' '.$uri;
                if (isset($seen[$key])) {
                    $duplicates[] = $key;
                }
                $seen[$key] = true;
            }
        }

        $this->assertSame([], $duplicates, 'Duplicate API route registrations: '.implode(', ', $duplicates));
    }
}
