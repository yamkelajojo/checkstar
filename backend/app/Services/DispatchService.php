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

        $claimed = $this->tryStores($order);
        if ($claimed !== null) {
            return $claimed;
        }

        $this->stateMachine->transition($order, OrderStatus::Retrying, null, [
            'reason' => 'No available riders at any store',
            'source' => 'dispatch',
        ]);

        return $this->result(null, null, 'retrying');
    }

    public function retry(Order $order): array
    {
        $order = $order->fresh();

        if ($order === null || $order->status !== OrderStatus::Retrying) {
            return $this->result(null, null, 'skipped');
        }

        $claimed = $this->tryStores($order);
        if ($claimed !== null) {
            return $claimed;
        }

        if ($order->dispatch_attempts + 1 >= $this->policy->maxAttempts()) {
            $this->cancelOrder($order, 'No available riders after ' . $this->policy->maxAttempts() . ' dispatch attempts');
            return $this->result(null, null, 'cancelled');
        }

        $order->dispatch_attempts += 1;
        $order->save();

        return $this->result(null, null, 'retrying');
    }

    private function tryStores(Order $order): ?array
    {
        $customerLat = (float) $order->delivery_latitude;
        $customerLng = (float) $order->delivery_longitude;

        $eligibleStores = $this->policy->eligibleStores($customerLat, $customerLng);
        $maxFallback = $this->policy->maxFallbackStores();

        $attempts = 0;

        foreach ($eligibleStores as $sd) {
            if ($attempts >= $maxFallback) {
                break;
            }

            $store = $sd['store'];
            $distance = $sd['distance_km'];
            $rider = $this->policy->eligibleRider($store, $distance);

            if (!$rider instanceof Rider) {
                $attempts++;
                continue;
            }

            $claimResult = $this->orderClaim->claim($order, $rider, $store);
            if ($claimResult->claimed) {
                return $this->result($store->id, $rider->id, 'assigned', $claimResult->claimLatencyMs);
            }

            $attempts++;
        }

        return null;
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
