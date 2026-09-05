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

The following exception occurred during the last request:

PDOException: SQLSTATE[HY000]: General error: 1 table product_favorites has no column named updated_at in /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php:565
Stack trace:
#0 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(565): PDO->prepare()
#1 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(812): Illuminate\Database\Connection->{closure:Illuminate\Database\Connection::statement():560}()
#2 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(779): Illuminate\Database\Connection->runQueryCallback()
#3 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(560): Illuminate\Database\Connection->run()
#4 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(524): Illuminate\Database\Connection->statement()
#5 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Query/Processors/Processor.php(32): Illuminate\Database\Connection->insert()
#6 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(3766): Illuminate\Database\Query\Processors\Processor->processInsertGetId()
#7 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2120): Illuminate\Database\Query\Builder->insertGetId()
#8 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1359): Illuminate\Database\Eloquent\Builder->__call()
#9 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1324): Illuminate\Database\Eloquent\Model->insertAndSetId()
#10 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1163): Illuminate\Database\Eloquent\Model->performInsert()
#11 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(1128): Illuminate\Database\Eloquent\Model->save()
#12 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Support/helpers.php(399): Illuminate\Database\Eloquent\Builder->{closure:Illuminate\Database\Eloquent\Builder::create():1127}()
#13 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(1127): tap()
#14 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/ForwardsCalls.php(23): Illuminate\Database\Eloquent\Builder->create()
#15 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(2372): Illuminate\Database\Eloquent\Model->forwardCallTo()
#16 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(2384): Illuminate\Database\Eloquent\Model->__call()
#17 /home/runner/work/checkstar/checkstar/backend/app/Http/Controllers/Api/FavoriteController.php(38): Illuminate\Database\Eloquent\Model::__callStatic()
#18 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/ControllerDispatcher.php(47): App\Http\Controllers\Api\FavoriteController->store()
#19 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Route.php(266): Illuminate\Routing\ControllerDispatcher->dispatch()
#20 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Route.php(212): Illuminate\Routing\Route->runController()
#21 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(808): Illuminate\Routing\Route->run()
#22 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\Routing\Router->{closure:Illuminate\Routing\Router::runRouteWithinStack():807}()
#23 /home/runner/work/checkstar/checkstar/backend/app/Http/Middleware/EnsureUserIsActive.php(34): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#24 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): App\Http\Middleware\EnsureUserIsActive->handle()
#25 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/SubstituteBindings.php(51): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#26 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Routing\Middleware\SubstituteBindings->handle()
#27 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php(161): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#28 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php(92): Illuminate\Routing\Middleware\ThrottleRequests->handleRequest()
#29 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Routing\Middleware\ThrottleRequests->handle()
#30 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Auth/Middleware/Authenticate.php(64): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#31 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Auth\Middleware\Authenticate->handle()
#32 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/sanctum/src/Http/Middleware/EnsureFrontendRequestsAreStateful.php(26): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#33 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful->{closure:Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::handle():25}()
#34 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#35 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/sanctum/src/Http/Middleware/EnsureFrontendRequestsAreStateful.php(25): Illuminate\Pipeline\Pipeline->then()
#36 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful->handle()
#37 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#38 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(807): Illuminate\Pipeline\Pipeline->then()
#39 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(786): Illuminate\Routing\Router->runRouteWithinStack()
#40 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(750): Illuminate\Routing\Router->runRoute()
#41 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(739): Illuminate\Routing\Router->dispatchToRoute()
#42 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(201): Illuminate\Routing\Router->dispatch()
#43 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\Foundation\Http\Kernel->{closure:Illuminate\Foundation\Http\Kernel::dispatchToRouter():198}()
#44 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#45 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/ConvertEmptyStringsToNull.php(31): Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
#46 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull->handle()
#47 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#48 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TrimStrings.php(51): Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
#49 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\TrimStrings->handle()
#50 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/ValidatePostSize.php(27): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#51 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\ValidatePostSize->handle()
#52 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/PreventRequestsDuringMaintenance.php(110): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#53 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance->handle()
#54 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/HandleCors.php(62): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#55 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\HandleCors->handle()
#56 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/TrustProxies.php(58): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#57 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\TrustProxies->handle()
#58 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/InvokeDeferredCallbacks.php(22): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#59 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\InvokeDeferredCallbacks->handle()
#60 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#61 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(176): Illuminate\Pipeline\Pipeline->then()
#62 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(145): Illuminate\Foundation\Http\Kernel->sendRequestThroughRouter()
#63 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(607): Illuminate\Foundation\Http\Kernel->handle()
#64 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(573): Illuminate\Foundation\Testing\TestCase->call()
#65 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(411): Illuminate\Foundation\Testing\TestCase->json()
#66 /home/runner/work/checkstar/checkstar/backend/tests/Feature/FavoritesApiTest.php(42): Illuminate\Foundation\Testing\TestCase->postJson()
#67 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(1667): Tests\Feature\FavoritesApiTest->test_customer_can_favorite_and_list()
#68 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(519): PHPUnit\Framework\TestCase->runTest()
#69 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestRunner/TestRunner.php(87): PHPUnit\Framework\TestCase->runBare()
#70 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(365): PHPUnit\Framework\TestRunner->run()
#71 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestCase->run()
#72 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestSuite->run()
#73 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestSuite->run()
#74 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/TextUI/TestRunner.php(64): PHPUnit\Framework\TestSuite->run()
#75 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/TextUI/Application.php(211): PHPUnit\TextUI\TestRunner->run()
#76 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/phpunit(104): PHPUnit\TextUI\Application->run()
#77 {main}

