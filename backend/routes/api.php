<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CareerController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CommunityPostController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\RiderController;
use App\Http\Controllers\Api\SpecialController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\StoreDispatchController;
use App\Http\Controllers\Api\StoreOrderController;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

// Auth
Route::get('/sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/register/rider', [AuthController::class, 'registerRider']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    // Profile
    Route::put('/profile', [ProfileController::class, 'update']);

    // Customer orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{id}/confirm', [OrderController::class, 'confirmDelivery']);
    Route::post('/orders/{id}/review', [OrderController::class, 'review']);

    // Cart
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/sync', [CartController::class, 'sync']);

    // Rider
    Route::prefix('rider')->group(function () {
        Route::get('/available-orders', [RiderController::class, 'availableOrders']);
        Route::post('/claim/{order}', [RiderController::class, 'claim']);
        Route::get('/active-deliveries', [RiderController::class, 'activeDeliveries']);
        Route::post('/items-bought/{order}', [RiderController::class, 'itemsBought']);
        Route::post('/out-for-delivery/{order}', [RiderController::class, 'outForDelivery']);
        Route::post('/delivered/{order}', [RiderController::class, 'delivered']);
        Route::post('/toggle-availability', [RiderController::class, 'toggleAvailability']);
        Route::get('/stats', [RiderController::class, 'stats']);
        Route::get('/history', [RiderController::class, 'history']);
    });

    // Store Management (Store Manager / Logistics Officer / Store Owner)
    Route::middleware('role:store_manager,logistics_officer,store_owner,developer')->group(function () {
        Route::get('/store/orders', [StoreOrderController::class, 'orders']);
        Route::patch('/store/orders/{id}/status', [StoreOrderController::class, 'updateStatus']);
        Route::get('/store/inventory', [StoreOrderController::class, 'inventory']);
        Route::patch('/store/inventory/{product}', [StoreOrderController::class, 'updateInventory']);
        Route::get('/store/dispatch/pending', [StoreDispatchController::class, 'pending']);
        Route::post('/store/orders/{id}/dispatch', [StoreDispatchController::class, 'dispatch']);
        Route::post('/store/orders/{id}/reassign', [StoreDispatchController::class, 'reassign']);
    });

    // Staff management (Store Owner / Developer only)
    Route::middleware('role:store_owner,developer')->group(function () {
        Route::post('/store/staff', [StaffController::class, 'store']);
        Route::delete('/store/staff/{id}', [StaffController::class, 'destroy']);
    });

    // Admin (developer role)
    Route::prefix('admin')->middleware('role:developer')->group(function () {
        Route::apiResource('products', Admin\ProductController::class);
        Route::apiResource('categories', Admin\CategoryController::class);
        Route::apiResource('specials', Admin\SpecialController::class);
        Route::apiResource('recipes', Admin\RecipeController::class);
        Route::apiResource('community-posts', Admin\CommunityPostController::class);
        Route::apiResource('careers', Admin\CareerController::class);
        Route::apiResource('users', Admin\UserController::class)->only(['index', 'update', 'destroy']);
        Route::apiResource('riders', Admin\RiderController::class)->only(['index', 'update']);
        Route::apiResource('stores', Admin\StoreController::class);
        Route::get('messages', [Admin\MessageController::class, 'index']);
        Route::get('messages/{id}', [Admin\MessageController::class, 'show']);
        Route::post('messages/{id}/reply', [Admin\MessageController::class, 'reply']);
        Route::get('health', [Admin\HealthController::class, 'index']);
    });
});

// Public routes
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/specials', [SpecialController::class, 'index']);
Route::get('/stores', [StoreController::class, 'index']);
Route::get('/stores/{slug}', [StoreController::class, 'show']);
Route::get('/recipes', [RecipeController::class, 'index']);
Route::get('/recipes/{slug}', [RecipeController::class, 'show']);
Route::get('/community-posts', [CommunityPostController::class, 'index']);
Route::get('/careers', [CareerController::class, 'index']);
Route::post('/contact', [ContactController::class, 'store']);
