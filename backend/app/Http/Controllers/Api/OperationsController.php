<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\Rider;
use App\Models\RiderLocation;
use App\Services\AuditService;
use App\Services\EventFeedService;
use App\Services\MapLayersService;
use App\Services\StoreContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class OperationsController extends Controller
{
    public function __construct(
        private AuditService $auditService,
        private EventFeedService $eventFeedService,
        private MapLayersService $mapLayersService,
        private StoreContext $storeContext,
    ) {}

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

        // "Pending" = awaiting rider assignment. Orders never linger in the
        // `pending` status (intake auto-confirms); the operationally meaningful
        // backlog is confirmed/retrying orders with no rider yet.
        $pendingOrders = Order::where('store_id', $store->id)
            ->whereIn('status', ['confirmed', 'retrying'])
            ->whereNull('rider_id')
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

    public function alerts(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));
        $alerts = [];

        // Orders awaiting a rider for over 5 minutes (auto-dispatch should
        // assign within seconds when riders exist — anything older means
        // dispatch is stuck)
        $stalePending = Order::where('store_id', $store->id)
            ->whereIn('status', ['confirmed', 'retrying'])
            ->whereNull('rider_id')
            ->where('created_at', '<=', Carbon::now()->subMinutes(5))
            ->count();

        if ($stalePending > 0) {
            $alerts[] = [
                'id' => 'stale-pending',
                'type' => 'order_pending',
                'severity' => 'warning',
                'message' => "{$stalePending} order(s) awaiting dispatch for over 5 minutes",
            ];
        }

        // No riders available for over 10 minutes with orders awaiting dispatch
        $hasPendingOrders = Order::where('store_id', $store->id)
            ->whereIn('status', ['confirmed', 'retrying'])
            ->whereNull('rider_id')
            ->exists();

        if ($hasPendingOrders) {
            $activeRiders = Rider::where('store_id', $store->id)
                ->where('is_available', true)
                ->count();

            if ($activeRiders === 0) {
                // Check if this condition has persisted for >10 minutes
                // by seeing if any rider's last location update was >10min ago
                $riderIds = Rider::where('store_id', $store->id)->pluck('id');
                $lastRiderActivity = $riderIds->isNotEmpty()
                    ? RiderLocation::whereIn('rider_id', $riderIds)
                        ->latest('recorded_at')
                        ->value('recorded_at')
                    : null;

                $idleDuration = $lastRiderActivity
                    ? $lastRiderActivity->diffInMinutes(Carbon::now())
                    : null;

                if ($idleDuration === null || $idleDuration >= 10) {
                    $alerts[] = [
                        'id' => 'no-riders',
                        'type' => 'rider_idle',
                        'severity' => 'warning',
                        'message' => 'No riders available for over 10 minutes — orders cannot be dispatched',
                    ];
                }
            }
        }

        return response()->json(['alerts' => $alerts]);
    }

    public function mapLayers(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));

        return response()->json($this->mapLayersService->getLayers($store));
    }

    public function events(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));

        $cursor = $request->input('cursor');
        $limit = min((int) $request->input('limit', 50), 50);

        $result = $this->eventFeedService->getEvents($cursor, $limit, $store);

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

        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));

        $query = AuditLog::with('user')->where($this->storeAuditScope($store));

        if ($entityType) {
            $query->where('entity_type', $entityType);
        }
        if ($userId) {
            $query->where('user_id', $userId);
        }

        $logs = $query->orderByDesc('created_at')->limit($limit)->get();

        return response()->json(['audit_logs' => $logs]);
    }

    public function auditLogsForEntity(Request $request, string $entityType, int $entityId): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));

        // Cross-tenant guard: the entity itself must belong to the resolved
        // store, otherwise a store-level operator could read another store's
        // audit trail by id.
        $inScope = match ($entityType) {
            'order' => Order::where('id', $entityId)->where('store_id', $store->id)->exists(),
            'rider' => Rider::where('id', $entityId)->where('store_id', $store->id)->exists(),
            default => false,
        };

        if (! $inScope) {
            return response()->json(['audit_logs' => []]);
        }

        $logs = $this->auditService->forEntity($entityType, $entityId);

        return response()->json(['audit_logs' => $logs]);
    }

    /**
     * Audit rows are only written for `order` and `rider` entities; scope both
     * to the resolved store so store-level operators can never read another
     * store's trail.
     */
    private function storeAuditScope(Store $store): \Closure
    {
        return fn ($query) => $query->where(function ($q) use ($store) {
            $q->where(function ($q) use ($store) {
                $q->where('entity_type', 'order')
                    ->whereIn('entity_id', Order::where('store_id', $store->id)->select('id'));
            })->orWhere(function ($q) use ($store) {
                $q->where('entity_type', 'rider')
                    ->whereIn('entity_id', Rider::where('store_id', $store->id)->select('id'));
            });
        });
    }
}