Next Illuminate\Database\QueryException: SQLSTATE[HY000]: General error: 1 table product_favorites has no column named updated_at (Connection: sqlite, SQL: insert into "product_favorites" ("customer_id", "product_id", "updated_at", "created_at") values (1, 1, 2026-09-05 05:53:34, 2026-09-05 05:53:34)) in /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
Stack trace:
#0 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(779): Illuminate\Database\Connection->runQueryCallback()
#1 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(560): Illuminate\Database\Connection->run()
#2 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(524): Illuminate\Database\Connection->statement()
#3 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Query/Processors/Processor.php(32): Illuminate\Database\Connection->insert()
#4 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(3766): Illuminate\Database\Query\Processors\Processor->processInsertGetId()
#5 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2120): Illuminate\Database\Query\Builder->insertGetId()
#6 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1359): Illuminate\Database\Eloquent\Builder->__call()
#7 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1324): Illuminate\Database\Eloquent\Model->insertAndSetId()
#8 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1163): Illuminate\Database\Eloquent\Model->performInsert()
#9 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(1128): Illuminate\Database\Eloquent\Model->save()
#10 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Support/helpers.php(399): Illuminate\Database\Eloquent\Builder->{closure:Illuminate\Database\Eloquent\Builder::create():1127}()
#11 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(1127): tap()
#12 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/ForwardsCalls.php(23): Illuminate\Database\Eloquent\Builder->create()
#13 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(2372): Illuminate\Database\Eloquent\Model->forwardCallTo()
#14 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(2384): Illuminate\Database\Eloquent\Model->__call()
#15 /home/runner/work/checkstar/checkstar/backend/app/Http/Controllers/Api/FavoriteController.php(38): Illuminate\Database\Eloquent\Model::__callStatic()
#16 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/ControllerDispatcher.php(47): App\Http\Controllers\Api\FavoriteController->store()
#17 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Route.php(266): Illuminate\Routing\ControllerDispatcher->dispatch()
#18 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Route.php(212): Illuminate\Routing\Route->runController()
#19 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(808): Illuminate\Routing\Route->run()
#20 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\Routing\Router->{closure:Illuminate\Routing\Router::runRouteWithinStack():807}()
#21 /home/runner/work/checkstar/checkstar/backend/app/Http/Middleware/EnsureUserIsActive.php(34): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#22 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): App\Http\Middleware\EnsureUserIsActive->handle()
#23 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/SubstituteBindings.php(51): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#24 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Routing\Middleware\SubstituteBindings->handle()
#25 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php(161): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#26 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php(92): Illuminate\Routing\Middleware\ThrottleRequests->handleRequest()
#27 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Routing\Middleware\ThrottleRequests->handle()
#28 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Auth/Middleware/Authenticate.php(64): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#29 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Auth\Middleware\Authenticate->handle()
#30 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/sanctum/src/Http/Middleware/EnsureFrontendRequestsAreStateful.php(26): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#31 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful->{closure:Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::handle():25}()
#32 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#33 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/sanctum/src/Http/Middleware/EnsureFrontendRequestsAreStateful.php(25): Illuminate\Pipeline\Pipeline->then()
#34 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful->handle()
#35 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#36 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(807): Illuminate\Pipeline\Pipeline->then()
#37 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(786): Illuminate\Routing\Router->runRouteWithinStack()
#38 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(750): Illuminate\Routing\Router->runRoute()
#39 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(739): Illuminate\Routing\Router->dispatchToRoute()
#40 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(201): Illuminate\Routing\Router->dispatch()
#41 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\Foundation\Http\Kernel->{closure:Illuminate\Foundation\Http\Kernel::dispatchToRouter():198}()
#42 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#43 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/ConvertEmptyStringsToNull.php(31): Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
#44 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull->handle()
#45 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#46 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TrimStrings.php(51): Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
#47 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\TrimStrings->handle()
#48 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/ValidatePostSize.php(27): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#49 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\ValidatePostSize->handle()
#50 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/PreventRequestsDuringMaintenance.php(110): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#51 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance->handle()
#52 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/HandleCors.php(62): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#53 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\HandleCors->handle()
#54 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/TrustProxies.php(58): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#55 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\TrustProxies->handle()
#56 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/InvokeDeferredCallbacks.php(22): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#57 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\InvokeDeferredCallbacks->handle()
#58 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#59 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(176): Illuminate\Pipeline\Pipeline->then()
#60 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(145): Illuminate\Foundation\Http\Kernel->sendRequestThroughRouter()
#61 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(607): Illuminate\Foundation\Http\Kernel->handle()
#62 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(573): Illuminate\Foundation\Testing\TestCase->call()
#63 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(411): Illuminate\Foundation\Testing\TestCase->json()
#64 /home/runner/work/checkstar/checkstar/backend/tests/Feature/FavoritesApiTest.php(42): Illuminate\Foundation\Testing\TestCase->postJson()
#65 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(1667): Tests\Feature\FavoritesApiTest->test_customer_can_favorite_and_list()
#66 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(519): PHPUnit\Framework\TestCase->runTest()
#67 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestRunner/TestRunner.php(87): PHPUnit\Framework\TestCase->runBare()
#68 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(365): PHPUnit\Framework\TestRunner->run()
#69 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestCase->run()
#70 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestSuite->run()
#71 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestSuite->run()
#72 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/TextUI/TestRunner.php(64): PHPUnit\Framework\TestSuite->run()
#73 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/TextUI/Application.php(211): PHPUnit\TextUI\TestRunner->run()
#74 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/phpunit(104): PHPUnit\TextUI\Application->run()
#75 {main}

