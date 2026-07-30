<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Rider;
use App\Models\Store;
use App\Services\OrderStateMachine;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class DispatchService
{
    private OrderStateMachine $stateMachine;

    public function __construct(OrderStateMachine $stateMachine)
    {
        $this->stateMachine = $stateMachine;
    }

    public function dispatch(Order $order): array
    {
        if ($order->status !== OrderStatus::Confirmed) {
            throw new \InvalidArgumentException('Order must be confirmed to dispatch');
        }

        if ($order->delivery_latitude === null || $order->delivery_longitude === null) {
            $this->cancelOrder($order, 'Delivery coordinates missing');
            return $this->result(null, null, 'cancelled', null, 'Delivery coordinates missing');
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
                $attempts++;
                continue;
            }

            $result = $this->claimOrder($order, $rider, $store);
            if ($result) {
                $claimLatency = $result['claim_latency_ms'];
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

        return $this->result($storeId, $riderId, $status, $claimLatency);
    }

    private function claimOrder(Order $order, Rider $rider, Store $store): ?array
    {
        $start = microtime(true);

        $claimed = DB::transaction(function () use ($order, $rider, $store, $start) {
            $fresh = Order::where('id', $order->id)
                ->whereNull('rider_id')
                ->lockForUpdate()
                ->first();

            if (!$fresh) {
                return false;
            }

            $this->stateMachine->transition($fresh, OrderStatus::Preparing, $rider->user, [
                'rider_id' => $rider->id,
                'store_id' => $store->id,
            ]);

            $fresh->rider_id = $rider->id;
            $fresh->store_id = $store->id;
            $fresh->save();

            $this->syncStoreProductIds($fresh);

            return true;
        });

        if (!$claimed) {
            return null;
        }

        $elapsed = (int) round((microtime(true) - $start) * 1000);

        return ['claim_latency_ms' => $elapsed];
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
        $this->stateMachine->transition($order, OrderStatus::Cancelled, null, [
            'reason' => $reason,
            'source' => 'dispatch',
        ]);
    }

    private function result(?int $storeId, ?int $riderId, string $status, ?int $claimLatencyMs = null, ?string $reason = null): array
    {
        $result = [
            'store_id' => $storeId,
            'rider_id' => $riderId,
            'status' => $status,
            'claim_latency_ms' => $claimLatencyMs,
        ];
        if ($reason !== null) {
            $result['reason'] = $reason;
        }
        return $result;
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
