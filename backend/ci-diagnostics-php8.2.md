## Backend CI diagnostics (PHP 8.2)

### php -v
```
PHP 8.2.34 (cli) (built: Sep 23 2026 11:23:54) (NTS)
Copyright (c) The PHP Group
Zend Engine v4.2.34, Copyright (c) Zend Technologies
    with Zend OPcache v8.2.34, Copyright (c), by Zend Technologies
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
  ✓ customer can cancel own order                                        0.01s  
  ✓ customer cannot cancel others order                                  0.01s  
  ✓ customer cannot cancel out for delivery order                        0.01s  
  ✓ customer can confirm own delivery                                    0.01s  
  ✓ customer cannot confirm others order                                 0.01s  

   PASS  Tests\Feature\PickupOrderTest
  ✓ customer can place a pickup order without delivery details           0.03s  
  ✓ pickup order does not notify riders and keeps the cart clearing      0.02s  
  ✓ pickup requires a store                                              0.01s  
  ✓ pickup from a store that cannot fulfil the cart is rejected          0.01s  
  ✓ store moves a pickup order through ready and the customer confirms…  0.03s  
  ✓ ready is rejected for delivery orders and out for delivery for pick… 0.01s  
  ✓ pickup order cannot be manually dispatched to a rider                0.02s  
  ✓ pickup orders do not appear in the store dispatch queue              0.03s  
  ✓ pickup with stray delivery fields stores nulls                       0.02s  
  ✓ pickup order money cents mirrors are exact                           0.02s  
  ✓ pickup orders never appear in rider available orders                 0.02s  
  ✓ rider cannot claim a pickup order                                    0.01s  
  ✓ customer can cancel a ready pickup order before collecting           0.01s  

   PASS  Tests\Feature\ProductCarouselTest
  ✓ trending endpoint is not shadowed by slug route                      0.02s  
  ✓ popular returns delivered order products                             0.01s  
  ✓ new arrivals returns recent products without error                   0.01s  
  ✓ trending returns empty array when no orders                          0.01s  

   PASS  Tests\Feature\ProductIndexTest
  ✓ index respects per page param                                        0.03s  
  ✓ index filters by multiple category slugs                             0.02s  
  ✓ index defaults to twenty per page                                    0.02s  
  ✓ index caps per page at one hundred                                   0.07s  
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
  ✓ guest can browse categories and products                             0.02s  
  ✓ guest can read recipes and unpublished are hidden                    0.01s  
  ✓ guest can read careers and community posts                           0.01s  
  ✓ guest can submit a contact message                                   0.01s  
  ✓ contact validation rejects garbage                                   0.01s  

   PASS  Tests\Feature\PushNotificationTest
  ✓ cancelled transition pushes notification                             0.02s  
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
  ✓ mark items bought returns 422 and keeps stock when order cancelled   0.03s  
  ✓ out for delivery returns 422 and order stays cancelled               0.02s  
  ✓ rider cannot advance out for delivery with unbought items            0.01s  

   FAIL  Tests\Feature\SalesAndBannersTest
  ⨯ logistics officer is locked out of sales
  ⨯ store operator sees only own store sales
  ⨯ owner cannot touch another store sale
  ⨯ owner create forces own store
  ⨯ developer can create chain wide sale
  ⨯ product sync attaches and detaches
  ⨯ product sync cannot touch foreign store sale
  ⨯ public special show returns sale with products
  ⨯ public special show 404 for unknown slug
  ⨯ public special show includes ended sale with flag
  ⨯ sale banner gets sale cta on every slide
  ⨯ standalone banner stays standalone
  ⨯ public banners expose special summary for sale banners
  ⨯ owner cannot link another stores sale

   PASS  Tests\Feature\SpecialsEndpointTest
  ✓ index lists only active specials within their window                 0.02s  
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
   FAILED  Tests\Feature\SalesAndBannersTest > logistics off…  QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, K6x6kHftXW, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > store operato…  QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, GBgBCNbLdp, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > owner cannot…   QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, 7hK5XxXsv8, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > owner create…   QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, EBn8IQkCUv, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > developer can…  QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, i6B9p6kMqe, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > product sync…   QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, OXvtCknDEa, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > product sync…   QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, OdoM63Y7Xi, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > public specia…  QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, PqKT6gMAbc, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > public specia…  QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, yCSWi6KkhD, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > public specia…  QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, ZrjTcl2PcW, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > sale banner g…  QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, eh1qDgrR5s, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > standalone ba…  QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, TCsC8tiqUM, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > public banner…  QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, L0A9YBLkjG, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\SalesAndBannersTest > owner cannot…   QueryException   
  SQLSTATE[HY000]: General error: 1 table users has no column named store_id (Connection: sqlite, SQL: insert into "users" ("name", "email", "email_verified_at", "password", "remember_token", "is_active", "role", "store_id", "updated_at", "created_at") values (Owner A, owner-a@example.com, 2026-09-24 21:41:44, $2y$04$XAuoMO2BZ7i35hBOtDXpEuL4Q96LdOmXOWpw1kDbqkf.6rWZ/IUFS, d84EThaLVp, 1, store_owner, 1, 2026-09-24 21:41:44, 2026-09-24 21:41:44))

  at vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
    821▕                     $this->getName(), $query, $this->prepareBindings($bindings), $e
    822▕                 );
    823▕             }
    824▕ 
  ➜ 825▕             throw new QueryException(
    826▕                 $this->getName(), $query, $this->prepareBindings($bindings), $e
    827▕             );
    828▕         }
    829▕     }

      [2m+18 vendor frames [22m
  19  tests/Feature/SalesAndBannersTest.php:45


  Tests:    14 failed, 439 passed (1154 assertions)
  Duration: 9.62s

```
### bootstrap/cache
```
total 40
drwxr-xr-x 2 runner runner  4096 Sep 24 21:41 .
drwxr-xr-x 3 runner runner  4096 Sep 24 21:41 ..
-rw-r--r-- 1 runner runner    14 Sep 24 21:41 .gitignore
-rwxr-xr-x 1 runner runner   960 Sep 24 21:41 packages.php
-rwxr-xr-x 1 runner runner 21492 Sep 24 21:41 services.php
```
