<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;

class AuditService
{
    public function log(
        User|int $user,
        string $action,
        string $entityType,
        int $entityId,
        array $metadata = []
    ): ?AuditLog {
        try {
            $userId = $user instanceof User ? $user->id : $user;

            return AuditLog::create([
                'user_id' => $userId,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'metadata' => $metadata,
            ]);
        } catch (\Exception $e) {
            Log::debug('[AuditService] Silent failure', [
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function logOrderConfirmed(User|int $user, int $orderId, array $extra = []): ?AuditLog
    {
        return $this->log($user, 'confirmed', 'order', $orderId, $extra);
    }

    public function logOrderDispatched(User|int $user, int $orderId, ?int $riderId = null, array $extra = []): ?AuditLog
    {
        return $this->log($user, 'dispatched', 'order', $orderId, array_merge(
            $riderId ? ['rider_id' => $riderId] : [],
            $extra
        ));
    }

    public function logOrderDelivered(User|int $user, int $orderId, array $extra = []): ?AuditLog
    {
        return $this->log($user, 'delivered', 'order', $orderId, $extra);
    }

    public function logOrderCancelled(User|int $user, int $orderId, ?string $reason = null, array $extra = []): ?AuditLog
    {
        return $this->log($user, 'cancelled', 'order', $orderId, array_merge(
            $reason ? ['reason' => $reason] : [],
            $extra
        ));
    }

    public function logRiderAvailable(User|int $user, int $riderId, array $extra = []): ?AuditLog
    {
        return $this->log($user, 'available', 'rider', $riderId, $extra);
    }

    public function logRiderUnavailable(User|int $user, int $riderId, array $extra = []): ?AuditLog
    {
        return $this->log($user, 'unavailable', 'rider', $riderId, $extra);
    }

    public function logManualDispatch(User|int $user, int $orderId, int $riderId, array $extra = []): ?AuditLog
    {
        return $this->log($user, 'manual_dispatch', 'order', $orderId, array_merge(
            ['rider_id' => $riderId],
            $extra
        ));
    }

    public function forEntity(string $entityType, int $entityId, int $limit = 50): Collection
    {
        return AuditLog::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    public function forUser(int $userId, int $limit = 50): Collection
    {
        return AuditLog::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    public function inRange(string $from, string $to, int $limit = 200): Collection
    {
        return AuditLog::whereBetween('created_at', [$from, $to])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }
}
