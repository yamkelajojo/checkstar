<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\GameEvent;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Rider;
use App\Models\Store;
use App\Models\StoreProduct;

class RiderOrderService
{
    private OrderStateMachine $stateMachine;
    private GamificationService $gamification;
    private OrderClaim $orderClaim;

    public function __construct(OrderStateMachine $stateMachine, GamificationService $gamification, OrderClaim $orderClaim)
    {
        $this->stateMachine = $stateMachine;
        $this->gamification = $gamification;
        $this->orderClaim = $orderClaim;
    }

    public function claim(Rider $rider, int $orderId): ?Order
    {
        $order = Order::findOrFail($orderId);

        if ($order->store_id !== $rider->store_id) {
            return null;
        }

        if ($order->rider_id !== null || !in_array($order->status, [OrderStatus::Confirmed, OrderStatus::Retrying], true)) {
            return null;
        }

        $store = Store::find($rider->store_id);
        if (!$store) {
            return null;
        }

        $claimResult = $this->orderClaim->claim($order, $rider, $store);

        return $claimResult->claimed ? $claimResult->order : null;
    }

    public function markItemsBought(Rider $rider, int $orderId): Order
    {
        $order = Order::where('id', $orderId)
            ->where('rider_id', $rider->id)
            ->firstOrFail();

        foreach ($order->items as $item) {
            if ($item->store_product_id) {
                $sp = StoreProduct::find($item->store_product_id);
                if ($sp) {
                    $sp->decrement('stock_quantity', $item->quantity);
                }
            }
        }

        $order->activityLogs()->create([
            'event_type' => EventType::ItemsBought->value,
            'user_id' => $rider->user_id,
            'old_status' => $order->status->value,
            'new_status' => $order->status->value,
            'created_at' => now(),
        ]);

        return $order;
    }

    public function advanceStatus(Rider $rider, int $orderId, OrderStatus $to): Order
    {
        $order = Order::where('id', $orderId)
            ->where('rider_id', $rider->id)
            ->firstOrFail();

        $this->stateMachine->transition($order, $to, $rider->user);

        if ($to === OrderStatus::Delivered) {
            $this->gamification->handleEvent($rider, GameEvent::DeliveryCompleted);
        }

        return $order->fresh();
    }
}
