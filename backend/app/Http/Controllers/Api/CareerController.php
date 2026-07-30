<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CareerListing;
use Illuminate\Http\JsonResponse;

class CareerController extends Controller
{
    public function index(): JsonResponse
    {
        $listings = CareerListing::where('is_active', true)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $listings]);
    }
}
