## Backend CI diagnostics (PHP 8.3)

### php -v
```
PHP 8.3.33 (cli) (built: Jul 29 2026 08:05:09) (NTS)
Copyright (c) The PHP Group
Zend Engine v4.3.33, Copyright (c) Zend Technologies
    with Zend OPcache v8.3.33, Copyright (c), by Zend Technologies
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
  ✓ confirmed to retrying                                                0.01s  
  ✓ retrying to preparing                                                0.01s  
  ✓ retrying to cancelled                                                0.01s  
  ✓ pending to retrying throws                                           0.01s  
  ✓ delivered to preparing throws                                        0.01s  
  ✓ cancelled to confirmed throws                                        0.01s  
  ✓ same status transition throws                                        0.01s  
  ✓ transition rejects stale in memory status snapshot                   0.01s  
  ✓ lost transition race does not overwrite committed status or log      0.01s  
  ✓ activity log contains correct data with actor and metadata           0.01s  
  ✓ activity log persisted in database                                   0.01s  

   PASS  Tests\Unit\PaymentStateMachineTest
  ✓ pending to paid                                                      0.02s  
  ✓ paid to refunded                                                     0.01s  
  ✓ pending to refunded throws                                           0.01s  
  ✓ paid to pending throws                                               0.01s  
  ✓ refunded to paid throws                                              0.01s  
  ✓ refunded to pending throws                                           0.01s  
  ✓ same status transition throws                                        0.01s  
  ✓ paid to paid throws                                                  0.01s  
  ✓ can transition returns true for valid                                0.02s  
  ✓ can transition returns false for invalid                             0.01s  
  ✓ transaction created on pending to paid                               0.01s  
  ✓ transaction created on paid to refunded                              0.01s  
  ✓ actor user id used when provided                                     0.01s  
  ✓ customer id used when no actor                                       0.01s  
  ✓ multiple transitions create multiple transactions                    0.01s  
  ✓ order relationship maintained on transaction                         0.01s  
  ✓ idempotent transition throws on second call                          0.01s  
  ✓ transaction not created when record transaction disabled             0.01s  

   PASS  Tests\Unit\PricingServiceTest
  ✓ base price when no deals                                             0.02s  
  ✓ sale price wins when below base                                      0.01s  
  ✓ sale price above base never overcharges                              0.01s  
  ✓ special pivot price is honoured                                      0.01s  
  ✓ special price above base never overcharges                           0.01s  
  ✓ sale price takes priority over specials                              0.01s  

   PASS  Tests\Unit\ReviewServiceTest
  ✓ submit review success                                                0.02s  
  ✓ submit review updates order rating                                   0.01s  
  ✓ submit review rejects order without rider                            0.01s  
  ✓ submit review rejects non delivered order                            0.01s  
  ✓ submit review rejects duplicate review                               0.01s  
  ✓ submit review creates review record                                  0.02s  
  ✓ submit review updates rider average rating                           0.01s  
  ✓ submit review throws on nonexistent order                            0.01s  

   PASS  Tests\Unit\RiderStatsRecorderTest
  ✓ first review sets average rating                                     0.02s  
  ✓ second review computes weighted average                              0.01s  
  ✓ multiple reviews compute correct average                             0.01s  
  ✓ review count matches database                                        0.01s  
  ✓ rider must exist to record                                           0.02s  
  ✓ weighted average is accurate with decimals                           0.01s  

   PASS  Tests\Unit\RoutingServiceTest
  ✓ mock provider returns known values                                   0.01s  
  ✓ mock provider returns null geometry                                  0.01s  
  ✓ haversine fallback when osrm unavailable                             0.01s  
  ✓ osrm used when configured and available                              0.02s  
  ✓ osrm failure falls back to haversine                                 0.01s  
  ✓ osrm timeout falls back to haversine                                 0.01s  
  ✓ get route geometry returns null when osrm unavailable                0.01s  
  ✓ route result to array                                                0.01s  
  ✓ route result null geometry                                           0.01s  
  ✓ custom osrm base url overrides config                                0.01s  

   PASS  Tests\Unit\Services\AnalyticsServiceTest
  ✓ sales data returns revenue over time                                 0.02s  
  ✓ sales data respects period                                           0.01s  
  ✓ products data returns top products                                   0.01s  
  ✓ riders data returns utilization                                      0.01s  
  ✓ empty store returns zeros                                            0.01s  

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
  ✓ returns order state change events                                    0.01s  
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
  ✓ mark items bought releases reservation and decrements stock          0.01s  
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
  ✓ order cancellation releases reserved quantity                        0.02s  
  ✓ order cancellation does not affect stock quantity                    0.01s  
  ✓ lost cancel race does not release reservations                       0.01s  
  ✓ order cancellation clamps reserved quantity at zero                  0.01s  
  ✓ order cancellation does not release reservations for bought items    0.02s  
  ✓ delivery releases reservations for unbought items                    0.01s  
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

   PASS  Tests\Feature\AddressBookTest
  ✓ customer can save list update and delete addresses                   0.04s  
  ✓ exactly one default is kept and reassignment demotes the previous h… 0.02s  
  ✓ addresses require coordinates because checkout resolves stores from… 0.01s  
  ✓ addresses are scoped to their owner                                  0.02s  

   PASS  Tests\Feature\AdminMessageReplyTest
  ✓ developer can reply to contact message                               0.02s  
  ✓ developer can mark message read                                      0.01s  
  ✓ mark read can mark unread again                                      0.01s  
  ✓ mark read toggles when flag omitted                                  0.01s  
  ✓ customer cannot mark read                                            0.01s  
  ✓ customer cannot reply                                                0.01s  

   PASS  Tests\Feature\AdminProductDeletionTest
  ✓ product with order history is deactivated not deleted                0.02s  
  ✓ product without history is deleted                                   0.01s  

   PASS  Tests\Feature\AuditLogScopingTest
  ✓ store manager sees only their stores audit logs                      0.02s  
  ✓ entity audit endpoint hides cross store entities                     0.01s  
  ✓ rider audits are scoped by store                                     0.02s  

   PASS  Tests\Feature\AuthSecurityTest
  ✓ suspended user is rejected with a live token                         0.02s  
  ✓ suspended rider cannot claim orders                                  0.01s  
  ✓ forgot password response does not reveal account existence           0.41s  
  ✓ password reset revokes all existing tokens                           0.02s  
  ✓ refresh rotates the token                                            0.01s  

   PASS  Tests\Feature\AuthTest
  ✓ user can register                                                    0.03s  
  ✓ user can login                                                       0.01s  
  ✓ login fails with invalid credentials                                 0.01s  
  ✓ authenticated user can access user endpoint                          0.01s  
  ✓ unauthenticated user cannot access protected route                   0.01s  

   PASS  Tests\Feature\BannerTenantGuardTest
  ✓ owner can create banner scoped to their store                        0.02s  
  ✓ owner cannot reassign banner to another store on update              0.01s  
  ✓ owner cannot touch another stores banner                             0.01s  

   PASS  Tests\Feature\CartSyncTest
  ✓ sync sums quantities for matching products                           0.01s  
  ✓ sync caps quantity at eight                                          0.01s  
  ✓ sync drops inactive products with feedback                           0.01s  
  ✓ sync returns merged cart so device can replace draft                 0.01s  

   PASS  Tests\Feature\DatabaseSeedingTest
  ✓ seed creates demo logins for every console                           0.55s  
  ✓ seeding twice is idempotent                                          0.71s  

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
  ✓ validate returns the resolved store for a fulfillable cart           0.02s  
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

   FAIL  Tests\Feature\ManualDispatchTest
  ✓ manager can list pending dispatch orders for their store             0.02s  
  ✓ manager can manually dispatch order to specific rider                0.02s  
  ✓ operations assign rejects order from another store                   0.02s  
  ✓ operations suggestion hides other stores orders                      0.02s  
  ⨯ dispatch rejects rider from another store                            0.02s  
  ✓ manager can reassign already claimed order                           0.02s  
  ✓ dispatch rejects rider with deactivated account                      0.01s  
  ✓ reassign rejects rider already at concurrent cap                     0.03s  
  ✓ pending list applies exact radius within the search box              0.02s  
  ✓ reassign rejects order from different store                          0.02s  
  ✓ developer requires explicit store id                                 0.01s  

   PASS  Tests\Feature\MigrationRollbackTest
  ✓ nullable store id migration can roll back                            0.04s  

   PASS  Tests\Feature\OrderLifecycleApiTest
  ✓ customer order journey list show cancel                              0.04s  
  ✓ customer cannot view another customers order                         0.02s  
  ✓ cancelling twice is rejected                                         0.02s  

   PASS  Tests\Feature\OrderPlacementTest
  ✓ customer can place an order                                          0.03s  
  ✓ order with no available rider enters retrying and keeps cart         0.02s  
  ✓ order defaults to cash on delivery                                   0.02s  
  ✓ placing an order clears the server cart                              0.02s  
  ✓ failed placement leaves server cart intact                           0.01s  
  ✓ order requires delivery coordinates                                  0.01s  
  ✓ customer can view own order                                          0.02s  
  ✓ customer cannot view others order                                    0.01s  
  ✓ customer can cancel own order                                        0.01s  
  ✓ customer cannot cancel others order                                  0.01s  
  ✓ customer cannot cancel out for delivery order                        0.01s  
  ✓ customer can confirm own delivery                                    0.01s  
  ✓ customer cannot confirm others order                                 0.01s  

   PASS  Tests\Feature\PickupOrderTest
  ✓ customer can place a pickup order without delivery details           0.03s  
  ✓ pickup order does not notify riders and keeps the cart clearing      0.02s  
  ✓ pickup requires a store                                              0.01s  
  ✓ pickup from a store that cannot fulfil the cart is rejected          0.02s  
  ✓ store moves a pickup order through ready and the customer confirms…  0.04s  
  ✓ ready is rejected for delivery orders and out for delivery for pick… 0.01s  
  ✓ pickup order cannot be manually dispatched to a rider                0.02s  
  ✓ pickup orders do not appear in the store dispatch queue              0.02s  
  ✓ pickup with stray delivery fields stores nulls                       0.02s  
  ✓ pickup order money cents mirrors are exact                           0.02s  
  ✓ pickup orders never appear in rider available orders                 0.02s  
  ✓ rider cannot claim a pickup order                                    0.02s  
  ✓ customer can cancel a ready pickup order before collecting           0.02s  

   PASS  Tests\Feature\ProductCarouselTest
  ✓ trending endpoint is not shadowed by slug route                      0.02s  
  ✓ popular returns delivered order products                             0.01s  
  ✓ new arrivals returns recent products without error                   0.01s  
  ✓ trending returns empty array when no orders                          0.01s  

   PASS  Tests\Feature\ProductIndexTest
  ✓ index respects per page param                                        0.03s  
  ✓ index filters by multiple category slugs                             0.02s  
  ✓ index defaults to twenty per page                                    0.02s  
  ✓ index caps per page at one hundred                                   0.06s  
  ✓ index ignores non numeric per page                                   0.02s  

   PASS  Tests\Feature\ProfileApiTest
  ✓ customer can update name and phone                                   0.01s  
  ✓ changing email resets verification                                   0.02s  
  ✓ keeping the same email keeps verification                            0.01s  
  ✓ email conflicts are 422                                              0.01s  
  ✓ changing email sends a new verification email                        0.01s  
  ✓ unchanged email sends no verification email                          0.01s  
  ✓ role is not mass assignable                                          0.01s  

   PASS  Tests\Feature\PromotionRedemptionTest
  ✓ validate rejects fully redeemed codes                                0.02s  
  ✓ validate rejects expired codes                                       0.01s  
  ✓ validate rejects orders below the minimum                            0.01s  
  ✓ validate computes percentage discount                                0.01s  
  ✓ validate caps fixed discounts at the subtotal                        0.01s  
  ✓ apply increments used count                                          0.01s  
  ✓ apply can never overshoot max uses                                   0.01s  
  ✓ apply redeems the final allowed use                                  0.01s  

   PASS  Tests\Feature\PublicCatalogueTest
  ✓ guest can list stores and view one by slug                           0.02s  
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
  ✓ cold start returns recommendations for new customer                  0.02s  
  ✓ inactive products are never recommended                              0.01s  
  ✓ guest gets 401                                                       0.01s  

   PASS  Tests\Feature\ReconcileReservationsTest
  ✓ consistent ledger is left alone                                      0.01s  
  ✓ drift is corrected                                                   0.01s  
  ✓ oversubscribed stock reconciles to clamped value without failing     0.01s  
  ✓ bought items and terminal orders do not count                        0.01s  

   PASS  Tests\Feature\RelatedProductsTest
  ✓ related endpoint returns same category first and excludes self       0.02s  
  ✓ bought together beats plain category siblings                        0.02s  
  ✓ sparse results are backfilled with popular products                  0.02s  
  ✓ related returns 404 for unknown or inactive slug                     0.01s  

   PASS  Tests\Feature\RiderLocationTest
  ✓ customer can view rider location for their order                     0.02s  
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
  ✓ out for delivery returns 422 and order stays cancelled               0.02s  
  ✓ rider cannot advance out for delivery with unbought items            0.01s  

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
  ✓ orders are scoped to the managers store                              0.02s  
  ✓ per page is capped                                                   0.01s  
  ✓ status update on another stores order is 404                         0.01s  
  ✓ invalid transition is 409                                            0.01s  
  ✓ valid transition succeeds                                            0.01s  

   PASS  Tests\Feature\TrackingEndpointTest
  ✓ view endpoint captures behavioral signal                             0.02s  
  ✓ search endpoint captures explicit intent                             0.01s  
  ✓ contact endpoint captures strong purchase intent                     0.01s  
  ✓ all tracking endpoints use rate limiting                             0.01s  
  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\ManualDispatchTest > dispatch rejects rider from an…   
  Expected response status code [403] but received 409.
Failed asserting that 409 is identical to 403.

  at tests/Feature/ManualDispatchTest.php:226
    222▕         $outsider = $this->makeRider('outsider@example.com', $otherStore->id);
    223▕ 
    224▕         $this->actingAs($this->manager)
    225▕             ->postJson("/api/store/orders/{$order->id}/dispatch", ['rider_id' => $outsider->id])
  ➜ 226▕             ->assertStatus(403)
    227▕             ->assertJson(['reason' => 'rider_wrong_store']);
    228▕     }
    229▕ 
    230▕     public function test_manager_can_reassign_already_claimed_order(): void


  Tests:    1 failed, 438 passed (1153 assertions)
  Duration: 8.04s

```
### bootstrap/cache
```
total 40
drwxr-xr-x 2 runner runner  4096 Sep 13 05:04 .
drwxr-xr-x 3 runner runner  4096 Sep 13 05:04 ..
-rw-r--r-- 1 runner runner    14 Sep 13 05:04 .gitignore
-rwxr-xr-x 1 runner runner   960 Sep 13 05:04 packages.php
-rwxr-xr-x 1 runner runner 21492 Sep 13 05:04 services.php
```
