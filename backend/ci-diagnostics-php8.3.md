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
  ✓ eligible stores sorts by distance nearest first                      0.01s  
  ✓ eligible stores returns empty when no stores within radius           0.01s  
  ✓ eligible stores excludes store outside its own radius                0.01s  
  ✓ eligible stores includes distance km in results                      0.01s  
  ✓ eligible stores returns central as nearest when customer at central  0.01s  
  ✓ eligible rider returns available rider at matching store             0.01s  
  ✓ eligible rider rejects unavailable rider                             0.01s  
  ✓ eligible rider rejects suspended rider                               0.01s  
  ✓ eligible rider rejects rider with insufficient radius                0.01s  
  ✓ eligible rider returns null when no riders match store               0.01s  
  ✓ eligible rider picks first available rider                           0.01s  
  ✓ eligible rider accepts rider with exact max radius                   0.01s  
  ✓ eligible rider skips available but suspended before unavailable      0.01s  
  ✓ max fallback stores returns config value
  ✓ max attempts returns config value
  ✓ retry interval seconds returns config value

   PASS  Tests\Unit\DispatchServiceTest
  ✓ cancels order when delivery coordinates missing                      0.02s  
  ✓ dispatches to closest store with available rider                     0.02s  
  ✓ enters retrying when no riders available                             0.02s  
  ✓ dispatch to retrying creates activity log                            0.01s  
  ✓ retry assigns rider when one becomes available                       0.01s  
  ✓ retry increments attempts while still no riders                      0.01s  
  ✓ retry cancels order after max attempts                               0.01s  
  ✓ retry ignores orders not retrying                                    0.01s  
  ✓ dispatch creates activity log on cancellation                        0.01s  
  ✓ picks nearest store when both have riders                            0.01s  

   PASS  Tests\Unit\DispatchSuggestionServiceTest
  ✓ suspended riders excluded                                            0.01s  
  ✓ available riders included                                            0.01s  
  ✓ unavailable riders excluded                                          0.01s  
  ✓ returns null for nonexistent order                                   0.01s  
  ✓ returns null when no delivery coords                                 0.01s  

   PASS  Tests\Unit\ExampleTest
  ✓ that true is true

   PASS  Tests\Unit\GamificationServiceTest
  ✓ xp increments atomically                                             0.01s  
  ✓ delivery completed increments total deliveries                       0.01s  
  ✓ level up calculated correctly                                        0.01s  
  ✓ no level up when xp insufficient                                     0.01s  
  ✓ first delivery awards badge                                          0.01s  
  ✓ first delivery does not duplicate badge                              0.01s  
  ✓ century badge at 100 deliveries                                      0.01s  
  ✓ century badge not awarded below 100                                  0.01s  
  ✓ order confirmed xp                                                   0.01s  
  ✓ unknown event grants zero xp                                         0.01s  

   PASS  Tests\Unit\MapLayersServiceTest
  ✓ cluster points groups nearby points                                  0.01s  
  ✓ cluster points returns lat lng count
  ✓ cluster points averages coordinates                                  0.01s  
  ✓ cluster points empty input
  ✓ get layers returns traffic routes demand                             0.01s  
  ✓ traffic includes recent orders                                       0.01s  
  ✓ routes includes active delivery riders                               0.01s  
  ✓ routes empty when no active deliveries                               0.01s  
  ✓ demand includes orders from last 7 days                              0.01s  

   PASS  Tests\Unit\OrderCancellationPolicyTest
  ✓ customer can cancel pending order                                    0.01s  
  ✓ customer can cancel confirmed order                                  0.01s  
  ✓ customer can cancel preparing order                                  0.01s  
  ✓ customer can cancel retrying order                                   0.01s  
  ✓ customer cannot cancel out for delivery order                        0.01s  
  ✓ customer cannot cancel delivered order                               0.01s  
  ✓ customer cannot cancel cancelled order                               0.01s  

   PASS  Tests\Unit\OrderCartPolicyTest
  ✓ cart is cleared when order proceeds                                  0.01s  
  ✓ cart is kept when dispatch cancelled so customer can recheckout      0.01s  
  ✓ cart is kept while dispatch is retrying                              0.01s  

   PASS  Tests\Unit\OrderClaimTest
  ✓ successful claim assigns rider and store                             0.01s  
  ✓ successful claim returns claim result dto                            0.01s  
  ✓ successful claim transitions order to preparing                      0.01s  
  ✓ claim from retrying status succeeds                                  0.01s  
  ✓ claim already claimed order returns false                            0.01s  
  ✓ claim with pending order rejects                                     0.01s  
  ✓ claim with preparing order rejects                                   0.01s  
  ✓ claim with delivered order rejects                                   0.01s  
  ✓ claim with cancelled order rejects                                   0.01s  
  ✓ claim with out for delivery order rejects                            0.01s  
  ✓ claim syncs store product ids on order items                         0.02s  
  ✓ claim syncs multiple order items to correct store products           0.01s  
  ✓ claim does not sync item when no matching store product exists       0.01s  
  ✓ claim reserves inventory                                             0.01s  
  ✓ claim reserves inventory for multiple items                          0.01s  
  ✓ claim does not reserve when store product id is null                 0.01s  
  ✓ claim creates rider assigned activity log                            0.01s  
  ✓ claim sets rider and store on order persisted in database            0.01s  
  ✓ sequential double claim only one succeeds                            0.01s  
  ✓ claim uses skip locked fallback for sqlite                           0.01s  
  ✓ two orders can be claimed independently                              0.01s  
  ✓ claim atomically transitions and assigns in single transaction       0.01s  
  ✓ claim on order with no items succeeds                                0.01s  
  ✓ claim latency is non negative                                        0.01s  
  ✓ claim from each valid status succeeds                                0.01s  
  ✓ claim rejects rider already at concurrent order cap                  0.01s  
  ✓ claim allows rider to take order after delivery                      0.01s  
  ✓ claim cap of zero allows unlimited batching                          0.01s  
  ✓ claim preserves existing rider id returns false                      0.01s  
  ✓ claim unsets null rider id in where clause                           0.01s  
  ✓ claim transitions from confirmed creates activity log with correct…  0.01s  
  ✓ claim transitions from retrying creates activity log                 0.01s  

   PASS  Tests\Unit\OrderPolicyTest
  ✓ customer can view own order                                          0.02s  
  ✓ customer cannot view others order                                    0.01s  
  ✓ customer can confirm delivery of own order                           0.01s  
  ✓ customer cannot confirm delivery of others order                     0.01s  
  ✓ customer can review own order                                        0.01s  
  ✓ customer cannot review others order                                  0.01s  
  ✓ customer can cancel own order                                        0.01s  
  ✓ customer cannot cancel others order                                  0.01s  
  ✓ assigned rider can view the order                                    0.01s  
  ✓ unassigned rider cannot view the order                               0.01s  
  ✓ rider cannot confirm delivery                                        0.01s  

   PASS  Tests\Unit\OrderStateMachineTest
  ✓ pending to confirmed                                                 0.01s  
  ✓ confirmed to preparing                                               0.01s  
  ✓ preparing to out for delivery                                        0.01s  
  ✓ out for delivery to delivered                                        0.01s  
  ✓ pending to cancelled                                                 0.01s  
  ✓ confirmed to cancelled                                               0.01s  
  ✓ out for delivery to cancelled                                        0.01s  
  ✓ confirmed to retrying                                                0.01s  
  ✓ retrying to preparing                                                0.01s  
  ✓ retrying to cancelled                                                0.01s  
  ✓ pending to retrying throws                                           0.01s  
  ✓ delivered to preparing throws                                        0.01s  
  ✓ cancelled to confirmed throws                                        0.01s  
  ✓ same status transition throws                                        0.01s  
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
  ✓ can transition returns true for valid                                0.01s  
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
  ✓ returns regular price when no sale price and no specials             0.02s  
  ✓ returns sale price when set                                          0.01s  
  ✓ returns regular price when belongs to collection special             0.01s  
  ✓ sale price takes priority over collection special                    0.01s  

   PASS  Tests\Unit\ReviewServiceTest
  ✓ submit review success                                                0.01s  
  ✓ submit review updates order rating                                   0.01s  
  ✓ submit review rejects order without rider                            0.01s  
  ✓ submit review rejects non delivered order                            0.01s  
  ✓ submit review rejects duplicate review                               0.01s  
  ✓ submit review creates review record                                  0.01s  
  ✓ submit review updates rider average rating                           0.01s  
  ✓ submit review throws on nonexistent order                            0.01s  

   PASS  Tests\Unit\RiderStatsRecorderTest
  ✓ first review sets average rating                                     0.01s  
  ✓ second review computes weighted average                              0.01s  
  ✓ multiple reviews compute correct average                             0.01s  
  ✓ review count matches database                                        0.01s  
  ✓ rider must exist to record                                           0.01s  
  ✓ weighted average is accurate with decimals                           0.01s  

   PASS  Tests\Unit\RoutingServiceTest
  ✓ mock provider returns known values                                   0.01s  
  ✓ mock provider returns null geometry                                  0.01s  
  ✓ haversine fallback when osrm unavailable
  ✓ osrm used when configured and available                              0.01s  
  ✓ osrm failure falls back to haversine                                 0.01s  
  ✓ osrm timeout falls back to haversine
  ✓ get route geometry returns null when osrm unavailable
  ✓ route result to array
  ✓ route result null geometry
  ✓ custom osrm base url overrides config

   PASS  Tests\Unit\Services\AnalyticsServiceTest
  ✓ sales data returns revenue over time                                 0.01s  
  ✓ sales data respects period                                           0.01s  
  ✓ products data returns top products                                   0.01s  
  ✓ riders data returns utilization                                      0.01s  
  ✓ empty store returns zeros                                            0.01s  

   PASS  Tests\Unit\Services\BehavioralTrackingServiceTest
  ✓ signal taxonomy has explicit intent tier                             0.01s  
  ✓ capture does not throw                                               0.01s  
  ✓ negative signals have negative weights

   PASS  Tests\Unit\Services\DispatchSuggestionServiceTest
  ✓ returns nearest rider by distance                                    0.01s  
  ✓ excludes unavailable riders                                          0.01s  
  ✓ excludes riders with insufficient radius                             0.01s  
  ✓ returns alternative riders                                           0.01s  
  ✓ returns order details                                                0.01s  
  ✓ returns null for nonexistent order
  ✓ distance is calculated correctly                                     0.01s  

   PASS  Tests\Unit\Services\EventFeedServiceTest
  ✓ returns order state change events                                    0.01s  
  ✓ returns rider availability events                                    0.01s  
  ✓ returns dispatch events from audit logs                              0.01s  
  ✓ respects cursor pagination                                           0.01s  
  ✓ severity is mapped from order status                                 0.01s  
  ✓ events are ordered by created at desc                                0.01s  
  ✓ limit is respected                                                   0.01s  
  ✓ empty result when no data                                            0.01s  

   PASS  Tests\Unit\StockManagementTest
  ✓ mark items bought decrements stock quantity                          0.01s  
  ✓ mark items bought decrements stock for multiple items                0.01s  
  ✓ mark items bought releases reservation and decrements stock          0.01s  
  ✓ partial batch can be continued in a later call                       0.01s  
  ✓ mark items bought ignores unknown item ids                           0.01s  
  ✓ mark items bought throws when insufficient stock                     0.01s  
  ✓ mark items bought does not decrement stock on failure                0.01s  
  ✓ mark items bought throws when product not available                  0.01s  
  ✓ mark items bought is idempotent                                      0.01s  
  ✓ mark items bought creates activity log                               0.01s  
  ✓ order cancellation releases reserved quantity                        0.01s  
  ✓ order cancellation does not affect stock quantity                    0.01s  
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

   PASS  Tests\Feature\AdminMessageReplyTest
  ✓ developer can reply to contact message                               0.02s  
  ✓ customer cannot reply                                                0.01s  

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
  ✓ unauthenticated user cannot access protected route

   PASS  Tests\Feature\CartSyncTest
  ✓ sync sums quantities for matching products                           0.01s  
  ✓ sync caps quantity at eight                                          0.01s  
  ✓ sync drops inactive products with feedback                           0.01s  
  ✓ sync returns merged cart so device can replace draft                 0.01s  

   PASS  Tests\Feature\EmailVerificationFlowTest
  ✓ registration sends the verification email with an spa link           0.01s  
  ✓ verify email marks the user verified                                 0.01s  
  ✓ verify email rejects a wrong hash                                    0.01s  

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response                        0.01s  

   PASS  Tests\Feature\ManualDispatchTest
  ✓ manager can list pending dispatch orders for their store             0.01s  
  ✓ manager can manually dispatch order to specific rider                0.01s  
  ✓ operations assign rejects order from another store                   0.01s  
  ✓ operations suggestion hides other stores orders                      0.01s  
  ✓ dispatch rejects rider from another store                            0.01s  
  ✓ manager can reassign already claimed order                           0.02s  
  ✓ reassign rejects order from different store                          0.02s  
  ✓ developer requires explicit store id                                 0.01s  

   PASS  Tests\Feature\MigrationRollbackTest
  ✓ nullable store id migration can roll back                            0.03s  

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

   PASS  Tests\Feature\ProductCarouselTest
  ✓ trending endpoint is not shadowed by slug route                      0.01s  
  ✓ popular returns delivered order products                             0.01s  
  ✓ new arrivals returns recent products without error                   0.01s  
  ✓ trending returns empty array when no orders                          0.01s  

   PASS  Tests\Feature\ProductIndexTest
  ✓ index respects per page param                                        0.02s  
  ✓ index filters by multiple category slugs                             0.01s  
  ✓ index defaults to twenty per page                                    0.02s  
  ✓ index caps per page at one hundred                                   0.03s  
  ✓ index ignores non numeric per page                                   0.01s  

   PASS  Tests\Feature\PromotionRedemptionTest
  ✓ validate rejects fully redeemed codes                                0.01s  
  ✓ validate rejects expired codes                                       0.01s  
  ✓ validate rejects orders below the minimum                            0.01s  
  ✓ validate computes percentage discount                                0.01s  
  ✓ validate caps fixed discounts at the subtotal                        0.01s  
  ✓ apply increments used count                                          0.01s  
  ✓ apply can never overshoot max uses                                   0.01s  
  ✓ apply redeems the final allowed use                                  0.01s  

   PASS  Tests\Feature\PushNotificationTest
  ✓ cancelled transition pushes notification                             0.01s  
  ✓ retrying transition pushes notification                              0.01s  
  ✓ delivered transition pushes notification                             0.01s  
  ✓ notification listener is queued not synchronous                      0.01s  
  ✓ no push without token                                                0.01s  

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

   FAIL  Tests\Feature\SpecialsEndpointTest
  ✓ index lists only active specials within their window                 0.01s  
  ⨯ products carry availability and effective price                      0.01s  
  ✓ inactive products are hidden from specials                           0.01s  

   PASS  Tests\Feature\StaffManagementTest
  ✓ owner can hire store staff                                           0.01s  
  ✓ owner can fire store staff                                           0.01s  
  ✓ store manager cannot hire staff                                      0.01s  

   PASS  Tests\Feature\TrackingEndpointTest
  ✓ view endpoint captures behavioral signal                             0.01s  
  ✓ search endpoint captures explicit intent                             0.01s  
  ✓ contact endpoint captures strong purchase intent                     0.01s  
  ✓ all tracking endpoints use rate limiting
  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SpecialsEndpointTest > products car…  ErrorException   
  Undefined variable $response

  at tests/Feature/SpecialsEndpointTest.php:67
     63▕             ->assertJsonPath('data.0.products.0.effective_price', 15)
     64▕             ->assertJsonPath('data.0.products.0.stores.0.id', $store->id)
     65▕             ->assertJsonPath('data.0.products.0.stores.0.stock_quantity', 7);
     66▕ 
  ➜  67▕         $this->assertEqualsWithDelta(15.0, $response->json('data.0.products.0.effective_price'), 0.001);
     68▕     }
     69▕ 
     70▕     public function test_inactive_products_are_hidden_from_specials(): void
     71▕     {


  Tests:    1 failed, 340 passed (797 assertions)
  Duration: 3.70s

```
### bootstrap/cache
```
total 40
drwxr-xr-x 2 runner runner  4096 Sep  5 00:35 .
drwxr-xr-x 3 runner runner  4096 Sep  5 00:34 ..
-rw-r--r-- 1 runner runner    14 Sep  5 00:34 .gitignore
-rwxr-xr-x 1 runner runner   960 Sep  5 00:35 packages.php
-rwxr-xr-x 1 runner runner 21492 Sep  5 00:35 services.php
```
