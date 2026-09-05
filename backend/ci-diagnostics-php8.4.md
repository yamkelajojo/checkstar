## Backend CI diagnostics (PHP 8.4)

### php -v
```
PHP 8.4.25 (cli) (built: Aug 27 2026 15:39:11) (NTS)
Copyright (c) The PHP Group
Zend Engine v4.4.25, Copyright (c) Zend Technologies
    with Zend OPcache v8.4.25, Copyright (c), by Zend Technologies
```
### captured step output
### middleware stack for cart/sync
```

  GET|HEAD   api/cart ................................ Api\CartController@show
  POST       api/cart/sync ........................... Api\CartController@sync

                                                            Showing [2] routes

```
### middleware stack for rider available-orders
```

  GET|HEAD       api/rider/available-orders Api\RiderController@availableOrde…

                                                            Showing [1] routes

```
#### artisan-keygen.log
```

   INFO  Application key set successfully.  

```
#### package-discover.log
```

  [37;44m INFO [39;49m Discovering packages.  

  laravel/pail [90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m [32;1mDONE[39;22m
  laravel/sail [90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m [32;1mDONE[39;22m
  laravel/sanctum [90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m [32;1mDONE[39;22m
  laravel/tinker [90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m [32;1mDONE[39;22m
  nesbot/carbon [90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m [32;1mDONE[39;22m
  nunomaduro/collision [90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m [32;1mDONE[39;22m
  nunomaduro/termwind [90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m[90m.[39m [32;1mDONE[39;22m

```
#### phpunit.log
```

   PASS  Tests\Unit\Services\BehavioralTrackingServiceTest
  ✓ signal taxonomy has explicit intent tier                             0.01s  
  ✓ capture does not throw                                               0.01s  
  ✓ negative signals have negative weights                               0.01s  

   PASS  Tests\Unit\Services\DispatchSuggestionServiceTest
  ✓ returns nearest rider by distance                                    0.01s  
  ✓ excludes unavailable riders                                          0.01s  
  ✓ excludes riders with insufficient radius                             0.01s  
  ✓ returns alternative riders                                           0.01s  
  ✓ returns order details                                                0.01s  
  ✓ returns null for nonexistent order                                   0.01s  
  ✓ distance is calculated correctly                                     0.01s  

   PASS  Tests\Unit\Services\EventFeedServiceTest
  ✓ returns order state change events                                    0.02s  
  ✓ returns rider availability events                                    0.01s  
  ✓ returns dispatch events from audit logs                              0.01s  
  ✓ respects cursor pagination                                           0.01s  
  ✓ severity is mapped from order status                                 0.01s  
  ✓ events are ordered by created at desc                                0.01s  
  ✓ limit is respected                                                   0.02s  
  ✓ empty result when no data                                            0.01s  

   PASS  Tests\Unit\StockManagementTest
  ✓ mark items bought decrements stock quantity                          0.02s  
  ✓ mark items bought decrements stock for multiple items                0.02s  
  ✓ mark items bought releases reservation and decrements stock          0.02s  
  ✓ partial batch can be continued in a later call                       0.02s  
  ✓ mark items bought ignores unknown item ids                           0.01s  
  ✓ mark items bought throws when insufficient stock                     0.01s  
  ✓ mark items bought does not decrement stock on failure                0.01s  
  ✓ mark items bought throws when product not available                  0.02s  
  ✓ mark items bought is idempotent                                      0.02s  
  ✓ mark items bought creates activity log                               0.01s  
  ✓ order cancellation releases reserved quantity                        0.02s  
  ✓ order cancellation does not affect stock quantity                    0.01s  
  ✓ order cancellation clamps reserved quantity at zero                  0.02s  
  ✓ order cancellation does not release reservations for bought items    0.02s  
  ✓ delivery releases reservations for unbought items                    0.02s  
  ✓ reservation counts against availability during placement             0.01s  
  ✓ reservation prevents fulfillment when stock is reserved              0.01s  
  ✓ store product not available prevents order placement                 0.01s  
  ✓ insufficient stock prevents order placement                          0.01s  
  ✓ order placement rejects when stock insufficient                      0.01s  
  ✓ multiple orders decrement stock independently                        0.02s  
  ✓ second order fails when stock depleted by first                      0.02s  
  ✓ mark items bought uses lock for update                               0.02s  
  ✓ concurrent mark items bought results are consistent                  0.02s  

   PASS  Tests\Unit\StoreContextTest
  ✓ developer requires explicit store id                                 0.04s  
  ✓ developer with store id resolves store                               0.01s  
  ✓ store owner resolves their store                                     0.01s  
  ✓ store manager resolves through staff                                 0.01s  
  ✓ logistics officer resolves through staff                             0.01s  
  ✓ user without store or staff aborts 403                               0.01s  
  ✓ store owner without store aborts 403                                 0.01s  
  ✓ developer with nonexistent store throws                              0.01s  

   PASS  Tests\Feature\AdminMessageReplyTest
  ✓ developer can reply to contact message                               0.03s  
  ✓ customer cannot reply                                                0.01s  

   FAIL  Tests\Feature\AdminProductDeletionTest
  ✓ product with order history is deactivated not deleted                0.02s  
  ⨯ product without history is deleted                                   0.01s  

   FAIL  Tests\Feature\AuditLogScopingTest
  ⨯ store manager sees only their stores audit logs                      0.02s  
  ✓ entity audit endpoint hides cross store entities                     0.02s  
  ⨯ rider audits are scoped by store                                     0.02s  

   PASS  Tests\Feature\AuthSecurityTest
  ✓ suspended user is rejected with a live token                         0.02s  
  ✓ suspended rider cannot claim orders                                  0.01s  
  ✓ forgot password response does not reveal account existence           0.42s  
  ✓ password reset revokes all existing tokens                           0.02s  
  ✓ refresh rotates the token                                            0.01s  

   PASS  Tests\Feature\AuthTest
  ✓ user can register                                                    0.03s  
  ✓ user can login                                                       0.01s  
  ✓ login fails with invalid credentials                                 0.01s  
  ✓ authenticated user can access user endpoint                          0.01s  
  ✓ unauthenticated user cannot access protected route                   0.01s  

   PASS  Tests\Feature\CartSyncTest
  ✓ sync sums quantities for matching products                           0.02s  
  ✓ sync caps quantity at eight                                          0.01s  
  ✓ sync drops inactive products with feedback                           0.01s  
  ✓ sync returns merged cart so device can replace draft                 0.01s  

   PASS  Tests\Feature\EmailVerificationFlowTest
  ✓ registration sends the verification email with an spa link           0.02s  
  ✓ verify email marks the user verified                                 0.01s  
  ✓ verify email rejects a wrong hash                                    0.01s  

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response                        0.02s  

   PASS  Tests\Feature\HistoryCascadeGuardsTest
  ✓ category with products cannot be deleted                             0.01s  
  ✓ empty category can be deleted                                        0.01s  
  ✓ store with delivered order history cannot be deleted                 0.01s  
  ✓ store without history can be deleted                                 0.01s  
  ✓ rider with reviews cannot be deleted                                 0.01s  
  ✓ product stock rows are not orphaned by category delete guard         0.01s  

   PASS  Tests\Feature\ManualDispatchTest
  ✓ manager can list pending dispatch orders for their store             0.02s  
  ✓ manager can manually dispatch order to specific rider                0.02s  
  ✓ operations assign rejects order from another store                   0.02s  
  ✓ operations suggestion hides other stores orders                      0.01s  
  ✓ dispatch rejects rider from another store                            0.02s  
  ✓ manager can reassign already claimed order                           0.03s  
  ✓ reassign rejects order from different store                          0.03s  
  ✓ developer requires explicit store id                                 0.01s  

   PASS  Tests\Feature\MigrationRollbackTest
  ✓ nullable store id migration can roll back                            0.04s  

   PASS  Tests\Feature\OrderPlacementTest
  ✓ customer can place an order                                          0.03s  
  ✓ order with no available rider enters retrying and keeps cart         0.02s  
  ✓ order defaults to cash on delivery                                   0.02s  
  ✓ placing an order clears the server cart                              0.02s  
  ✓ failed placement leaves server cart intact                           0.02s  
  ✓ order requires delivery coordinates                                  0.01s  
  ✓ customer can view own order                                          0.01s  
  ✓ customer cannot view others order                                    0.01s  
  ✓ customer can cancel own order                                        0.01s  
  ✓ customer cannot cancel others order                                  0.01s  
  ✓ customer cannot cancel out for delivery order                        0.01s  
  ✓ customer can confirm own delivery                                    0.02s  
  ✓ customer cannot confirm others order                                 0.01s  

   PASS  Tests\Feature\ProductCarouselTest
  ✓ trending endpoint is not shadowed by slug route                      0.02s  
  ✓ popular returns delivered order products                             0.02s  
  ✓ new arrivals returns recent products without error                   0.01s  
  ✓ trending returns empty array when no orders                          0.01s  

   PASS  Tests\Feature\ProductIndexTest
  ✓ index respects per page param                                        0.03s  
  ✓ index filters by multiple category slugs                             0.02s  
  ✓ index defaults to twenty per page                                    0.02s  
  ✓ index caps per page at one hundred                                   0.07s  
  ✓ index ignores non numeric per page                                   0.02s  

   PASS  Tests\Feature\PromotionRedemptionTest
  ✓ validate rejects fully redeemed codes                                0.02s  
  ✓ validate rejects expired codes                                       0.01s  
  ✓ validate rejects orders below the minimum                            0.01s  
  ✓ validate computes percentage discount                                0.01s  
  ✓ validate caps fixed discounts at the subtotal                        0.01s  
  ✓ apply increments used count                                          0.01s  
  ✓ apply can never overshoot max uses                                   0.01s  
  ✓ apply redeems the final allowed use                                  0.01s  

   PASS  Tests\Feature\PushNotificationTest
  ✓ cancelled transition pushes notification                             0.02s  
  ✓ retrying transition pushes notification                              0.01s  
  ✓ delivered transition pushes notification                             0.01s  
  ✓ notification listener is queued not synchronous                      0.01s  
  ✓ no push without token                                                0.01s  

   PASS  Tests\Feature\RiderLocationTest
  ✓ customer can view rider location for their order                     0.02s  
  ✓ returns null when order has no rider                                 0.01s  
  ✓ returns null when rider has no location                              0.01s  
  ✓ cannot view other customers order rider location                     0.02s  
  ✓ returns most recent location when multiple exist                     0.01s  
  ✓ rider can update location                                            0.01s  
  ✓ rider location update sets recorded at                               0.01s  
  ✓ rider location update overwrites previous                            0.01s  
  ✓ non rider cannot update location                                     0.01s  
  ✓ location update requires valid coordinates                           0.01s  

   PASS  Tests\Feature\SpecialsEndpointTest
  ✓ index lists only active specials within their window                 0.02s  
  ✓ products carry availability and effective price                      0.02s  
  ✓ inactive products are hidden from specials                           0.01s  

   PASS  Tests\Feature\StaffManagementTest
  ✓ owner can hire store staff                                           0.02s  
  ✓ owner can fire store staff                                           0.01s  
  ✓ store manager cannot hire staff                                      0.01s  

   PASS  Tests\Feature\TrackingEndpointTest
  ✓ view endpoint captures behavioral signal                             0.01s  
  ✓ search endpoint captures explicit intent                             0.01s  
  ✓ contact endpoint captures strong purchase intent                     0.01s  
  ✓ all tracking endpoints use rate limiting                             0.01s  
  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\AdminProductDeletionTest > product without history…    
  Failed asserting that a row in the table [products] matches the attributes {
    "id": 1,
    "deleted_at": null
}.

Found similar results: [
    {
        "id": 1,
        "deleted_at": "2026-09-05 05:27:19"
    }
].

  at tests/Feature/AdminProductDeletionTest.php:87
     83▕             ->deleteJson("/api/admin/products/{$product->id}")
     84▕             ->assertStatus(200);
     85▕ 
     86▕         // Product uses SoftDeletes — deletion trashes the row.
  ➜  87▕         $this->assertDatabaseHas('products', ['id' => $product->id, 'deleted_at' => null]);
     88▕         $this->assertSoftDeleted('products', ['id' => $product->id]);
     89▕     }
     90▕ }
     91▕

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\AuditLogScopingTest > store manager sees only their…   
  Expected response status code [200] but received 500.
Failed asserting that 500 is identical to 200.

The following exception occurred during the last request:

TypeError: App\Http\Controllers\Api\OperationsController::storeAuditScope(): Argument #1 ($store) must be of type App\Http\Controllers\Api\Store, App\Models\Store given, called in /home/runner/work/checkstar/checkstar/backend/app/Http/Controllers/Api/OperationsController.php on line 160 and defined in /home/runner/work/checkstar/checkstar/backend/app/Http/Controllers/Api/OperationsController.php:201
Stack trace:
#0 /home/runner/work/checkstar/checkstar/backend/app/Http/Controllers/Api/OperationsController.php(160): App\Http\Controllers\Api\OperationsController->storeAuditScope()
#1 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/ControllerDispatcher.php(47): App\Http\Controllers\Api\OperationsController->auditLogs()
#2 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Route.php(266): Illuminate\Routing\ControllerDispatcher->dispatch()
#3 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Route.php(212): Illuminate\Routing\Route->runController()
#4 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(808): Illuminate\Routing\Route->run()
#5 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\Routing\Router->{closure:Illuminate\Routing\Router::runRouteWithinStack():807}()
#6 /home/runner/work/checkstar/checkstar/backend/app/Http/Middleware/RoleMiddleware.php(19): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#7 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): App\Http\Middleware\RoleMiddleware->handle()
#8 /home/runner/work/checkstar/checkstar/backend/app/Http/Middleware/EnsureUserIsActive.php(34): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#9 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): App\Http\Middleware\EnsureUserIsActive->handle()
#10 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/SubstituteBindings.php(51): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#11 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Routing\Middleware\SubstituteBindings->handle()
#12 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php(161): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#13 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php(92): Illuminate\Routing\Middleware\ThrottleRequests->handleRequest()
#14 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Routing\Middleware\ThrottleRequests->handle()
#15 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Auth/Middleware/Authenticate.php(64): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#16 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Auth\Middleware\Authenticate->handle()
#17 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/sanctum/src/Http/Middleware/EnsureFrontendRequestsAreStateful.php(26): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#18 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful->{closure:Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::handle():25}()
#19 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#20 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/sanctum/src/Http/Middleware/EnsureFrontendRequestsAreStateful.php(25): Illuminate\Pipeline\Pipeline->then()
#21 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful->handle()
#22 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#23 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(807): Illuminate\Pipeline\Pipeline->then()
#24 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(786): Illuminate\Routing\Router->runRouteWithinStack()
#25 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(750): Illuminate\Routing\Router->runRoute()
#26 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(739): Illuminate\Routing\Router->dispatchToRoute()
#27 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(201): Illuminate\Routing\Router->dispatch()
#28 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\Foundation\Http\Kernel->{closure:Illuminate\Foundation\Http\Kernel::dispatchToRouter():198}()
#29 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#30 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/ConvertEmptyStringsToNull.php(31): Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
#31 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull->handle()
#32 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#33 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TrimStrings.php(51): Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
#34 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\TrimStrings->handle()
#35 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/ValidatePostSize.php(27): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#36 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\ValidatePostSize->handle()
#37 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/PreventRequestsDuringMaintenance.php(110): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#38 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance->handle()
#39 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/HandleCors.php(62): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#40 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\HandleCors->handle()
#41 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/TrustProxies.php(58): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#42 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\TrustProxies->handle()
#43 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/InvokeDeferredCallbacks.php(22): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#44 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\InvokeDeferredCallbacks->handle()
#45 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#46 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(176): Illuminate\Pipeline\Pipeline->then()
#47 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(145): Illuminate\Foundation\Http\Kernel->sendRequestThroughRouter()
#48 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(607): Illuminate\Foundation\Http\Kernel->handle()
#49 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(573): Illuminate\Foundation\Testing\TestCase->call()
#50 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(381): Illuminate\Foundation\Testing\TestCase->json()
#51 /home/runner/work/checkstar/checkstar/backend/tests/Feature/AuditLogScopingTest.php(95): Illuminate\Foundation\Testing\TestCase->getJson()
#52 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(1667): Tests\Feature\AuditLogScopingTest->test_store_manager_sees_only_their_stores_audit_logs()
#53 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(519): PHPUnit\Framework\TestCase->runTest()
#54 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestRunner/TestRunner.php(87): PHPUnit\Framework\TestCase->runBare()
#55 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(365): PHPUnit\Framework\TestRunner->run()
#56 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestCase->run()
#57 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestSuite->run()
#58 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestSuite->run()
#59 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/TextUI/TestRunner.php(64): PHPUnit\Framework\TestSuite->run()
#60 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/TextUI/Application.php(211): PHPUnit\TextUI\TestRunner->run()
#61 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/phpunit(104): PHPUnit\TextUI\Application->run()
#62 {main}

----------------------------------------------------------------------------------

App\Http\Controllers\Api\OperationsController::storeAuditScope(): Argument #1 ($store) must be of type App\Http\Controllers\Api\Store, App\Models\Store given, called in /home/runner/work/checkstar/checkstar/backend/app/Http/Controllers/Api/OperationsController.php on line 160

  at tests/Feature/AuditLogScopingTest.php:96
     92▕         $this->audit('cancelled', 'order', $orderB->id);
     93▕ 
     94▕         $ids = $this->actingAs($this->managerA)
     95▕             ->getJson('/api/operations/audit-logs')
  ➜  96▕             ->assertStatus(200)
     97▕             ->json('audit_logs');
     98▕ 
     99▕         $this->assertCount(1, $ids);
    100▕         $this->assertSame('order', $ids[0]['entity_type']);

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\AuditLogScopingTest > rider audits are scoped by st…   
  Expected response status code [200] but received 500.
Failed asserting that 500 is identical to 200.

The following exception occurred during the last request:

TypeError: App\Http\Controllers\Api\OperationsController::storeAuditScope(): Argument #1 ($store) must be of type App\Http\Controllers\Api\Store, App\Models\Store given, called in /home/runner/work/checkstar/checkstar/backend/app/Http/Controllers/Api/OperationsController.php on line 160 and defined in /home/runner/work/checkstar/checkstar/backend/app/Http/Controllers/Api/OperationsController.php:201
Stack trace:
#0 /home/runner/work/checkstar/checkstar/backend/app/Http/Controllers/Api/OperationsController.php(160): App\Http\Controllers\Api\OperationsController->storeAuditScope()
#1 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/ControllerDispatcher.php(47): App\Http\Controllers\Api\OperationsController->auditLogs()
#2 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Route.php(266): Illuminate\Routing\ControllerDispatcher->dispatch()
#3 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Route.php(212): Illuminate\Routing\Route->runController()
#4 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(808): Illuminate\Routing\Route->run()
#5 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\Routing\Router->{closure:Illuminate\Routing\Router::runRouteWithinStack():807}()
#6 /home/runner/work/checkstar/checkstar/backend/app/Http/Middleware/RoleMiddleware.php(19): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#7 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): App\Http\Middleware\RoleMiddleware->handle()
#8 /home/runner/work/checkstar/checkstar/backend/app/Http/Middleware/EnsureUserIsActive.php(34): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#9 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): App\Http\Middleware\EnsureUserIsActive->handle()
#10 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/SubstituteBindings.php(51): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#11 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Routing\Middleware\SubstituteBindings->handle()
#12 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php(161): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#13 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php(92): Illuminate\Routing\Middleware\ThrottleRequests->handleRequest()
#14 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Routing\Middleware\ThrottleRequests->handle()
#15 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Auth/Middleware/Authenticate.php(64): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#16 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Auth\Middleware\Authenticate->handle()
#17 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/sanctum/src/Http/Middleware/EnsureFrontendRequestsAreStateful.php(26): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#18 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful->{closure:Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::handle():25}()
#19 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#20 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/sanctum/src/Http/Middleware/EnsureFrontendRequestsAreStateful.php(25): Illuminate\Pipeline\Pipeline->then()
#21 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful->handle()
#22 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#23 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(807): Illuminate\Pipeline\Pipeline->then()
#24 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(786): Illuminate\Routing\Router->runRouteWithinStack()
#25 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(750): Illuminate\Routing\Router->runRoute()
#26 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(739): Illuminate\Routing\Router->dispatchToRoute()
#27 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(201): Illuminate\Routing\Router->dispatch()
#28 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\Foundation\Http\Kernel->{closure:Illuminate\Foundation\Http\Kernel::dispatchToRouter():198}()
#29 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#30 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/ConvertEmptyStringsToNull.php(31): Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
#31 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull->handle()
#32 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#33 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TrimStrings.php(51): Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
#34 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\TrimStrings->handle()
#35 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/ValidatePostSize.php(27): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#36 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\ValidatePostSize->handle()
#37 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/PreventRequestsDuringMaintenance.php(110): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#38 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance->handle()
#39 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/HandleCors.php(62): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#40 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\HandleCors->handle()
#41 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/TrustProxies.php(58): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#42 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\TrustProxies->handle()
#43 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/InvokeDeferredCallbacks.php(22): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#44 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\InvokeDeferredCallbacks->handle()
#45 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#46 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(176): Illuminate\Pipeline\Pipeline->then()
#47 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(145): Illuminate\Foundation\Http\Kernel->sendRequestThroughRouter()
#48 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(607): Illuminate\Foundation\Http\Kernel->handle()
#49 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(573): Illuminate\Foundation\Testing\TestCase->call()
#50 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(381): Illuminate\Foundation\Testing\TestCase->json()
#51 /home/runner/work/checkstar/checkstar/backend/tests/Feature/AuditLogScopingTest.php(136): Illuminate\Foundation\Testing\TestCase->getJson()
#52 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(1667): Tests\Feature\AuditLogScopingTest->test_rider_audits_are_scoped_by_store()
#53 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(519): PHPUnit\Framework\TestCase->runTest()
#54 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestRunner/TestRunner.php(87): PHPUnit\Framework\TestCase->runBare()
#55 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(365): PHPUnit\Framework\TestRunner->run()
#56 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestCase->run()
#57 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestSuite->run()
#58 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestSuite->run()
#59 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/TextUI/TestRunner.php(64): PHPUnit\Framework\TestSuite->run()
#60 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/TextUI/Application.php(211): PHPUnit\TextUI\TestRunner->run()
#61 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/phpunit(104): PHPUnit\TextUI\Application->run()
#62 {main}

----------------------------------------------------------------------------------

App\Http\Controllers\Api\OperationsController::storeAuditScope(): Argument #1 ($store) must be of type App\Http\Controllers\Api\Store, App\Models\Store given, called in /home/runner/work/checkstar/checkstar/backend/app/Http/Controllers/Api/OperationsController.php on line 160

  at tests/Feature/AuditLogScopingTest.php:137
    133▕         $this->audit('available', 'rider', $riderB->id);
    134▕ 
    135▕         $logs = $this->actingAs($this->managerA)
    136▕             ->getJson('/api/operations/audit-logs')
  ➜ 137▕             ->assertStatus(200)
    138▕             ->json('audit_logs');
    139▕ 
    140▕         $this->assertCount(1, $logs);
    141▕         $this->assertSame($riderA->id, $logs[0]['entity_id']);


  Tests:    3 failed, 353 passed (837 assertions)
  Duration: 6.04s

```
### bootstrap/cache
```
total 40
drwxr-xr-x 2 runner runner  4096 Sep  5 05:27 .
drwxr-xr-x 3 runner runner  4096 Sep  5 05:27 ..
-rw-r--r-- 1 runner runner    14 Sep  5 05:27 .gitignore
-rwxr-xr-x 1 runner runner   960 Sep  5 05:27 packages.php
-rwxr-xr-x 1 runner runner 21492 Sep  5 05:27 services.php
```
