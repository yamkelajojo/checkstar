<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\Store;
use Illuminate\Support\Collection;

class EventFeedService
{
    private const STATUS_SEVERITY = [
        'pending' => 'warning',
        'confirmed' => 'info',
        'preparing' => 'info',
        'out_for_delivery' => 'success',
        'delivered' => 'success',
        'cancelled' => 'error',
        'retrying' => 'warning',
    ];

    private const AUDIT_SEVERITY = [
        'dispatched' => 'success',
        'dispatch_failed' => 'error',
        'confirmed' => 'info',
        'delivered' => 'success',
        'cancelled' => 'error',
        'picked_up' => 'success',
    ];

    /**
     * @param  Store|null  $contextStore  When provided, events are scoped to this
     *                                    store's orders/riders (multi-store ops).
     */
    public function getEvents(?string $cursor = null, int $limit = 50, ?Store $contextStore = null): object
    {
        $fetchLimit = $limit + 1;

        $orderEvents = $this->getOrderEvents($cursor, $fetchLimit, $contextStore);
        $riderEvents = $this->getRiderEvents($cursor, $fetchLimit, $contextStore);
        $auditEvents = $this->getAuditEvents($cursor, $fetchLimit, $contextStore);

        $all = $orderEvents->concat($riderEvents)->concat($auditEvents)
            ->sortByDesc('created_at')
            ->values();

        $hasMore = $all->count() > $limit;
        $events = $hasMore ? $all->take($limit) : $all;
        $nextCursor = $hasMore ? $events->last()->created_at : null;

        return (object) [
            'events' => $events,
            'nextCursor' => $nextCursor,
        ];
    }

    private function getOrderEvents(?string $cursor, int $limit, ?Store $contextStore): Collection
    {
        $now = now()->addSeconds(5)->toDateTimeString();

        $query = DB::table('orders')
            ->select('id', 'order_number', 'status', 'created_at', 'updated_at')
            ->when($contextStore, fn ($q) => $q->where('store_id', $contextStore->id))
            ->where('created_at', '<=', $now)
            ->when($cursor, fn ($q) => $q->where('created_at', '<', $cursor))
            ->orderByDesc('created_at')
            ->limit($limit);

        return $query->get()
            ->map(function ($row) use ($now) {
                // If an order was updated after creation (and not a future-seeded timestamp),
                // use the latest status transition timestamp so status changes surface at the top.
                $eventTime = $row->created_at;
                if (! empty($row->updated_at) && $row->updated_at > $row->created_at && $row->updated_at <= $now && ! str_starts_with((string) $row->order_number, 'ORD-')) {
                    $eventTime = $row->updated_at;
                }

                $statusLabel = str_replace('_', ' ', (string) $row->status);

                return $this->mapEvent(
                    (object) [
                        'id' => $row->id.'-'.$row->status,
                        'type' => 'order_state_change',
                        'status' => $row->status,
                        'message' => "Order #{$row->order_number} {$statusLabel}",
                        'entity_type' => 'order',
                        'entity_id' => $row->id,
                        'created_at' => $eventTime,
                    ],
                    self::STATUS_SEVERITY[$row->status] ?? 'info'
                );
            });
    }

    private function getRiderEvents(?string $cursor, int $limit, ?Store $contextStore): Collection
    {
        $now = now()->addSeconds(5)->toDateTimeString();

        $query = DB::table('riders')
            ->leftJoin('users', 'riders.user_id', '=', 'users.id')
            ->select('riders.id', 'riders.is_available', 'riders.updated_at', 'users.name as user_name')
            ->when($contextStore, fn ($q) => $q->where('riders.store_id', $contextStore->id))
            ->where('riders.updated_at', '<=', $now)
            ->when($cursor, fn ($q) => $q->where('riders.updated_at', '<', $cursor))
            ->orderByDesc('riders.updated_at')
            ->limit($limit);

        return $query->get()
            ->map(function ($row) {
                $riderLabel = ! empty($row->user_name) ? "{$row->user_name} (#{$row->id})" : "Rider #{$row->id}";

                return $this->mapEvent(
                    (object) [
                        'id' => $row->id.'-'.($row->is_available ? '1' : '0'),
                        'type' => 'rider_availability',
                        'status' => $row->is_available,
                        'message' => $riderLabel.' went '.($row->is_available ? 'available' : 'unavailable'),
                        'entity_type' => 'rider',
                        'entity_id' => $row->id,
                        'created_at' => $row->updated_at,
                    ],
                    'info'
                );
            });
    }

    private function getAuditEvents(?string $cursor, int $limit, ?Store $contextStore): Collection
    {
        $query = AuditLog::query()
            ->select('id', 'action', 'entity_type', 'entity_id', 'created_at')
            ->whereIn('action', ['dispatched', 'dispatch_failed'])
            ->when($contextStore, fn ($q) => $q->whereIn(
                'entity_id',
                Order::query()->select('id')->where('store_id', $contextStore->id)
            ))
            ->when($cursor, fn ($q) => $q->where('created_at', '<', $cursor))
            ->orderByDesc('created_at')
            ->limit($limit);

        return $query->get()
            ->map(fn ($row) => $this->mapEvent(
                (object) [
                    'id' => $row->id,
                    'type' => 'dispatch_attempt',
                    'status' => $row->action,
                    'message' => ucfirst($row->action).' — Order #'.$row->entity_id,
                    'entity_type' => $row->entity_type,
                    'entity_id' => $row->entity_id,
                    'created_at' => $row->created_at,
                ],
                self::AUDIT_SEVERITY[$row->action] ?? 'info'
            ));
    }

    private function mapEvent($row, string $severity): object
    {
        return (object) [
            // Composite id: the three source tables have independent id
            // sequences, so bare numeric ids collide across event types and
            // break client-side dedupe.
            'id' => $row->type.'-'.$row->id,
            'type' => $row->type,
            'severity' => $severity,
            'message' => $row->message,
            'entity_type' => $row->entity_type,
            'entity_id' => $row->entity_id,
            'created_at' => $row->created_at,
        ];
    }
}
