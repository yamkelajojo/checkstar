<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Special;
use Illuminate\Http\JsonResponse;

class SpecialController extends Controller
{
    public function index(): JsonResponse
    {
        $specials = Special::where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->with('products')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $specials]);
    }
}
