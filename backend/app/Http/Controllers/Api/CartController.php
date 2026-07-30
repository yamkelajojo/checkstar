<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
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

        return response()->json(['data' => $result]);
    }

    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:8',
        ]);

        $user = $request->user();

        foreach ($validated['items'] as $item) {
            $user->cartItems()->updateOrCreate(
                ['product_id' => $item['product_id']],
                ['quantity' => $item['quantity']]
            );
        }

        return response()->json(['message' => 'Cart synced']);
    }
}
