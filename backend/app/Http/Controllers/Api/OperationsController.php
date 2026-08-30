<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\Rider;
use App\Models\RiderLocation;
use App\Services\AuditService;
use App\Services\EventFeedService;
use App\Services\StoreContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class OperationsController extends Controller
{
    public function __construct(
        private AuditService $auditService,
        private EventFeedService $eventFeedService,
        private StoreContext $storeContext,
    ) {
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

    public function alerts(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id'));
        $alerts = [];

        // Spec: pending orders older than 5 minutes
        $stalePending = Order::where('store_id', $store->id)
            ->where('status', 'pending')
            ->where('created_at', '<=', Carbon::now()->subMinutes(5))
            ->count();

        if ($stalePending > 0) {
            $alerts[] = [
                'id' => 'stale-pending',
                'type' => 'order_pending',
                'severity' => 'warning',
                'message' => "{$stalePending} order(s) pending for over 5 minutes",
            ];
        }

        // Spec: no riders available for over 10 minutes with pending orders
        $hasPendingOrders = Order::where('store_id', $store->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPendingOrders) {
            $activeRiders = Rider::where('store_id', $store->id)
                ->where('is_available', true)
                ->count();

            if ($activeRiders === 0) {
                // Check if this condition has persisted for >10 minutes
                // by seeing if any rider's last location update was >10min ago
                $riderIds = Rider::where('store_id', $store->id)->pluck('id');
                $lastRiderActivity = RiderLocation::whereIn('rider_id', $riderIds)
                    ->latest('recorded_at')
                    ->value('recorded_at');

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

        // Traffic: order density from the last 24h, grid-clustered
        $recentOrders = Order::where('store_id', $store->id)
            ->whereNotNull('delivery_latitude')
            ->whereNotNull('delivery_longitude')
            ->where('created_at', '>=', Carbon::now()->subDay())
            ->select('delivery_latitude', 'delivery_longitude')
            ->get();

        $traffic = $this->clusterPoints(
            $recentOrders->map(fn ($o) => [(float) $o->delivery_latitude, (float) $o->delivery_longitude])->toArray(),
            precision: 2
        );

        // Routes: active delivery rider locations
        $activeRiderIds = Order::where('store_id', $store->id)
            ->where('status', 'out_for_delivery')
            ->whereNotNull('rider_id')
            ->pluck('rider_id')
            ->unique();

        $routes = [];
        if ($activeRiderIds->isNotEmpty()) {
            $latestLocations = RiderLocation::whereIn('rider_id', $activeRiderIds)
                ->select('rider_id', 'latitude', 'longitude', 'recorded_at')
                ->orderBy('recorded_at', 'desc')
                ->get()
                ->unique('rider_id');

            $routes = $latestLocations->map(fn ($loc) => [
                'rider_id' => $loc->rider_id,
                'lat' => (float) $loc->latitude,
                'lng' => (float) $loc->longitude,
            ])->values()->toArray();
        }

        // Demand: order density from the last 7 days (proxy for demand areas)
        $demandOrders = Order::where('store_id', $store->id)
            ->whereNotNull('delivery_latitude')
            ->whereNotNull('delivery_longitude')
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->select('delivery_latitude', 'delivery_longitude')
            ->get();

        $demand = $this->clusterPoints(
            $demandOrders->map(fn ($o) => [(float) $o->delivery_latitude, (float) $o->delivery_longitude])->toArray(),
            precision: 3
        );

        return response()->json([
            'traffic' => $traffic,
            'routes' => $routes,
            'demand' => $demand,
        ]);
    }

    /**
     * Cluster lat/lng points by grid cell. Returns [{lat, lng, count}].
     */
    private function clusterPoints(array $points, int $precision = 2): array
    {
        $grid = [];
        foreach ($points as [$lat, $lng]) {
            $key = round($lat, $precision) . ',' . round($lng, $precision);
            if (!isset($grid[$key])) {
                $grid[$key] = ['lat' => 0.0, 'lng' => 0.0, 'count' => 0];
            }
            $grid[$key]['lat'] += $lat;
            $grid[$key]['lng'] += $lng;
            $grid[$key]['count']++;
        }

        return array_values(array_map(fn ($cell) => [
            'lat' => $cell['lat'] / $cell['count'],
            'lng' => $cell['lng'] / $cell['count'],
            'count' => $cell['count'],
        ], $grid));
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
}
