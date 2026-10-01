<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getSalesData(int $storeId, string $period = '30d'): object
    {
        $days = $this->parsePeriod($period);
        $startDate = Carbon::now()->subDays($days);

        $orders = DB::table('orders')
            ->where('store_id', $storeId)
            ->where('created_at', '>=', $startDate)
            ->where('status', '!=', 'cancelled')
            ->get();

        $totalRevenue = (float) $orders->sum('total');
        $totalOrders = $orders->count();
        $avgOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;

        $revenueByDate = $orders
            ->groupBy(fn ($o) => Carbon::parse($o->created_at)->format('Y-m-d'))
            ->map(fn ($group, $date) => [
                'date' => $date,
                'revenue' => round((float) $group->sum('total'), 2),
                'orders' => $group->count(),
            ])
            ->values()
            ->sortBy('date')
            ->values();

        $ordersByHour = collect(range(0, 23))
            ->map(fn ($hour) => [
                'hour' => $hour,
                'count' => $orders->filter(fn ($o) => Carbon::parse($o->created_at)->hour === $hour)->count(),
            ])
            ->values();

        return (object) [
            'revenue_over_time' => $revenueByDate,
            'orders_by_hour' => $ordersByHour,
            'total_revenue' => $totalRevenue,
            'total_orders' => $totalOrders,
            'avg_order_value' => $avgOrderValue,
        ];
    }

    public function getProductsData(int $storeId, int $limit = 10): object
    {
        $topProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.store_id', $storeId)
            ->where('orders.created_at', '>=', Carbon::now()->subDays(30))
            ->select(
                'products.id',
                'products.name',
                DB::raw('COUNT(DISTINCT orders.id) as order_count'),
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.quantity * order_items.unit_price) as total_revenue')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_revenue')
            ->limit($limit)
            ->get();

        $searchQueries = DB::table('user_tracking_events')
            ->where('event_type', 'search')
            ->whereNotNull('search_query')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->select(
                'search_query as query',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('search_query')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return (object) [
            'top_products' => $topProducts,
            'search_queries' => $searchQueries,
        ];
    }

    public function getRidersData(int $storeId, string $period = '30d'): object
    {
        $days = $this->parsePeriod($period);
        $startDate = Carbon::now()->subDays($days);

        $riders = DB::table('riders')
            ->leftJoin('users', 'riders.user_id', '=', 'users.id')
            ->select('riders.*', 'users.name as user_name')
            ->where('riders.store_id', $storeId)
            ->get();

        $riderUtilization = $riders->map(function ($rider) use ($startDate, $storeId) {
            $deliveries = DB::table('orders')
                ->where('rider_id', $rider->id)
                ->where('store_id', $storeId)
                ->where('status', 'delivered')
                ->where('created_at', '>=', $startDate)
                ->count();

            $deliveryTimes = DB::table('orders')
                ->where('rider_id', $rider->id)
                ->where('store_id', $storeId)
                ->where('status', 'delivered')
                ->where('created_at', '>=', $startDate)
                ->whereNotNull('customer_confirmed_at')
                ->select('created_at', 'customer_confirmed_at')
                ->get();

            $avgMinutes = $deliveryTimes->isEmpty()
                ? null
                : $deliveryTimes->map(function ($row) {
                    $start = strtotime((string) $row->created_at);
                    $end = strtotime((string) $row->customer_confirmed_at);

                    return ($end - $start) / 60;
                })->average();

            return (object) [
                'rider_id' => $rider->id,
                'name' => ! empty($rider->user_name) ? $rider->user_name : 'Rider #'.$rider->id,
                'delivery_count' => $deliveries,
                'avg_delivery_time' => $avgMinutes !== null ? round($avgMinutes, 1) : null,
                'total_distance' => round($deliveries * 5.2, 1),
                'is_available' => $rider->is_available,
            ];
        });

        $activeRiders = $riders->where('is_available', true)->count();
        $totalDeliveries = $riderUtilization->sum('delivery_count');
        $avgUtilization = $riders->count() > 0
            ? round($totalDeliveries / max($riders->count(), 1), 1)
            : 0;

        return (object) [
            'rider_utilization' => $riderUtilization,
            'fleet_summary' => (object) [
                'active_riders' => $activeRiders,
                'total_riders' => $riders->count(),
                'avg_utilization_rate' => $avgUtilization,
            ],
        ];
    }

    private function parsePeriod(string $period): int
    {
        return match ($period) {
            '7d' => 7,
            '30d' => 30,
            '90d' => 90,
            default => 30,
        };
    }
}
