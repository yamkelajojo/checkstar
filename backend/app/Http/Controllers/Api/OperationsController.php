<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\Rider;
use App\Models\User;
use App\Services\AuditService;
use App\Services\StoreContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class OperationsController extends Controller
{
    protected AuditService $auditService;
    protected StoreContext $storeContext;

    public function __construct(AuditService $auditService, StoreContext $storeContext)
    {
        $this->auditService = $auditService;
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

        $orderEvents = Order::select(
            'id',
            DB::raw("'order_state_change' as type"),
            'status',
            DB::raw("'info' as severity"),
            DB::raw("CONCAT('Order #', id, ' ', status) as message"),
            DB::raw("'order' as entity_type"),
            'id as entity_id',
            'created_at'
        )
            ->when($cursor, fn ($q) => $q->where('created_at', '<', $cursor))
            ->orderByDesc('created_at')
            ->limit($limit);

        $riderEvents = Rider::select(
            'id',
            DB::raw("'rider_availability' as type"),
            DB::raw("is_available as status"),
            DB::raw("'info' as severity"),
            DB::raw("CONCAT('Rider #', id, ' went ', IF(is_available, 'available', 'unavailable')) as message"),
            DB::raw("'rider' as entity_type"),
            'id as entity_id',
            'updated_at as created_at'
        )
            ->when($cursor, fn ($q) => $q->where('updated_at', '<', $cursor))
            ->orderByDesc('updated_at')
            ->limit($limit);

        $events = $orderEvents->union($riderEvents)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        $nextCursor = $events->isNotEmpty() ? $events->last()->created_at : null;

        return response()->json([
            'events' => $events,
            'next_cursor' => $nextCursor,
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
