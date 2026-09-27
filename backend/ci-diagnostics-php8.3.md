## Backend CI diagnostics (PHP 8.3)

### php -v
```
PHP 8.3.35 (cli) (built: Sep 23 2026 11:56:59) (NTS)
Copyright (c) The PHP Group
Zend Engine v4.3.35, Copyright (c) Zend Technologies
    with Zend OPcache v8.3.35, Copyright (c), by Zend Technologies
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
  ✓ partial batch can be continued in a later call                       0.01s  
  ✓ mark items bought ignores unknown item ids                           0.01s  
  ✓ mark items bought throws when insufficient stock                     0.01s  
  ✓ mark items bought does not decrement stock on failure                0.01s  
  ✓ mark items bought throws when product not available                  0.01s  
  ✓ mark items bought is idempotent                                      0.01s  
  ✓ mark items bought creates activity log                               0.01s  
  ✓ mark items bought throws when order is cancelled                     0.01s  
  ✓ mark items bought rejects order that is no longer preparing          0.01s  
  ✓ mark items bought rejects delivered order                            0.01s  
  ✓ order cancellation releases reserved quantity                        0.01s  
  ✓ order cancellation does not affect stock quantity                    0.01s  
  ✓ lost cancel race does not release reservations                       0.01s  
  ✓ order cancellation clamps reserved quantity at zero                  0.01s  
  ✓ order cancellation does not release reservations for bought items    0.01s  
  ✓ delivery releases reservations for unbought items                    0.01s  
  ✓ reservation counts against availability during placement             0.01s  
  ✓ reservation prevents fulfillment when stock is reserved              0.01s  
  ✓ store product not available prevents order placement                 0.01s  
  ✓ insufficient stock prevents order placement                          0.01s  
  ✓ order placement rejects when stock insufficient                      0.01s  
  ✓ multiple orders decrement stock independently                        0.01s  
  ✓ second order fails when stock depleted by first                      0.01s  
  ✓ mark items bought uses lock for update                               0.01s  
  ✓ concurrent mark items bought results are consistent                  0.01s  

   PASS  Tests\Unit\StoreContextTest
  ✓ developer requires explicit store id                                 0.02s  
  ✓ developer with store id resolves store                               0.01s  
  ✓ store owner resolves their store                                     0.01s  
  ✓ store manager resolves through staff                                 0.01s  
  ✓ logistics officer resolves through staff                             0.01s  
  ✓ user without store or staff aborts 403                               0.01s  
  ✓ store owner without store aborts 403                                 0.01s  
  ✓ developer with nonexistent store throws                              0.01s  

   PASS  Tests\Feature\AddressBookTest
  ✓ customer can save list update and delete addresses                   0.03s  
  ✓ exactly one default is kept and reassignment demotes the previous h… 0.01s  
  ✓ addresses require coordinates because checkout resolves stores from… 0.01s  
  ✓ addresses are scoped to their owner                                  0.01s  

   PASS  Tests\Feature\AdminMessageReplyTest
  ✓ developer can reply to contact message                               0.02s  
  ✓ developer can mark message read                                      0.01s  
  ✓ mark read can mark unread again                                      0.01s  
  ✓ mark read toggles when flag omitted                                  0.01s  
  ✓ customer cannot mark read                                            0.01s  
  ✓ customer cannot reply                                                0.01s  

   PASS  Tests\Feature\AdminProductDeletionTest
  ✓ product with order history is deactivated not deleted                0.01s  
  ✓ product without history is deleted                                   0.01s  

   PASS  Tests\Feature\ApiRouteContractTest
  ✓ every api route points at an existing controller method              0.01s  
  ✓ no api route is registered twice for the same method                 0.01s  

   PASS  Tests\Feature\AuditLogScopingTest
  ✓ store manager sees only their stores audit logs                      0.01s  
  ✓ entity audit endpoint hides cross store entities                     0.01s  
  ✓ rider audits are scoped by store                                     0.01s  

   PASS  Tests\Feature\AuthSecurityTest
  ✓ suspended user is rejected with a live token                         0.01s  
  ✓ suspended rider cannot claim orders                                  0.01s  
  ✓ forgot password response does not reveal account existence           0.41s  
  ✓ password reset revokes all existing tokens                           0.01s  
  ✓ refresh rotates the token                                            0.01s  

   PASS  Tests\Feature\AuthTest
  ✓ user can register                                                    0.02s  
  ✓ user can login                                                       0.01s  
  ✓ login fails with invalid credentials                                 0.01s  
  ✓ authenticated user can access user endpoint                          0.01s  
  ✓ unauthenticated user cannot access protected route                   0.01s  

   PASS  Tests\Feature\BannerTenantGuardTest
  ✓ owner can create banner scoped to their store                        0.01s  
  ✓ owner cannot reassign banner to another store on update              0.01s  
  ✓ owner cannot touch another stores banner                             0.01s  

   PASS  Tests\Feature\CartSyncTest
  ✓ sync sums quantities for matching products                           0.01s  
  ✓ sync caps quantity at eight                                          0.01s  
  ✓ sync drops inactive products with feedback                           0.01s  
  ✓ sync returns merged cart so device can replace draft                 0.01s  

   PASS  Tests\Feature\DatabaseSeedingTest
  ✓ seed creates demo logins for every console                           0.70s  
  ✓ seeding twice is idempotent                                          0.84s  

   PASS  Tests\Feature\EmailVerificationFlowTest
  ✓ registration sends the verification email with an spa link           0.01s  
  ✓ verify email marks the user verified                                 0.01s  
  ✓ verify email rejects a wrong hash                                    0.01s  

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response                        0.01s  

   PASS  Tests\Feature\FavoritesApiTest
  ✓ customer can favorite and list                                       0.01s  
  ✓ duplicate favorite is 409 not 500                                    0.01s  
  ✓ unfavorite is idempotent                                             0.01s  
  ✓ check endpoint reports favorited state                               0.01s  
  ✓ guest gets 401                                                       0.01s  

   PASS  Tests\Feature\FulfillmentApiTest
  ✓ validate returns the resolved store for a fulfillable cart           0.01s  
  ✓ inactive stores are never suggested                                  0.01s  
  ✓ validate rejects malformed payloads                                  0.01s  
  ✓ nearest store endpoint reports a store or null                       0.01s  

   PASS  Tests\Feature\HistoryCascadeGuardsTest
  ✓ category with products cannot be deleted                             0.01s  
  ✓ empty category can be deleted                                        0.01s  
  ✓ store with delivered order history cannot be deleted                 0.01s  
  ✓ store without history can be deleted                                 0.01s  
  ✓ rider with reviews cannot be deleted                                 0.01s  
  ✓ product stock rows are not orphaned by category delete guard         0.01s  

   PASS  Tests\Feature\ManualDispatchTest
  ✓ manager can list pending dispatch orders for their store             0.01s  
  ✓ manager can manually dispatch order to specific rider                0.01s  
  ✓ operations assign rejects order from another store                   0.02s  
  ✓ operations suggestion hides other stores orders                      0.01s  
  ✓ dispatch allows rider from another store                             0.01s  
  ✓ manager can reassign already claimed order                           0.02s  
  ✓ dispatch rejects rider with deactivated account                      0.01s  
  ✓ reassign rejects rider already at concurrent cap                     0.02s  
  ✓ pending list applies exact radius within the search box              0.01s  
  ✓ reassign rejects order from different store                          0.02s  
  ✓ developer requires explicit store id                                 0.01s  

   PASS  Tests\Feature\MigrationRollbackTest
  ✓ nullable store id migration can roll back                            0.03s  

   PASS  Tests\Feature\OrderLifecycleApiTest
  ✓ customer order journey list show cancel                              0.03s  
  ✓ customer cannot view another customers order                         0.02s  
  ✓ cancelling twice is rejected                                         0.02s  

   PASS  Tests\Feature\OrderPlacementTest
  ✓ customer can place an order                                          0.02s  
  ✓ order with no available rider enters retrying and keeps cart         0.01s  
  ✓ order defaults to cash on delivery                                   0.02s  
  ✓ placing an order clears the server cart                              0.02s  
  ✓ failed placement leaves server cart intact                           0.01s  
  ✓ order requires delivery coordinates                                  0.01s  
  ✓ customer can view own order                                          0.01s  
  ✓ customer cannot view others order                                    0.01s  
  ✓ customer can cancel own order                                        0.01s  
  ✓ customer cannot cancel others order                                  0.01s  
  ✓ customer cannot cancel out for delivery order                        0.01s  
  ✓ customer can confirm own delivery                                    0.01s  
  ✓ customer cannot confirm others order                                 0.01s  

   PASS  Tests\Feature\PersonalisedRecommendationsTest
  ✓ a customer with history gets personalised recommendations            0.02s  
  ✓ the affinity join qualifies its timestamp column                     0.01s  
  ✓ viewed products are boosted by the novelty signal                    0.01s  
  ✓ recommendations carry usable media urls                              0.01s  

   PASS  Tests\Feature\PickupOrderTest
  ✓ customer can place a pickup order without delivery details           0.01s  
  ✓ pickup order does not notify riders and keeps the cart clearing      0.01s  
  ✓ pickup requires a store                                              0.01s  
  ✓ pickup from a store that cannot fulfil the cart is rejected          0.01s  
  ✓ store moves a pickup order through ready and the customer confirms…  0.02s  
  ✓ ready is rejected for delivery orders and out for delivery for pick… 0.01s  
  ✓ pickup order cannot be manually dispatched to a rider                0.02s  
  ✓ pickup orders do not appear in the store dispatch queue              0.01s  
  ✓ pickup with stray delivery fields stores nulls                       0.01s  
  ✓ pickup order money cents mirrors are exact                           0.02s  
  ✓ pickup orders never appear in rider available orders                 0.01s  
  ✓ rider cannot claim a pickup order                                    0.01s  
  ✓ customer can cancel a ready pickup order before collecting           0.01s  

   PASS  Tests\Feature\ProductCarouselTest
  ✓ trending endpoint is not shadowed by slug route                      0.01s  
  ✓ popular returns delivered order products                             0.01s  
  ✓ new arrivals returns recent products without error                   0.01s  
  ✓ trending returns empty array when no orders                          0.01s  

   PASS  Tests\Feature\ProductIndexTest
  ✓ index respects per page param                                        0.02s  
  ✓ index filters by multiple category slugs                             0.02s  
  ✓ index defaults to twenty per page                                    0.01s  
  ✓ index caps per page at one hundred                                   0.04s  
  ✓ index ignores non numeric per page                                   0.01s  

   PASS  Tests\Feature\ProfileApiTest
  ✓ customer can update name and phone                                   0.01s  
  ✓ changing email resets verification                                   0.01s  
  ✓ keeping the same email keeps verification                            0.01s  
  ✓ email conflicts are 422                                              0.01s  
  ✓ changing email sends a new verification email                        0.01s  
  ✓ unchanged email sends no verification email                          0.01s  
  ✓ role is not mass assignable                                          0.01s  

   PASS  Tests\Feature\PromotionRedemptionTest
  ✓ validate rejects fully redeemed codes                                0.01s  
  ✓ validate rejects expired codes                                       0.01s  
  ✓ validate rejects orders below the minimum                            0.01s  
  ✓ validate computes percentage discount                                0.01s  
  ✓ validate caps fixed discounts at the subtotal                        0.01s  
  ✓ apply increments used count                                          0.01s  
  ✓ apply can never overshoot max uses                                   0.01s  
  ✓ apply redeems the final allowed use                                  0.01s  

   PASS  Tests\Feature\PublicCatalogueTest
  ✓ guest can list stores and view one by slug                           0.01s  
  ✓ guest can browse categories and products                             0.01s  
  ✓ guest can read recipes and unpublished are hidden                    0.01s  
  ✓ guest can read careers and community posts                           0.01s  
  ✓ guest can submit a contact message                                   0.01s  
  ✓ contact validation rejects garbage                                   0.01s  

   PASS  Tests\Feature\PushNotificationTest
  ✓ cancelled transition pushes notification                             0.01s  
  ✓ retrying transition pushes notification                              0.01s  
  ✓ delivered transition pushes notification                             0.01s  
  ✓ notification listener is queued not synchronous                      0.01s  
  ✓ no push without token                                                0.01s  

   PASS  Tests\Feature\RecommendationsEndpointTest
  ✓ cold start returns recommendations for new customer                  0.01s  
  ✓ inactive products are never recommended                              0.01s  
  ✓ guest gets 401                                                       0.01s  

   PASS  Tests\Feature\ReconcileReservationsTest
  ✓ consistent ledger is left alone                                      0.01s  
  ✓ drift is corrected                                                   0.01s  
  ✓ oversubscribed stock reconciles to clamped value without failing     0.01s  
  ✓ bought items and terminal orders do not count                        0.01s  

   PASS  Tests\Feature\RelatedProductsTest
  ✓ related endpoint returns same category first and excludes self       0.02s  
  ✓ bought together beats plain category siblings                        0.01s  
  ✓ sparse results are backfilled with popular products                  0.01s  
  ✓ related returns 404 for unknown or inactive slug                     0.01s  

   PASS  Tests\Feature\RiderLocationTest
  ✓ customer can view rider location for their order                     0.01s  
  ✓ returns null when order has no rider                                 0.01s  
  ✓ returns null when rider has no location                              0.01s  
  ✓ cannot view other customers order rider location                     0.01s  
  ✓ returns most recent location when multiple exist                     0.01s  
  ✓ rider can update location                                            0.01s  
  ✓ rider location update sets recorded at                               0.01s  
  ✓ rider location update overwrites previous                            0.01s  
  ✓ non rider cannot update location                                     0.01s  
  ✓ location update requires valid coordinates                           0.01s  

   PASS  Tests\Feature\RiderOrderGuardApiTest
  ✓ mark items bought returns 422 and keeps stock when order cancelled   0.02s  
  ✓ out for delivery returns 422 and order stays cancelled               0.09s  
  ✓ rider cannot advance out for delivery with unbought items            0.01s  

   PASS  Tests\Feature\RoutingEndpointTest
  ✓ geometry returns metrics even when osrm is unavailable               0.01s  
  ✓ geometry returns osrm geometry and metrics                           0.01s  
  ✓ route endpoint shape is unchanged                                    0.01s  
  ✓ geometry rejects out of range coordinates                            0.01s  

   PASS  Tests\Feature\SalesAndBannersTest
  ✓ logistics officer is locked out of sales                             0.01s  
  ✓ store operator sees only own store sales                             0.01s  
  ✓ owner cannot touch another store sale                                0.01s  
  ✓ owner create forces own store                                        0.01s  
  ✓ developer can create chain wide sale                                 0.01s  
  ✓ product sync attaches and detaches                                   0.02s  
  ✓ product sync cannot touch foreign store sale                         0.01s  
  ✓ public special show returns sale with products                       0.01s  
  ✓ public special show 404 for unknown slug                             0.01s  
  ✓ public special show includes ended sale with flag                    0.01s  
  ✓ sale banner gets sale cta on every slide                             0.01s  
  ✓ standalone banner stays standalone                                   0.01s  
  ✓ public banners expose special summary for sale banners               0.01s  
  ✓ owner cannot link another stores sale                                0.01s  

   FAIL  Tests\Feature\SeededCatalogueMediaTest
  ⨯ every seeded product image resolves to a real file                   0.32s  
  ⨯ every seeded product images array resolves to real files             0.31s  
  ✓ no catalogue endpoint emits a dead or svg media url                  0.41s  
  ✓ store inventory emits only resolvable media urls                     0.36s  

   PASS  Tests\Feature\SpecialsEndpointTest
  ✓ index lists only active specials within their window                 0.01s  
  ✓ products carry availability and effective price                      0.01s  
  ✓ inactive products are hidden from specials                           0.01s  

   PASS  Tests\Feature\StaffManagementTest
  ✓ owner can hire store staff                                           0.02s  
  ✓ owner can fire store staff                                           0.01s  
  ✓ owner can list store roster                                          0.01s  
  ✓ developer can list store roster                                      0.01s  
  ✓ roster is scoped to one store                                        0.01s  
  ✓ store manager cannot list roster                                     0.01s  
  ✓ store manager cannot hire staff                                      0.01s  

   PASS  Tests\Feature\StoreOrderApiTest
  ✓ orders are scoped to the managers store                              0.01s  
  ✓ store inventory returns root relative product image paths            0.14s  
  ✓ store inventory falls back to a raster placeholder for missing imag… 0.01s  
  ✓ store orders include every product snapshot                          0.02s  
  ✓ per page is capped                                                   0.02s  
  ✓ status update on another stores order is 404                         0.01s  
  ✓ invalid transition is 409                                            0.01s  
  ✓ valid transition succeeds                                            0.01s  

   PASS  Tests\Feature\TrackingEndpointTest
  ✓ view endpoint captures behavioral signal                             0.01s  
  ✓ search endpoint captures explicit intent                             0.01s  
  ✓ contact endpoint captures strong purchase intent                     0.01s  
  ✓ all tracking endpoints use rate limiting                             0.01s  
  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SeededCatalogueMediaTest > every seeded product ima…   
  Seeded products must reference images that exist under backend/public:
robertsons-ground-cinnamon-40g => 'products/pantry-staples/robertsons-ground-cinnamon-40g.webp'
robertsons-ground-ginger-40g => 'products/pantry-staples/robertsons-ground-ginger-40g.webp'
rajah-mild-and-spicy-durban-curry-powder-80g => 'products/pantry-staples/rajah-mild-and-spicy-durban-curry-powder-80g.webp'
robertsons-vanilla-essence-40ml => 'products/pantry-staples/robertsons-vanilla-essence-40ml.webp'
nestle-golden-syrup-500g => 'products/pantry-staples/nestle-golden-syrup-500g.webp'
bakers-tennis-biscuits-200g => 'products/snacks-treats/bakers-tennis-biscuits-200g.webp'
nestle-peppermint-crisp-chocolate-bar-49g => 'products/snacks-treats/nestle-peppermint-crisp-chocolate-bar-49g.webp'
cadbury-dairy-milk-peppermint-crisp-80g => 'products/snacks-treats/cadbury-dairy-milk-peppermint-crisp-80g.webp'
coconut-milk-400ml => 'products/pantry-staples/coconut-milk-400ml.webp'
Failed asserting that two arrays are identical.
  -Array &0 []
  +Array &0 [
  +    0 => 'robertsons-ground-cinnamon-40g => 'products/pantry-staples/robertsons-ground-cinnamon-40g.webp'',
  +    1 => 'robertsons-ground-ginger-40g => 'products/pantry-staples/robertsons-ground-ginger-40g.webp'',
  +    2 => 'rajah-mild-and-spicy-durban-curry-powder-80g => 'products/pantry-staples/rajah-mild-and-spicy-durban-curry-powder-80g.webp'',
  +    3 => 'robertsons-vanilla-essence-40ml => 'products/pantry-staples/robertsons-vanilla-essence-40ml.webp'',
  +    4 => 'nestle-golden-syrup-500g => 'products/pantry-staples/nestle-golden-syrup-500g.webp'',
  +    5 => 'bakers-tennis-biscuits-200g => 'products/snacks-treats/bakers-tennis-biscuits-200g.webp'',
  +    6 => 'nestle-peppermint-crisp-chocolate-bar-49g => 'products/snacks-treats/nestle-peppermint-crisp-chocolate-bar-49g.webp'',
  +    7 => 'cadbury-dairy-milk-peppermint-crisp-80g => 'products/snacks-treats/cadbury-dairy-milk-peppermint-crisp-80g.webp'',
  +    8 => 'coconut-milk-400ml => 'products/pantry-staples/coconut-milk-400ml.webp'',
  +]
  

  at tests/Feature/SeededCatalogueMediaTest.php:65
     61▕             ->reject(fn (Product $p) => $this->pathExists($p->image))
     62▕             ->map(fn (Product $p) => $p->slug.' => '.var_export($p->image, true))
     63▕             ->values();
     64▕ 
  ➜  65▕         $this->assertSame(
     66▕             [],
     67▕             $broken->all(),
     68▕             "Seeded products must reference images that exist under backend/public:\n".$broken->implode("\n")
     69▕         );

  1   tests/Feature/SeededCatalogueMediaTest.php:65

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SeededCatalogueMediaTest > every seeded product ima…   
  Product.images[] entries must exist on disk:
robertsons-ground-cinnamon-40g => 'products/pantry-staples/robertsons-ground-cinnamon-40g.webp'
robertsons-ground-ginger-40g => 'products/pantry-staples/robertsons-ground-ginger-40g.webp'
rajah-mild-and-spicy-durban-curry-powder-80g => 'products/pantry-staples/rajah-mild-and-spicy-durban-curry-powder-80g.webp'
robertsons-vanilla-essence-40ml => 'products/pantry-staples/robertsons-vanilla-essence-40ml.webp'
nestle-golden-syrup-500g => 'products/pantry-staples/nestle-golden-syrup-500g.webp'
bakers-tennis-biscuits-200g => 'products/snacks-treats/bakers-tennis-biscuits-200g.webp'
nestle-peppermint-crisp-chocolate-bar-49g => 'products/snacks-treats/nestle-peppermint-crisp-chocolate-bar-49g.webp'
cadbury-dairy-milk-peppermint-crisp-80g => 'products/snacks-treats/cadbury-dairy-milk-peppermint-crisp-80g.webp'
coconut-milk-400ml => 'products/pantry-staples/coconut-milk-400ml.webp'
Failed asserting that two arrays are identical.
  -Array &0 []
  +Array &0 [
  +    0 => 'robertsons-ground-cinnamon-40g => 'products/pantry-staples/robertsons-ground-cinnamon-40g.webp'',
  +    1 => 'robertsons-ground-ginger-40g => 'products/pantry-staples/robertsons-ground-ginger-40g.webp'',
  +    2 => 'rajah-mild-and-spicy-durban-curry-powder-80g => 'products/pantry-staples/rajah-mild-and-spicy-durban-curry-powder-80g.webp'',
  +    3 => 'robertsons-vanilla-essence-40ml => 'products/pantry-staples/robertsons-vanilla-essence-40ml.webp'',
  +    4 => 'nestle-golden-syrup-500g => 'products/pantry-staples/nestle-golden-syrup-500g.webp'',
  +    5 => 'bakers-tennis-biscuits-200g => 'products/snacks-treats/bakers-tennis-biscuits-200g.webp'',
  +    6 => 'nestle-peppermint-crisp-chocolate-bar-49g => 'products/snacks-treats/nestle-peppermint-crisp-chocolate-bar-49g.webp'',
  +    7 => 'cadbury-dairy-milk-peppermint-crisp-80g => 'products/snacks-treats/cadbury-dairy-milk-peppermint-crisp-80g.webp'',
  +    8 => 'coconut-milk-400ml => 'products/pantry-staples/coconut-milk-400ml.webp'',
  +]
  

  at tests/Feature/SeededCatalogueMediaTest.php:83
     79▕                 }
     80▕             }
     81▕         }
     82▕ 
  ➜  83▕         $this->assertSame([], $broken, "Product.images[] entries must exist on disk:\n".implode("\n", $broken));
     84▕     }
     85▕ 
     86▕     public function test_no_catalogue_endpoint_emits_a_dead_or_svg_media_url(): void
     87▕     {

  1   tests/Feature/SeededCatalogueMediaTest.php:83


  Tests:    2 failed, 475 passed (3121 assertions)
  Duration: 8.54s

```
### bootstrap/cache
```
total 40
drwxr-xr-x 2 runner runner  4096 Sep 27 01:35 .
drwxr-xr-x 3 runner runner  4096 Sep 27 01:35 ..
-rw-r--r-- 1 runner runner    14 Sep 27 01:35 .gitignore
-rwxr-xr-x 1 runner runner   960 Sep 27 01:35 packages.php
-rwxr-xr-x 1 runner runner 21492 Sep 27 01:35 services.php
```
