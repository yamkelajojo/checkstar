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

        return $this->attempt($order, isInitial: true);
    }

    public function retry(Order $order): array
    {
        $order = $order->fresh();

        if ($order === null || $order->status !== OrderStatus::Retrying) {
            return $this->result(null, null, 'skipped');
        }

        return $this->attempt($order, isInitial: false);
    }

    /**
     * Single attempt path used by both the initial dispatch and the retry job.
     * $isInitial controls whether a “no rider” / “claim failed” should transition
     * to Retrying (initial dispatch) or simply return retrying (already there).
     */
    private function attempt(Order $order, bool $isInitial): array
    {
        // Shared guards — identical for dispatch and retry
        if ($order->delivery_latitude === null || $order->delivery_longitude === null) {
            $this->cancelOrder($order, 'Delivery coordinates missing');
            return $this->result(null, null, 'cancelled', null, 'Delivery coordinates missing');
        }

        if ($order->store_id === null) {
            $this->cancelOrder($order, 'No fulfillment store assigned');
            return $this->result(null, null, 'cancelled', null, 'No fulfillment store assigned');
        }

        $store = Store::find($order->store_id);
        if (! $store) {
            $this->cancelOrder($order, 'Assigned fulfillment store not found');
            return $this->result(null, null, 'cancelled', null, 'Assigned fulfillment store not found');
        }

        $customerLat = (float) $order->delivery_latitude;
        $customerLng = (float) $order->delivery_longitude;
        $distance = $this->policy->haversine($customerLat, $customerLng, (float) $store->latitude, (float) $store->longitude);

        if ($distance > (float) $store->delivery_radius_km) {
            $this->cancelOrder($order, 'Assigned store is outside delivery radius');
            return $this->result(null, null, 'cancelled', null, 'Assigned store is outside delivery radius');
        }

        $rider = $this->policy->eligibleRider($store, $distance);

        if (! $rider instanceof Rider) {
            return $this->handleNoRider($order, $isInitial, 'No available riders at assigned store');
        }

        $claimResult = $this->orderClaim->claim($order, $rider, $store);
        if ($claimResult->claimed) {
            return $this->result($store->id, $rider->id, 'assigned', $claimResult->claimLatencyMs);
        }

        return $this->handleClaimFailed($order, $isInitial);
    }

    private function handleNoRider(Order $order, bool $isInitial, string $reason): array
    {
        $order->dispatch_attempts += 1;
        $order->save();

        if ($order->dispatch_attempts >= $this->policy->maxAttempts()) {
            $this->cancelOrder($order, 'No available riders after '.$this->policy->maxAttempts().' dispatch attempts');
            return $this->result(null, null, 'cancelled');
        }

        if ($isInitial) {
            $this->stateMachine->transition($order, OrderStatus::Retrying, null, [
                'reason' => $reason,
                'source' => 'dispatch',
            ]);
        }

        return $this->result(null, null, 'retrying');
    }

    private function handleClaimFailed(Order $order, bool $isInitial): array
    {
        $order->dispatch_attempts += 1;
        $order->save();

        if ($order->dispatch_attempts >= $this->policy->maxAttempts()) {
            $this->cancelOrder($order, 'No available riders after '.$this->policy->maxAttempts().' dispatch attempts');
            return $this->result(null, null, 'cancelled');
        }

        if ($isInitial) {
            $this->stateMachine->transition($order, OrderStatus::Retrying, null, [
                'reason' => 'Rider claim failed, retrying',
                'source' => 'dispatch',
            ]);
        }

        return $this->result(null, null, 'retrying');
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
