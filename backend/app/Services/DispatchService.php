<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderActivityLog;
use App\Models\Rider;
use App\Models\Store;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class DispatchService
{
    private OrderStateMachine $stateMachine;

    public function __construct()
    {
        $this->stateMachine = new OrderStateMachine;
    }

    public function dispatch(Order $order): array
    {
        if ($order->status !== OrderStatus::Confirmed) {
            throw new \InvalidArgumentException('Order must be confirmed to dispatch');
        }

        if ($order->delivery_latitude === null || $order->delivery_longitude === null) {
            $this->cancelOrder($order, 'Delivery coordinates missing');
            return ['store_id' => null, 'rider_id' => null, 'status' => 'cancelled', 'claim_latency_seconds' => null, 'reason' => 'Delivery coordinates missing'];
        }

        $stores = Store::where('is_active', true)->get();
        $customerLat = (float) $order->delivery_latitude;
        $customerLng = (float) $order->delivery_longitude;

        $storeDistances = $stores->map(function ($store) use ($customerLat, $customerLng) {
            $distance = $this->haversine($customerLat, $customerLng, (float) $store->latitude, (float) $store->longitude);
            return ['store' => $store, 'distance_km' => $distance];
        })->sortBy('distance_km')->values();

        $claimLatency = null;
        $riderId = null;
        $storeId = null;
        $status = 'no_rider_available';
        $maxFallback = Config::get('dispatch.max_fallback_stores', 3);
        $attempts = 0;

        foreach ($storeDistances as $sd) {
            if ($attempts >= $maxFallback) {
                break;
            }

            $store = $sd['store'];
            $distance = $sd['distance_km'];

            if ($distance > (float) $store->delivery_radius_km) {
                continue;
            }

            $rider = Rider::where('store_id', $store->id)
                ->where('is_available', true)
                ->where('max_radius_km', '>=', $distance)
                ->whereNull('suspended_at')
                ->first();

            if (!$rider) {
                continue;
            }

            $result = $this->claimOrder($order, $rider, $store);
            if ($result) {
                $claimLatency = $result['claim_latency_seconds'];
                $riderId = $rider->id;
                $storeId = $store->id;
                $status = 'assigned';
                break;
            }

            $attempts++;
        }

        if ($status === 'no_rider_available') {
            $this->cancelOrder($order, 'No available riders at any store');
        }

        return [
            'store_id' => $storeId,
            'rider_id' => $riderId,
            'status' => $status,
            'claim_latency_seconds' => $claimLatency,
        ];
    }

    private function claimOrder(Order $order, Rider $rider, Store $store): ?array
    {
        $claimed = DB::transaction(function () use ($order, $rider, $store) {
            $fresh = Order::where('id', $order->id)
                ->whereNull('rider_id')
                ->lockForUpdate()
                ->first();

            if (!$fresh) {
                return false;
            }

            $start = microtime(true);
            $fresh->rider_id = $rider->id;
            $fresh->store_id = $store->id;
            $fresh->status = OrderStatus::Preparing;
            $fresh->save();

            $this->syncStoreProductIds($fresh);

            $claimLatency = round((microtime(true) - $start) * 1000);

            OrderActivityLog::create([
                'order_id' => $fresh->id,
                'user_id' => $rider->user_id,
                'event_type' => EventType::RiderAssigned->value,
                'old_status' => OrderStatus::Confirmed->value,
                'new_status' => OrderStatus::Preparing->value,
                'metadata' => json_encode(['claim_latency_ms' => $claimLatency]),
                'created_at' => now(),
            ]);

            return true;
        });

        return $claimed ? ['claim_latency_seconds' => 0] : null;
    }

    private function syncStoreProductIds(Order $order): void
    {
        foreach ($order->items as $item) {
            $sp = \App\Models\StoreProduct::where('store_id', $order->store_id)
                ->where('product_id', $item->product_id)
                ->first();
            if ($sp) {
                $item->store_product_id = $sp->id;
                $item->save();
            }
        }
    }

    private function cancelOrder(Order $order, string $reason): void
    {
        $oldStatus = $order->status->value;

        $order->status = OrderStatus::Cancelled;
        $order->save();

        OrderActivityLog::create([
            'order_id' => $order->id,
            'event_type' => EventType::Cancelled->value,
            'old_status' => $oldStatus,
            'new_status' => OrderStatus::Cancelled->value,
            'metadata' => json_encode(['reason' => $reason]),
            'created_at' => now(),
        ]);
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
