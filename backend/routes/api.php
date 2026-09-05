<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\CareerController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CommunityPostController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\DispatchController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\FulfillmentController;
use App\Http\Controllers\Api\OperationsController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductCarouselController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\RiderController;
use App\Http\Controllers\Api\RoutingController;
use App\Http\Controllers\Api\SpecialController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\StoreDispatchController;
use App\Http\Controllers\Api\StoreOrderController;
use App\Http\Controllers\Api\TrackingController;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

// Auth — throttle to prevent brute-force & spam
Route::get('/sanctum/csrf-cookie', [CsrfCookieController::class, 'show'])->middleware('throttle:60,1');
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/register/rider', [AuthController::class, 'registerRider'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
Route::get('/auth/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware('signed')
    ->name('verification.verify');
Route::post('/auth/email/verification-notification', [AuthController::class, 'sendEmailVerificationNotification'])->middleware('throttle:5,1');

    Route::middleware(['auth:sanctum', 'active.user'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('throttle:30,1');
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh'])->middleware('throttle:30,1');
    Route::post('/auth/device-token', [AuthController::class, 'deviceToken'])->middleware('throttle:30,1');
    Route::delete('/auth/device-token', [AuthController::class, 'removeDeviceToken'])->middleware('throttle:30,1');

    // Profile
    Route::put('/profile', [ProfileController::class, 'update'])->middleware('throttle:20,1');

    // Customer orders
    Route::get('/orders', [OrderController::class, 'index'])->middleware('throttle:30,1');
    Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:20,1');
    Route::get('/orders/{id}', [OrderController::class, 'show'])->middleware('throttle:30,1');
    Route::get('/orders/{id}/rider-location', [OrderController::class, 'riderLocation'])->middleware('throttle:30,1');
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel'])->middleware('throttle:20,1');
    Route::post('/orders/{id}/confirm', [OrderController::class, 'confirmDelivery'])->middleware('throttle:20,1');
    Route::post('/orders/{id}/review', [OrderController::class, 'review'])->middleware('throttle:20,1');

    // Promotions
    Route::post('/promotions/validate', [PromotionController::class, 'validate'])->middleware('throttle:30,1');
    Route::post('/promotions/apply', [PromotionController::class, 'apply'])->middleware('throttle:20,1');

    // Cart
    Route::get('/cart', [CartController::class, 'show'])->middleware('throttle:30,1');
    Route::post('/cart/sync', [CartController::class, 'sync'])->middleware('throttle:30,1');

    // Favorites
    Route::get('/favorites', [FavoriteController::class, 'index'])->middleware('throttle:30,1');
    Route::post('/favorites', [FavoriteController::class, 'store'])->middleware('throttle:30,1');
    Route::delete('/favorites/{product}', [FavoriteController::class, 'destroy'])->middleware('throttle:30,1');
    Route::get('/favorites/{product}/check', [FavoriteController::class, 'check'])->middleware('throttle:30,1');

    // Rider
    Route::prefix('rider')->middleware('role:rider')->group(function () {
        Route::get('/profile', [RiderController::class, 'profile'])->middleware('throttle:30,1');
        Route::get('/available-orders', [RiderController::class, 'availableOrders'])->middleware('throttle:30,1');
        Route::post('/claim/{order}', [RiderController::class, 'claim'])->middleware('throttle:20,1');
        Route::get('/active-deliveries', [RiderController::class, 'activeDeliveries'])->middleware('throttle:30,1');
        Route::post('/items-bought/{order}', [RiderController::class, 'itemsBought'])->middleware('throttle:20,1');
        Route::post('/out-for-delivery/{order}', [RiderController::class, 'outForDelivery'])->middleware('throttle:20,1');
        Route::post('/delivered/{order}', [RiderController::class, 'delivered'])->middleware('throttle:20,1');
        Route::post('/toggle-availability', [RiderController::class, 'toggleAvailability'])->middleware('throttle:20,1');
        Route::get('/stats', [RiderController::class, 'stats'])->middleware('throttle:30,1');
        Route::get('/history', [RiderController::class, 'history'])->middleware('throttle:30,1');
        Route::post('/location', [RiderController::class, 'updateLocation'])->middleware('throttle:60,1');
    });

    // Store Management (Store Manager / Logistics Officer / Store Owner)
    Route::middleware('role:store_manager,logistics_officer,store_owner,developer')->group(function () {
        Route::get('/store/orders', [StoreOrderController::class, 'orders'])->middleware('throttle:30,1');
        Route::patch('/store/orders/{id}/status', [StoreOrderController::class, 'updateStatus'])->middleware('throttle:20,1');
        Route::get('/store/inventory', [StoreOrderController::class, 'inventory'])->middleware('throttle:30,1');
        Route::patch('/store/inventory/{product}', [StoreOrderController::class, 'updateInventory'])->middleware('throttle:20,1');
        Route::get('/store/dispatch/pending', [StoreDispatchController::class, 'pending'])->middleware('throttle:30,1');
        Route::post('/store/orders/{id}/dispatch', [StoreDispatchController::class, 'dispatch'])->middleware('throttle:20,1');
        Route::post('/store/orders/{id}/reassign', [StoreDispatchController::class, 'reassign'])->middleware('throttle:20,1');
    });

    // Staff management (Store Owner / Developer only)
    Route::middleware('role:store_owner,developer')->group(function () {
        Route::post('/store/staff', [StaffController::class, 'store'])->middleware('throttle:10,1');
        Route::delete('/store/staff/{id}', [StaffController::class, 'destroy'])->middleware('throttle:10,1');
    });

    // Admin (developer role)
    Route::prefix('admin')->middleware('role:developer')->group(function () {
        Route::apiResource('products', Admin\ProductController::class)->middleware('throttle:30,1');
        Route::apiResource('categories', Admin\CategoryController::class)->middleware('throttle:30,1');
        Route::apiResource('specials', Admin\SpecialController::class)->middleware('throttle:30,1');
        Route::apiResource('recipes', Admin\RecipeController::class)->middleware('throttle:30,1');
        Route::apiResource('community-posts', Admin\CommunityPostController::class)->middleware('throttle:30,1');
        Route::apiResource('careers', Admin\CareerController::class)->middleware('throttle:30,1');
        Route::apiResource('users', Admin\UserController::class)->only(['index', 'update', 'destroy'])->middleware('throttle:30,1');
        Route::apiResource('riders', Admin\RiderController::class)->only(['index', 'update'])->middleware('throttle:30,1');
        Route::apiResource('stores', Admin\StoreController::class)->middleware('throttle:30,1');
        Route::get('messages', [Admin\MessageController::class, 'index'])->middleware('throttle:30,1');
        Route::get('messages/{id}', [Admin\MessageController::class, 'show'])->middleware('throttle:30,1');
        Route::post('messages/{id}/reply', [Admin\MessageController::class, 'reply'])->middleware('throttle:20,1');
        Route::get('health', [Admin\HealthController::class, 'index'])->middleware('throttle:30,1');
    });

    // Banner management (developer, store_owner, store_manager)
    Route::prefix('admin')->middleware('role:developer,store_owner,store_manager')->group(function () {
        Route::get('banners', [BannerController::class, 'adminIndex'])->middleware('throttle:30,1');
        Route::apiResource('banners', BannerController::class)->only(['store', 'show', 'update', 'destroy'])->middleware('throttle:30,1');
    });

    // User tracking events (authenticated customers)
    Route::post('/tracking/events', [TrackingController::class, 'storeEvent'])->middleware('throttle:100,1');
    Route::post('/tracking/events/batch', [TrackingController::class, 'storeBatch'])->middleware('throttle:20,1');

    // Recommendations
    Route::get('/recommendations', [RecommendationController::class, 'index'])->middleware('throttle:30,1');

    // Operations dashboard (store_owner, store_manager, logistics_officer, developer)
    Route::middleware('role:store_owner,store_manager,logistics_officer,developer')->prefix('operations')->group(function () {
        // Operations — core
        Route::get('/metrics', [OperationsController::class, 'metrics'])->middleware('throttle:30,1');
        Route::get('/alerts', [OperationsController::class, 'alerts'])->middleware('throttle:30,1');
        Route::get('/map-layers', [OperationsController::class, 'mapLayers'])->middleware('throttle:30,1');
        Route::get('/events', [OperationsController::class, 'events'])->middleware('throttle:30,1');
        Route::get('/audit-logs', [OperationsController::class, 'auditLogs'])->middleware('throttle:30,1');
        Route::get('/audit-logs/{entityType}/{entityId}', [OperationsController::class, 'auditLogsForEntity'])->middleware('throttle:30,1');

        // Dispatch
        Route::get('/dispatch-suggestion/{orderId}', [DispatchController::class, 'suggestion'])->middleware('throttle:30,1');
        Route::post('/assign-rider', [DispatchController::class, 'assignRider'])->middleware('throttle:20,1');

        // Analytics
        Route::get('/analytics/sales', [AnalyticsController::class, 'sales'])->middleware('throttle:30,1');
        Route::get('/analytics/products', [AnalyticsController::class, 'products'])->middleware('throttle:30,1');
        Route::get('/analytics/riders', [AnalyticsController::class, 'riders'])->middleware('throttle:30,1');
    });
});

// Public routes
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/trending', [ProductCarouselController::class, 'trending']);
Route::get('/products/popular', [ProductCarouselController::class, 'popular']);
Route::get('/products/new-arrivals', [ProductCarouselController::class, 'newArrivals']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/specials', [SpecialController::class, 'index']);
Route::get('/stores', [StoreController::class, 'index']);
Route::get('/stores/{slug}', [StoreController::class, 'show']);
Route::get('/recipes', [RecipeController::class, 'index']);
Route::get('/recipes/{slug}', [RecipeController::class, 'show']);
Route::get('/community-posts', [CommunityPostController::class, 'index']);
Route::get('/careers', [CareerController::class, 'index']);
Route::get('/banners', [BannerController::class, 'index']);
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:10,1');

// Fulfillment (public - no auth required for validation)
Route::post('/fulfillment/validate', [FulfillmentController::class, 'validate'])->middleware('throttle:30,1');
Route::get('/fulfillment/nearest-store', [FulfillmentController::class, 'nearestStore'])->middleware('throttle:30,1');

// Routing (public - no auth required)
Route::get('/routing/route', [RoutingController::class, 'route'])->middleware('throttle:30,1');
Route::get('/routing/geometry', [RoutingController::class, 'geometry'])->middleware('throttle:30,1');

// Behavioral tracking endpoints (fire-and-forget, never block)
Route::post('/tracking/view', [TrackingController::class, 'view'])->middleware('throttle:60,1');
Route::post('/tracking/search', [TrackingController::class, 'search'])->middleware('throttle:60,1');
Route::post('/tracking/contact', [TrackingController::class, 'contact'])->middleware('throttle:60,1');
