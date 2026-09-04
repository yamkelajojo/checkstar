<?php

namespace App\Services;

use App\Models\UserTrackingEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TrackingService
{
    private const VALID_EVENT_TYPES = [
        'product_view',
        'search',
        'add_to_cart',
        'remove_from_cart',
        'checkout',
    ];

    private const MAX_BATCH_SIZE = 50;

    private const MAX_SEARCH_LENGTH = 255;

    private const PII_PATTERNS = [
        '/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/',
        '/\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/',
    ];

    public function store(
        int $customerId,
        string $eventType,
        ?int $productId = null,
        ?string $searchQuery = null,
        array $metadata = []
    ): ?UserTrackingEvent {
        if (! in_array($eventType, self::VALID_EVENT_TYPES, true)) {
            Log::debug('[TrackingService] Invalid event_type', ['event_type' => $eventType]);

            return null;
        }

        $sanitizedMetadata = $this->sanitizeMetadata($metadata);
        $sanitizedQuery = $searchQuery ? $this->sanitizeSearchQuery($searchQuery) : null;

        try {
            return UserTrackingEvent::create([
                'customer_id' => $customerId,
                'event_type' => $eventType,
                'product_id' => $productId,
                'search_query' => $sanitizedQuery,
                'metadata' => $sanitizedMetadata,
            ]);
        } catch (\Exception $e) {
            Log::debug('[TrackingService] Silent failure', [
                'event_type' => $eventType,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function storeBatch(int $customerId, array $events): int
    {
        $stored = 0;
        $batch = array_slice($events, 0, self::MAX_BATCH_SIZE);

        DB::transaction(function () use ($customerId, $batch, &$stored) {
            foreach ($batch as $event) {
                $result = $this->store(
                    $customerId,
                    $event['event_type'] ?? '',
                    $event['product_id'] ?? null,
                    $event['search_query'] ?? null,
                    $event['metadata'] ?? []
                );
                if ($result) {
                    $stored++;
                }
            }
        });

        return $stored;
    }

    private function sanitizeMetadata(array $metadata): array
    {
        $sanitized = [];
        foreach ($metadata as $key => $value) {
            if (is_string($value)) {
                foreach (self::PII_PATTERNS as $pattern) {
                    $value = preg_replace($pattern, '[REDACTED]', $value);
                }
            }
            $sanitized[$key] = $value;
        }

        return $sanitized;
    }

    private function sanitizeSearchQuery(string $query): string
    {
        $query = substr($query, 0, self::MAX_SEARCH_LENGTH);
        foreach (self::PII_PATTERNS as $pattern) {
            $query = preg_replace($pattern, '[REDACTED]', $query);
        }

        return $query;
    }
}
