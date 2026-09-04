<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use App\Services\StoreContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(
        private AnalyticsService $analyticsService,
        private StoreContext $storeContext,
    ) {}

    public function sales(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));
        $period = $request->input('period', '30d');

        return response()->json(
            $this->analyticsService->getSalesData($store->id, $period)
        );
    }

    public function products(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));
        $limit = min((int) $request->input('limit', 10), 50);

        return response()->json(
            $this->analyticsService->getProductsData($store->id, $limit)
        );
    }

    public function riders(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));
        $period = $request->input('period', '30d');

        return response()->json(
            $this->analyticsService->getRidersData($store->id, $period)
        );
    }
}
