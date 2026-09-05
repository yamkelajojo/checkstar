<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate(['code' => 'required|string']);

        $promo = Promotion::where('code', strtoupper(trim($validated['code'])))
            ->where('is_active', true)
            ->first();

        if (! $promo) {
            return response()->json(['error' => 'Invalid promo code'], 404);
        }

        if ($promo->expires_at && $promo->expires_at->isPast()) {
            return response()->json(['error' => 'Code expired'], 422);
        }

        if ($promo->max_uses !== null && $promo->used_count >= $promo->max_uses) {
            return response()->json(['error' => 'Code fully redeemed'], 422);
        }

        $subtotalCents = (int) $request->input('subtotal_cents', 0);

        if ($subtotalCents < $promo->min_order_cents) {
            return response()->json([
                'error' => 'Minimum order amount not met',
                'min_order_cents' => $promo->min_order_cents,
            ], 422);
        }

        if ($promo->type === 'percentage') {
            $discountCents = (int) ($subtotalCents * $promo->value / 100);
        } else {
            $discountCents = min($promo->value, $subtotalCents);
        }

        $newTotalCents = max(0, $subtotalCents - $discountCents);

        return response()->json([
            'valid' => true,
            'discount_type' => $promo->type,
            'discount_value' => $promo->value,
            'discount_cents' => $discountCents,
            'new_total_cents' => $newTotalCents,
            'code' => $promo->code,
        ]);
    }

    public function apply(Request $request): JsonResponse
    {
        $validated = $request->validate(['code' => 'required|string']);

        $promo = Promotion::where('code', strtoupper(trim($validated['code'])))
            ->where('is_active', true)
            ->first();

        if (! $promo) {
            return response()->json(['error' => 'Invalid code'], 404);
        }

        if ($promo->expires_at && $promo->expires_at->isPast()) {
            return response()->json(['error' => 'Code expired'], 422);
        }

        // Atomic bounded redemption: a single conditional UPDATE can never
        // push used_count past max_uses, no matter how many requests race
        // here. (A lockForUpdate without a surrounding transaction releases
        // at implicit autocommit — it protects nothing — and an unchecked
        // increment() overshoots the cap under concurrency.)
        $redeemed = Promotion::where('id', $promo->id)
            ->when($promo->max_uses !== null, fn ($query) => $query->where('used_count', '<', $promo->max_uses))
            ->increment('used_count');

        if ($redeemed === 0) {
            return response()->json(['error' => 'Code fully redeemed'], 422);
        }

        return response()->json(['success' => true, 'code' => $promo->code]);
    }
}
