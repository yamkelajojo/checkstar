<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        return $this->owns($user, $order) || $this->isAssignedRider($user, $order);
    }

    public function cancel(User $user, Order $order): bool
    {
        return $this->owns($user, $order);
    }

    public function confirmDelivery(User $user, Order $order): bool
    {
        return $this->owns($user, $order);
    }

    public function review(User $user, Order $order): bool
    {
        return $this->owns($user, $order);
    }

    private function owns(User $user, Order $order): bool
    {
        return $user->id === $order->customer_id;
    }

    private function isAssignedRider(User $user, Order $order): bool
    {
        if ($user->role !== 'rider' || ! $user->rider) {
            return false;
        }

        return $order->rider_id === $user->rider->id;
    }
}
