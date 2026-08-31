<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    private const MAX_QUANTITY = 8;

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->load('cartItems.product');
        $items = $user->cartItems;

        $result = $items->map(function ($ci) {
            return [
                'product_id' => $ci->product_id,
                'product' => $ci->product,
                'quantity' => $ci->quantity,
            ];
        });

        return response()->json(['data' => $result, 'dropped' => []]);
    }

    /**
     * Merge a device draft cart into the authenticated server cart.
     * Quantities for matching products are summed (capped), inactive products
     * are dropped with feedback so the device can replace its draft with the
     * returned merged cart.
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'present|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:' . self::MAX_QUANTITY,
        ]);

        $user = $request->user();
        $dropped = [];

        // Consolidate duplicate product entries in payload
        $consolidated = [];
        foreach ($validated['items'] as $item) {
            $pid = (int) $item['product_id'];
            $consolidated[$pid] = ($consolidated[$pid] ?? 0) + (int) $item['quantity'];
        }

        $merged = DB::transaction(function () use ($user, $consolidated, &$dropped) {
            foreach ($consolidated as $productId => $quantity) {
                $product = Product::find($productId);

                if ($product === null || !$product->is_active) {
                    $dropped[] = ['product_id' => $productId, 'reason' => 'product_unavailable'];
                    continue;
                }

                $capped = min($quantity, self::MAX_QUANTITY);
                $existing = $user->cartItems()->where('product_id', $product->id)->lockForUpdate()->first();

                if ($existing) {
                    $existing->update([
                        'quantity' => min($existing->quantity + $capped, self::MAX_QUANTITY),
                    ]);
                } else {
                    try {
                        $user->cartItems()->create([
                            'product_id' => $product->id,
                            'quantity' => $capped,
                        ]);
                    } catch (\Illuminate\Database\QueryException $e) {
                        // Race: another sync inserted same product, retry as update
                        $retry = $user->cartItems()->where('product_id', $product->id)->first();
                        if ($retry) {
                            $retry->update(['quantity' => min($retry->quantity + $capped, self::MAX_QUANTITY)]);
                        }
                    }
                }
            }

            return $user->cartItems()->with('product')->get()->map(function ($ci) {
                return [
                    'product_id' => $ci->product_id,
                    'product' => $ci->product,
                    'quantity' => $ci->quantity,
                ];
            })->values();
        });

        return response()->json(['data' => $merged, 'dropped' => $dropped]);
    }
}
