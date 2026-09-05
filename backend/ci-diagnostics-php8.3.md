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
  ✓ two orders can be claimed independently                              0.02s  
  ✓ claim atomically transitions and assigns in single transaction       0.02s  
  ✓ claim on order with no items succeeds                                0.01s  
  ✓ claim latency is non negative                                        0.01s  
  ✓ claim from each valid status succeeds                                0.02s  
  ✓ claim rejects rider already at concurrent order cap                  0.01s  
  ✓ claim allows rider to take order after delivery                      0.02s  
  ✓ claim cap of zero allows unlimited batching                          0.02s  
  ✓ claim preserves existing rider id returns false                      0.02s  
  ✓ claim unsets null rider id in where clause                           0.01s  
  ✓ claim transitions from confirmed creates activity log with correct…  0.01s  
  ✓ claim transitions from retrying creates activity log                 0.01s  

   PASS  Tests\Unit\OrderPolicyTest
  ✓ customer can view own order                                          0.03s  
  ✓ customer cannot view others order                                    0.01s  
  ✓ customer can confirm delivery of own order                           0.01s  
  ✓ customer cannot confirm delivery of others order                     0.01s  
  ✓ customer can review own order                                        0.01s  
  ✓ customer cannot review others order                                  0.01s  
  ✓ customer can cancel own order                                        0.01s  
  ✓ customer cannot cancel others order                                  0.01s  
  ✓ assigned rider can view the order                                    0.02s  
  ✓ unassigned rider cannot view the order                               0.01s  
  ✓ rider cannot confirm delivery                                        0.01s  

   PASS  Tests\Unit\OrderStateMachineTest
  ✓ pending to confirmed                                                 0.02s  
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
  ✓ activity log contains correct data with actor and metadata           0.02s  
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
  ✓ submit review creates review record                                  0.01s  
  ✓ submit review updates rider average rating                           0.03s  
  ✓ submit review throws on nonexistent order                            0.01s  

   PASS  Tests\Unit\RiderStatsRecorderTest
  ✓ first review sets average rating                                     0.02s  
  ✓ second review computes weighted average                              0.01s  
  ✓ multiple reviews compute correct average                             0.01s  
  ✓ review count matches database                                        0.01s  
  ✓ rider must exist to record                                           0.01s  
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
  ✓ mark items bought decrements stock for multiple items                0.01s  
  ✓ mark items bought releases reservation and decrements stock          0.01s  
  ✓ partial batch can be continued in a later call                       0.02s  
  ✓ mark items bought ignores unknown item ids                           0.01s  
  ✓ mark items bought throws when insufficient stock                     0.01s  
  ✓ mark items bought does not decrement stock on failure                0.01s  
  ✓ mark items bought throws when product not available                  0.01s  
  ✓ mark items bought is idempotent                                      0.01s  
  ✓ mark items bought creates activity log                               0.02s  
  ✓ order cancellation releases reserved quantity                        0.01s  
  ✓ order cancellation does not affect stock quantity                    0.01s  
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
  ✓ developer requires explicit store id                                 0.03s  
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
  ⨯ entity audit endpoint hides cross store entities                     0.02s  
  ⨯ rider audits are scoped by store                                     0.01s  

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
  ✓ registration sends the verification email with an spa link           0.01s  
  ✓ verify email marks the user verified                                 0.01s  
  ✓ verify email rejects a wrong hash                                    0.01s  

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response                        0.01s  

   FAIL  Tests\Feature\HistoryCascadeGuardsTest
  ✓ category with products cannot be deleted                             0.02s  
  ✓ empty category can be deleted                                        0.01s  
  ✓ store with delivered order history cannot be deleted                 0.01s  
  ⨯ store without history can be deleted                                 0.01s  
  ✓ rider with reviews cannot be deleted                                 0.01s  
  ✓ product stock rows are not orphaned by category delete guard         0.01s  

   PASS  Tests\Feature\ManualDispatchTest
  ✓ manager can list pending dispatch orders for their store             0.02s  
  ✓ manager can manually dispatch order to specific rider                0.02s  
  ✓ operations assign rejects order from another store                   0.02s  
  ✓ operations suggestion hides other stores orders                      0.01s  
  ✓ dispatch rejects rider from another store                            0.01s  
  ✓ manager can reassign already claimed order                           0.03s  
  ✓ reassign rejects order from different store                          0.02s  
  ✓ developer requires explicit store id                                 0.01s  

   PASS  Tests\Feature\MigrationRollbackTest
  ✓ nullable store id migration can roll back                            0.04s  

   PASS  Tests\Feature\OrderPlacementTest
  ✓ customer can place an order                                          0.03s  
  ✓ order with no available rider enters retrying and keeps cart         0.02s  
  ✓ order defaults to cash on delivery                                   0.02s  
  ✓ placing an order clears the server cart                              0.02s  
  ✓ failed placement leaves server cart intact                           0.01s  
  ✓ order requires delivery coordinates                                  0.02s  
  ✓ customer can view own order                                          0.01s  
  ✓ customer cannot view others order                                    0.01s  
  ✓ customer can cancel own order                                        0.01s  
  ✓ customer cannot cancel others order                                  0.01s  
  ✓ customer cannot cancel out for delivery order                        0.01s  
  ✓ customer can confirm own delivery                                    0.01s  
  ✓ customer cannot confirm others order                                 0.01s  

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

   PASS  Tests\Feature\PromotionRedemptionTest
  ✓ validate rejects fully redeemed codes                                0.01s  
  ✓ validate rejects expired codes                                       0.12s  
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
  ✓ cannot view other customers order rider location                     0.01s  
  ✓ returns most recent location when multiple exist                     0.01s  
  ✓ rider can update location                                            0.02s  
  ✓ rider location update sets recorded at                               0.01s  
  ✓ rider location update overwrites previous                            0.01s  
  ✓ non rider cannot update location                                     0.01s  
  ✓ location update requires valid coordinates                           0.01s  

   PASS  Tests\Feature\SpecialsEndpointTest
  ✓ index lists only active specials within their window                 0.02s  
  ✓ products carry availability and effective price                      0.01s  
  ✓ inactive products are hidden from specials                           0.01s  

   PASS  Tests\Feature\StaffManagementTest
  ✓ owner can hire store staff                                           0.02s  
  ✓ owner can fire store staff                                           0.01s  
  ✓ store manager cannot hire staff                                      0.02s  

   PASS  Tests\Feature\TrackingEndpointTest
  ✓ view endpoint captures behavioral signal                             0.01s  
  ✓ search endpoint captures explicit intent                             0.01s  
  ✓ contact endpoint captures strong purchase intent                     0.01s  
  ✓ all tracking endpoints use rate limiting                             0.01s  
  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\AdminProductDeletionTest > product without history…    
  Failed asserting that a row in the table [products] does not match the attributes {
    "id": 1
}.

