<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\Rider;
use App\Services\AnalyticsService;
use App\Services\AuditService;
use App\Services\DispatchSuggestionService;
use App\Services\EventFeedService;
use App\Services\StoreContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class OperationsController extends Controller
{
    protected AnalyticsService $analyticsService;
    protected AuditService $auditService;
    protected DispatchSuggestionService $dispatchSuggestionService;
    protected EventFeedService $eventFeedService;
    protected StoreContext $storeContext;

    public function __construct(
        AnalyticsService $analyticsService,
        AuditService $auditService,
        DispatchSuggestionService $dispatchSuggestionService,
        EventFeedService $eventFeedService,
        StoreContext $storeContext
    ) {
        $this->analyticsService = $analyticsService;
        $this->auditService = $auditService;
        $this->dispatchSuggestionService = $dispatchSuggestionService;
        $this->eventFeedService = $eventFeedService;
        $this->storeContext = $storeContext;
    }

    public function metrics(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));

        $activeRiders = Rider::where('store_id', $store->id)
            ->where('is_available', true)
            ->count();

        $totalRiders = Rider::where('store_id', $store->id)->count();

        $ordersThisHour = Order::where('store_id', $store->id)
            ->where('created_at', '>=', Carbon::now()->subHour())
            ->count();

        $pendingOrders = Order::where('store_id', $store->id)
            ->where('status', 'pending')
            ->count();

        $activeDeliveries = Order::where('store_id', $store->id)
            ->whereIn('status', ['confirmed', 'preparing', 'out_for_delivery'])
            ->count();

        $deliveredToday = Order::where('store_id', $store->id)
            ->where('status', 'delivered')
            ->whereDate('created_at', Carbon::today())
            ->count();

        return response()->json([
            'active_riders' => $activeRiders,
            'total_riders' => $totalRiders,
            'orders_this_hour' => $ordersThisHour,
            'pending_orders' => $pendingOrders,
            'active_deliveries' => $activeDeliveries,
            'delivered_today' => $deliveredToday,
        ]);
    }

    public function events(Request $request): JsonResponse
    {
        $cursor = $request->input('cursor');
        $limit = min((int) $request->input('limit', 50), 50);

        $result = $this->eventFeedService->getEvents($cursor, $limit);

        return response()->json([
            'events' => $result->events,
            'next_cursor' => $result->nextCursor,
        ]);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $limit = min((int) $request->input('limit', 50), 200);
        $entityType = $request->input('entity_type');
        $userId = $request->input('user_id');

        $query = AuditLog::with('user');

        if ($entityType) {
            $query->where('entity_type', $entityType);
        }
        if ($userId) {
            $query->where('user_id', $userId);
        }

        $logs = $query->orderByDesc('created_at')->limit($limit)->get();

        return response()->json(['audit_logs' => $logs]);
    }

    public function auditLogsForEntity(string $entityType, int $entityId): JsonResponse
    {
        $logs = $this->auditService->forEntity($entityType, $entityId);

        return response()->json(['audit_logs' => $logs]);
    }

    public function dispatchSuggestion(int $orderId): JsonResponse
    {
        $suggestion = $this->dispatchSuggestionService->getSuggestion($orderId);

        if (!$suggestion) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        return response()->json($suggestion);
    }

    public function assignRider(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|integer|exists:orders,id',
            'rider_id' => 'required|integer|exists:riders,id',
        ]);

        $result = $this->dispatchSuggestionService->assignRider(
            $validated['order_id'],
            $validated['rider_id']
        );

        if (!$result->success) {
            return response()->json(['error' => $result->error], 422);
        }

        $this->auditService->log(
            $request->user()->id,
            'dispatched',
            'order',
            $validated['order_id'],
            ['rider_id' => $validated['rider_id']]
        );

        return response()->json($result);
    }

    public function analyticsSales(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));
        $period = $request->input('period', '30d');

        $data = $this->analyticsService->getSalesData($store->id, $period);

        return response()->json($data);
    }

    public function analyticsProducts(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));
        $limit = min((int) $request->input('limit', 10), 50);

        $data = $this->analyticsService->getProductsData($store->id, $limit);

        return response()->json($data);
    }

    public function analyticsRiders(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));
        $period = $request->input('period', '30d');

        $data = $this->analyticsService->getRidersData($store->id, $period);

        return response()->json($data);
    }
}
