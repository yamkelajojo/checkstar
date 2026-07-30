<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;

class StoreController extends Controller
{
    public function index(): JsonResponse
    {
        $stores = Store::where('is_active', true)->get();

        return response()->json(['data' => $stores]);
    }

    public function show(string $slug): JsonResponse
    {
        $store = Store::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        return response()->json(['data' => $store]);
    }
}
