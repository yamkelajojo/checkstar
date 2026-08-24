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
                'product' => $ci->product,
                'quantity' => $ci->quantity,
                'store_product_id' => $ci->store_product_id,
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

        $merged = DB::transaction(function () use ($user, $validated, &$dropped) {
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);

                if ($product === null || !$product->is_active) {
                    $dropped[] = ['product_id' => $item['product_id'], 'reason' => 'product_unavailable'];
                    continue;
                }

                $existing = $user->cartItems()->where('product_id', $product->id)->first();

                if ($existing) {
                    $existing->update([
                        'quantity' => min($existing->quantity + $item['quantity'], self::MAX_QUANTITY),
                    ]);
                } else {
                    $user->cartItems()->create([
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                    ]);
                }
            }

            return $user->cartItems()->with('product')->get()->map(function ($ci) {
                return [
                    'product_id' => $ci->product_id,
                    'product' => $ci->product,
                    'quantity' => $ci->quantity,
                    'store_product_id' => $ci->store_product_id,
                ];
            })->values();
        });

        return response()->json(['data' => $merged, 'dropped' => $dropped]);
    }
}
