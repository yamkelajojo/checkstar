<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Rider;
use App\Models\Store;

class DispatchService
{
    private OrderStateMachine $stateMachine;
    private DispatchPolicy $policy;
    private OrderClaim $orderClaim;

    public function __construct(OrderStateMachine $stateMachine, DispatchPolicy $policy, OrderClaim $orderClaim)
    {
        $this->stateMachine = $stateMachine;
        $this->policy = $policy;
        $this->orderClaim = $orderClaim;
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

        $customerLat = (float) $order->delivery_latitude;
        $customerLng = (float) $order->delivery_longitude;

        $eligibleStores = $this->policy->eligibleStores($customerLat, $customerLng);
        $maxFallback = $this->policy->maxFallbackStores();

        $claimLatency = null;
        $riderId = null;
        $storeId = null;
        $status = 'no_rider_available';
        $attempts = 0;

        foreach ($eligibleStores as $sd) {
            if ($attempts >= $maxFallback) {
                break;
            }

            $store = $sd['store'];
            $distance = $sd['distance_km'];
            $rider = $this->policy->eligibleRider($store, $distance);

            if (!$rider) {
                $attempts++;
                continue;
            }

            $claimResult = $this->orderClaim->claim($order, $rider, $store);
            if ($claimResult->claimed) {
                $claimLatency = $claimResult->claimLatencyMs;
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
}
