<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * The customer's saved delivery addresses. Coordinates are mandatory: order
 * intake resolves the fulfilment store from them, so an address without a
 * location can never be selected for delivery.
 */
class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()
            ->orderByDesc('is_default')
            ->orderBy('created_at')
            ->get();

        return response()->json(['data' => $addresses]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request);

        $address = DB::transaction(function () use ($request, $validated) {
            /** @var UserAddress $address */
            $address = $request->user()->addresses()->create($validated);

            // First address becomes the default; an explicit default demotes
            // the previous holder (exactly one default per customer).
            $this->enforceSingleDefault($request->user()->id, $address);

            return $address->refresh();
        });

        return response()->json(['data' => $address], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);
        $validated = $this->validated($request, $address->id);

        DB::transaction(function () use ($request, $address, $validated) {
            $address->update($validated);
            $this->enforceSingleDefault($request->user()->id, $address);
        });

        return response()->json(['data' => $address->refresh()]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);

        if ($address->is_default && $request->user()->addresses()->count() > 1) {
            // Promote the oldest remaining address so a default always exists.
            $next = $request->user()->addresses()->whereKeyNot($address->id)->orderBy('created_at')->first();
            if ($next) {
                $next->update(['is_default' => true]);
            }
        }

        $address->delete();

        return response()->json(['message' => 'Address removed']);
    }

    private function validated(Request $request, ?int $addressId = null): array
    {
        return $request->validate([
            'label' => 'required|string|max:50',
            'contact_name' => 'nullable|string|max:120',
            'contact_phone' => 'nullable|string|max:30',
            'address' => 'required|string|max:500',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'is_default' => 'nullable|boolean',
        ]);
    }

    /**
     * Guarantee at most one default address: the given address owns the flag
     * and every sibling loses it. The first address a customer saves always
     * becomes their default.
     */
    private function enforceSingleDefault(int $userId, UserAddress $address): void
    {
        $isSoleAddress = UserAddress::where('user_id', $userId)->count() === 1;

        if ($address->is_default || $isSoleAddress) {
            UserAddress::where('user_id', $userId)
                ->whereKeyNot($address->id)
                ->where('is_default', true)
                ->update(['is_default' => false]);
            $address->forceFill(['is_default' => true])->save();

            return;
        }

        // Not marked default — make sure SOME default still exists.
        $hasDefault = UserAddress::where('user_id', $userId)->where('is_default', true)->exists();
        if (! $hasDefault) {
            $address->forceFill(['is_default' => true])->save();
        }
    }
}
