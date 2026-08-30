<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EventFeedService
{
    private const STATUS_SEVERITY = [
        'pending' => 'warning',
        'confirmed' => 'info',
        'preparing' => 'info',
        'out_for_delivery' => 'success',
        'delivered' => 'success',
        'cancelled' => 'error',
    ];

    private const AUDIT_SEVERITY = [
        'dispatched' => 'success',
        'dispatch_failed' => 'error',
        'confirmed' => 'info',
        'delivered' => 'success',
        'cancelled' => 'error',
        'picked_up' => 'success',
    ];

    public function getEvents(?string $cursor = null, int $limit = 50): object
    {
        $fetchLimit = $limit + 1;

        $orderEvents = $this->getOrderEvents($cursor, $fetchLimit);
        $riderEvents = $this->getRiderEvents($cursor, $fetchLimit);
        $auditEvents = $this->getAuditEvents($cursor, $fetchLimit);

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

    private function getOrderEvents(?string $cursor, int $limit): Collection
    {
        return DB::table('orders')
            ->select(
                'id',
                DB::raw("'order_state_change' as type"),
                'status',
                DB::raw("'Order #' || order_number || ' ' || status as message"),
                DB::raw("'order' as entity_type"),
                'id as entity_id',
                'created_at'
            )
            ->when($cursor, fn ($q) => $q->where('created_at', '<', $cursor))
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => $this->mapEvent($row, self::STATUS_SEVERITY[$row->status] ?? 'info'));
    }

    private function getRiderEvents(?string $cursor, int $limit): Collection
    {
        return DB::table('riders')
            ->select(
                'id',
                DB::raw("'rider_availability' as type"),
                'is_available as status',
                DB::raw("'Rider #' || id || ' went ' || CASE WHEN is_available THEN 'available' ELSE 'unavailable' END as message"),
                DB::raw("'rider' as entity_type"),
                'id as entity_id',
                'updated_at as created_at'
            )
            ->when($cursor, fn ($q) => $q->where('updated_at', '<', $cursor))
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => $this->mapEvent($row, 'info'));
    }

    private function getAuditEvents(?string $cursor, int $limit): Collection
    {
        return AuditLog::query()
            ->select(
                'id',
                DB::raw("'dispatch_attempt' as type"),
                'action as status',
                DB::raw("UPPER(SUBSTRING(action, 1, 1)) || SUBSTRING(action, 2) || ' — Order #' || entity_id as message"),
                'entity_type',
                'entity_id',
                'created_at'
            )
            ->whereIn('action', ['dispatched', 'dispatch_failed'])
            ->when($cursor, fn ($q) => $q->where('created_at', '<', $cursor))
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => $this->mapEvent($row, self::AUDIT_SEVERITY[$row->status] ?? 'info'));
    }

    private function mapEvent($row, string $severity): object
    {
        return (object) [
            'id' => $row->id,
            'type' => $row->type,
            'severity' => $severity,
            'message' => $row->message,
            'entity_type' => $row->entity_type,
            'entity_id' => $row->entity_id,
            'created_at' => $row->created_at,
        ];
    }
}