----------------------------------------------------------------------------------

SQLSTATE[HY000]: General error: 1 table product_favorites has no column named updated_at (Connection: sqlite, SQL: insert into "product_favorites" ("customer_id", "product_id", "updated_at", "created_at") values (1, 1, 2026-09-05 05:53:34, 2026-09-05 05:53:34))

  at tests/Feature/FavoritesApiTest.php:43
     39▕     public function test_customer_can_favorite_and_list(): void
     40▕     {
     41▕         $this->actingAs($this->customer)
     42▕             ->postJson('/api/favorites', ['product_id' => $this->product->id])
  ➜  43▕             ->assertStatus(201);
     44▕ 
     45▕         $response = $this->actingAs($this->customer)->getJson('/api/favorites');
     46▕         $response->assertStatus(200);
     47▕         $this->assertSame(1, count($response->json('data')));

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\FavoritesApiTest > duplicate favorite is 409 not 50…   
  Expected response status code [201] but received 500.
Failed asserting that 500 is identical to 201.

The following exception occurred during the last request:

PDOException: SQLSTATE[HY000]: General error: 1 table product_favorites has no column named updated_at in /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php:565
Stack trace:
#0 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(565): PDO->prepare()
#1 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(812): Illuminate\Database\Connection->{closure:Illuminate\Database\Connection::statement():560}()
#2 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(779): Illuminate\Database\Connection->runQueryCallback()
#3 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(560): Illuminate\Database\Connection->run()
#4 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(524): Illuminate\Database\Connection->statement()
#5 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Query/Processors/Processor.php(32): Illuminate\Database\Connection->insert()
#6 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(3766): Illuminate\Database\Query\Processors\Processor->processInsertGetId()
#7 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2120): Illuminate\Database\Query\Builder->insertGetId()
#8 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1359): Illuminate\Database\Eloquent\Builder->__call()
#9 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1324): Illuminate\Database\Eloquent\Model->insertAndSetId()
#10 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1163): Illuminate\Database\Eloquent\Model->performInsert()
#11 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(1128): Illuminate\Database\Eloquent\Model->save()
#12 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Support/helpers.php(399): Illuminate\Database\Eloquent\Builder->{closure:Illuminate\Database\Eloquent\Builder::create():1127}()
#13 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(1127): tap()
#14 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/ForwardsCalls.php(23): Illuminate\Database\Eloquent\Builder->create()
#15 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(2372): Illuminate\Database\Eloquent\Model->forwardCallTo()
#16 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(2384): Illuminate\Database\Eloquent\Model->__call()
#17 /home/runner/work/checkstar/checkstar/backend/app/Http/Controllers/Api/FavoriteController.php(38): Illuminate\Database\Eloquent\Model::__callStatic()
#18 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/ControllerDispatcher.php(47): App\Http\Controllers\Api\FavoriteController->store()
#19 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Route.php(266): Illuminate\Routing\ControllerDispatcher->dispatch()
#20 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Route.php(212): Illuminate\Routing\Route->runController()
#21 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(808): Illuminate\Routing\Route->run()
#22 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\Routing\Router->{closure:Illuminate\Routing\Router::runRouteWithinStack():807}()
#23 /home/runner/work/checkstar/checkstar/backend/app/Http/Middleware/EnsureUserIsActive.php(34): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#24 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): App\Http\Middleware\EnsureUserIsActive->handle()
#25 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/SubstituteBindings.php(51): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#26 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Routing\Middleware\SubstituteBindings->handle()
#27 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php(161): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#28 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php(92): Illuminate\Routing\Middleware\ThrottleRequests->handleRequest()
#29 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Routing\Middleware\ThrottleRequests->handle()
#30 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Auth/Middleware/Authenticate.php(64): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#31 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Auth\Middleware\Authenticate->handle()
#32 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/sanctum/src/Http/Middleware/EnsureFrontendRequestsAreStateful.php(26): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#33 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful->{closure:Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::handle():25}()
#34 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#35 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/sanctum/src/Http/Middleware/EnsureFrontendRequestsAreStateful.php(25): Illuminate\Pipeline\Pipeline->then()
#36 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful->handle()
#37 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#38 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(807): Illuminate\Pipeline\Pipeline->then()
#39 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(786): Illuminate\Routing\Router->runRouteWithinStack()
#40 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(750): Illuminate\Routing\Router->runRoute()
#41 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(739): Illuminate\Routing\Router->dispatchToRoute()
#42 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(201): Illuminate\Routing\Router->dispatch()
#43 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\Foundation\Http\Kernel->{closure:Illuminate\Foundation\Http\Kernel::dispatchToRouter():198}()
#44 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#45 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/ConvertEmptyStringsToNull.php(31): Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
#46 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull->handle()
#47 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#48 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TrimStrings.php(51): Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
#49 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\TrimStrings->handle()
#50 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/ValidatePostSize.php(27): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#51 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\ValidatePostSize->handle()
#52 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/PreventRequestsDuringMaintenance.php(110): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#53 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance->handle()
#54 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/HandleCors.php(62): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#55 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\HandleCors->handle()
#56 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/TrustProxies.php(58): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#57 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\TrustProxies->handle()
#58 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/InvokeDeferredCallbacks.php(22): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#59 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\InvokeDeferredCallbacks->handle()
#60 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#61 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(176): Illuminate\Pipeline\Pipeline->then()
#62 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(145): Illuminate\Foundation\Http\Kernel->sendRequestThroughRouter()
#63 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(607): Illuminate\Foundation\Http\Kernel->handle()
#64 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(573): Illuminate\Foundation\Testing\TestCase->call()
#65 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(411): Illuminate\Foundation\Testing\TestCase->json()
#66 /home/runner/work/checkstar/checkstar/backend/tests/Feature/FavoritesApiTest.php(54): Illuminate\Foundation\Testing\TestCase->postJson()
#67 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(1667): Tests\Feature\FavoritesApiTest->test_duplicate_favorite_is_409_not_500()
#68 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(519): PHPUnit\Framework\TestCase->runTest()
#69 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestRunner/TestRunner.php(87): PHPUnit\Framework\TestCase->runBare()
#70 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(365): PHPUnit\Framework\TestRunner->run()
#71 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestCase->run()
#72 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestSuite->run()
#73 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestSuite->run()
#74 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/TextUI/TestRunner.php(64): PHPUnit\Framework\TestSuite->run()
#75 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/TextUI/Application.php(211): PHPUnit\TextUI\TestRunner->run()
#76 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/phpunit(104): PHPUnit\TextUI\Application->run()
#77 {main}

Next Illuminate\Database\QueryException: SQLSTATE[HY000]: General error: 1 table product_favorites has no column named updated_at (Connection: sqlite, SQL: insert into "product_favorites" ("customer_id", "product_id", "updated_at", "created_at") values (1, 1, 2026-09-05 05:53:34, 2026-09-05 05:53:34)) in /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php:825
Stack trace:
#0 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(779): Illuminate\Database\Connection->runQueryCallback()
#1 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(560): Illuminate\Database\Connection->run()
#2 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Connection.php(524): Illuminate\Database\Connection->statement()
#3 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Query/Processors/Processor.php(32): Illuminate\Database\Connection->insert()
#4 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php(3766): Illuminate\Database\Query\Processors\Processor->processInsertGetId()
#5 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(2120): Illuminate\Database\Query\Builder->insertGetId()
#6 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1359): Illuminate\Database\Eloquent\Builder->__call()
#7 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1324): Illuminate\Database\Eloquent\Model->insertAndSetId()
#8 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(1163): Illuminate\Database\Eloquent\Model->performInsert()
#9 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(1128): Illuminate\Database\Eloquent\Model->save()
#10 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Support/helpers.php(399): Illuminate\Database\Eloquent\Builder->{closure:Illuminate\Database\Eloquent\Builder::create():1127}()
#11 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php(1127): tap()
#12 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/ForwardsCalls.php(23): Illuminate\Database\Eloquent\Builder->create()
#13 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(2372): Illuminate\Database\Eloquent\Model->forwardCallTo()
#14 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Database/Eloquent/Model.php(2384): Illuminate\Database\Eloquent\Model->__call()
#15 /home/runner/work/checkstar/checkstar/backend/app/Http/Controllers/Api/FavoriteController.php(38): Illuminate\Database\Eloquent\Model::__callStatic()
#16 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/ControllerDispatcher.php(47): App\Http\Controllers\Api\FavoriteController->store()
#17 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Route.php(266): Illuminate\Routing\ControllerDispatcher->dispatch()
#18 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Route.php(212): Illuminate\Routing\Route->runController()
#19 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(808): Illuminate\Routing\Route->run()
#20 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\Routing\Router->{closure:Illuminate\Routing\Router::runRouteWithinStack():807}()
#21 /home/runner/work/checkstar/checkstar/backend/app/Http/Middleware/EnsureUserIsActive.php(34): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#22 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): App\Http\Middleware\EnsureUserIsActive->handle()
#23 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/SubstituteBindings.php(51): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#24 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Routing\Middleware\SubstituteBindings->handle()
#25 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php(161): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#26 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php(92): Illuminate\Routing\Middleware\ThrottleRequests->handleRequest()
#27 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Routing\Middleware\ThrottleRequests->handle()
#28 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Auth/Middleware/Authenticate.php(64): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#29 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Auth\Middleware\Authenticate->handle()
#30 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/sanctum/src/Http/Middleware/EnsureFrontendRequestsAreStateful.php(26): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#31 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful->{closure:Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::handle():25}()
#32 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#33 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/sanctum/src/Http/Middleware/EnsureFrontendRequestsAreStateful.php(25): Illuminate\Pipeline\Pipeline->then()
#34 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful->handle()
#35 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#36 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(807): Illuminate\Pipeline\Pipeline->then()
#37 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(786): Illuminate\Routing\Router->runRouteWithinStack()
#38 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(750): Illuminate\Routing\Router->runRoute()
#39 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Routing/Router.php(739): Illuminate\Routing\Router->dispatchToRoute()
#40 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(201): Illuminate\Routing\Router->dispatch()
#41 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\Foundation\Http\Kernel->{closure:Illuminate\Foundation\Http\Kernel::dispatchToRouter():198}()
#42 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():168}()
#43 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/ConvertEmptyStringsToNull.php(31): Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
#44 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull->handle()
#45 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php(21): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#46 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TrimStrings.php(51): Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
#47 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\TrimStrings->handle()
#48 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/ValidatePostSize.php(27): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#49 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\ValidatePostSize->handle()
#50 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/PreventRequestsDuringMaintenance.php(110): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#51 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance->handle()
#52 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/HandleCors.php(62): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#53 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\HandleCors->handle()
#54 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Http/Middleware/TrustProxies.php(58): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#55 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Http\Middleware\TrustProxies->handle()
#56 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/InvokeDeferredCallbacks.php(22): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#57 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(209): Illuminate\Foundation\Http\Middleware\InvokeDeferredCallbacks->handle()
#58 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():184}:185}()
#59 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(176): Illuminate\Pipeline\Pipeline->then()
#60 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(145): Illuminate\Foundation\Http\Kernel->sendRequestThroughRouter()
#61 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(607): Illuminate\Foundation\Http\Kernel->handle()
#62 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(573): Illuminate\Foundation\Testing\TestCase->call()
#63 /home/runner/work/checkstar/checkstar/backend/vendor/laravel/framework/src/Illuminate/Foundation/Testing/Concerns/MakesHttpRequests.php(411): Illuminate\Foundation\Testing\TestCase->json()
#64 /home/runner/work/checkstar/checkstar/backend/tests/Feature/FavoritesApiTest.php(54): Illuminate\Foundation\Testing\TestCase->postJson()
#65 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(1667): Tests\Feature\FavoritesApiTest->test_duplicate_favorite_is_409_not_500()
#66 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(519): PHPUnit\Framework\TestCase->runTest()
#67 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestRunner/TestRunner.php(87): PHPUnit\Framework\TestCase->runBare()
#68 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestCase.php(365): PHPUnit\Framework\TestRunner->run()
#69 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestCase->run()
#70 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestSuite->run()
#71 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/Framework/TestSuite.php(369): PHPUnit\Framework\TestSuite->run()
#72 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/TextUI/TestRunner.php(64): PHPUnit\Framework\TestSuite->run()
#73 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/src/TextUI/Application.php(211): PHPUnit\TextUI\TestRunner->run()
#74 /home/runner/work/checkstar/checkstar/backend/vendor/phpunit/phpunit/phpunit(104): PHPUnit\TextUI\Application->run()
#75 {main}

----------------------------------------------------------------------------------

SQLSTATE[HY000]: General error: 1 table product_favorites has no column named updated_at (Connection: sqlite, SQL: insert into "product_favorites" ("customer_id", "product_id", "updated_at", "created_at") values (1, 1, 2026-09-05 05:53:34, 2026-09-05 05:53:34))

  at tests/Feature/FavoritesApiTest.php:55
     51▕     public function test_duplicate_favorite_is_409_not_500(): void
     52▕     {
     53▕         $this->actingAs($this->customer)
     54▕             ->postJson('/api/favorites', ['product_id' => $this->product->id])
  ➜  55▕             ->assertStatus(201);
     56▕ 
     57▕         // Second attempt (and any racer that beats the exists() check) must
     58▕         // hit the friendly 409, not a QueryException from the unique index.
     59▕         $this->actingAs($this->customer)

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\FavoritesApiTest > check endpoint r…  QueryException   
  SQLSTATE[HY000]: General error: 1 table product_favorites has no column named updated_at (Connection: sqlite, SQL: insert into "product_favorites" ("customer_id", "product_id", "updated_at", "created_at") values (1, 1, 2026-09-05 05:53:34, 2026-09-05 05:53:34))

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

      [2m+19 vendor frames [22m
  20  tests/Feature/FavoritesApiTest.php:85

  ────────────────────────────────────────────────────────────────────────────  
   FAILED  Tests\Feature\PublicCatalogueTest > guest can read ca…  ValueError   
  "news" is not a valid backing value for enum App\Enums\CommunityPostCategory

  at vendor/laravel/framework/src/Illuminate/Database/Eloquent/Concerns/HasAttributes.php:1253
    1249▕      */
    1250▕     protected function getEnumCaseFromValue($enumClass, $value)
    1251▕     {
    1252▕         return is_subclass_of($enumClass, BackedEnum::class)
  ➜ 1253▕                 ? $enumClass::from($value)
    1254▕                 : constant($enumClass.'::'.$value);
    1255▕     }
    1256▕ 
    1257▕     /**

      [2m+10 vendor frames [22m
  11  tests/Feature/PublicCatalogueTest.php:95


  Tests:    4 failed, 383 passed (919 assertions)
  Duration: 6.20s

```
### bootstrap/cache
```
total 40
drwxr-xr-x 2 runner runner  4096 Sep  5 05:53 .
drwxr-xr-x 3 runner runner  4096 Sep  5 05:53 ..
-rw-r--r-- 1 runner runner    14 Sep  5 05:53 .gitignore
-rwxr-xr-x 1 runner runner   960 Sep  5 05:53 packages.php
-rwxr-xr-x 1 runner runner 21492 Sep  5 05:53 services.php
```
