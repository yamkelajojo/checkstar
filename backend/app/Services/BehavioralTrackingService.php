<?php

namespace App\Services;

use App\Models\BehavioralSignal;
use Illuminate\Support\Facades\Log;

/**
 * BehavioralTrackingService — Fire-and-forget behavioral signal capture.
 *
 * Captures explicit intent signals (contact, save, search) and behavioral
 * signals (view duration, repeat views) without blocking user flows.
 * Silent failures only: tracking errors never break the delivery experience.
 */
class BehavioralTrackingService
{
    const SIGNAL_WEIGHTS = [
        'contact' => 5.0,
        'save' => 3.0,
        'search' => 2.5,
        'category_filter' => 1.5,
        'long_view' => 2.0,
        'short_view' => 1.0,
        'repeat_view' => 3.0,
        'bounce' => -0.5,
        'unsave' => -1.0,
    ];

    public function capture(string $signal, array $context = []): void
    {
        try {
            $this->storeSignal($signal, $context);
        } catch (\Exception $e) {
            // Fire-and-forget: tracking failures must never break UX.
            Log::debug('[BehavioralTracking] Silent failure', [
                'signal' => $signal,
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function storeSignal(string $signal, array $context): void
    {
        $customerId = $context['customer_id'] ?? null;

        BehavioralSignal::create([
            'customer_id' => $customerId,
            'signal' => $signal,
            'weight' => self::SIGNAL_WEIGHTS[$signal] ?? 0,
            'context' => collect($context)->except('customer_id')->all() ?: null,
        ]);
    }

    public function getSignalWeight(string $signal): float
    {
        return self::SIGNAL_WEIGHTS[$signal] ?? 0.0;
    }
}