Found similar results: [
    {
        "id": 1
    }
].

  at tests/Feature/AdminProductDeletionTest.php:86
     82▕         $this->actingAs($this->developer)
     83▕             ->deleteJson("/api/admin/products/{$product->id}")
     84▕             ->assertStatus(200);
     85▕ 
  ➜  86▕         $this->assertDatabaseMissing('products', ['id' => $product->id]);
     87▕     }
     88▕ }
     89▕

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\AuditLogScopingTest > store manager sees only their…   
  Expected response status code [200] but received 403.
Failed asserting that 403 is identical to 200.

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
   FAILED  Tests\Feature\AuditLogScopingTest > entity audit endpoint hides c…   
  Expected response status code [200] but received 403.
Failed asserting that 403 is identical to 200.

  at tests/Feature/AuditLogScopingTest.php:115
    111▕ 
    112▕         // Own store: visible.
    113▕         $this->actingAs($this->managerA)
    114▕             ->getJson("/api/operations/audit-logs/order/{$orderA->id}")
  ➜ 115▕             ->assertStatus(200)
    116▕             ->assertJsonCount(1, 'audit_logs');
    117▕ 
    118▕         // Other store's order id: empty, not leaked.
    119▕         $this->actingAs($this->managerA)

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\AuditLogScopingTest > rider audits are scoped by st…   
  Expected response status code [200] but received 403.
Failed asserting that 403 is identical to 200.

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

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\HistoryCascadeGuardsTest > store without history ca…   
  Failed asserting that a row in the table [stores] does not match the attributes {
    "id": 1
}.

Found similar results: [
    {
        "id": 1
    }
].

  at tests/Feature/HistoryCascadeGuardsTest.php:103
     99▕         $this->actingAs($this->developer)
    100▕             ->deleteJson("/api/admin/stores/{$this->store->id}")
    101▕             ->assertStatus(200);
    102▕ 
  ➜ 103▕         $this->assertDatabaseMissing('stores', ['id' => $this->store->id]);
    104▕     }
    105▕ 
    106▕     public function test_rider_with_reviews_cannot_be_deleted(): void
    107▕     {


  Tests:    5 failed, 350 passed (829 assertions)
  Duration: 5.60s

```
### bootstrap/cache
```
total 40
drwxr-xr-x 2 runner runner  4096 Sep  5 05:25 .
drwxr-xr-x 3 runner runner  4096 Sep  5 05:24 ..
-rw-r--r-- 1 runner runner    14 Sep  5 05:24 .gitignore
-rwxr-xr-x 1 runner runner   960 Sep  5 05:25 packages.php
-rwxr-xr-x 1 runner runner 21492 Sep  5 05:25 services.php
```
