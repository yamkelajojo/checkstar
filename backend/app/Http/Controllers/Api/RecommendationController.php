<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $service = new RecommendationService;
        $result = $service->getRecommendations($request->user());

        return response()->json($result);
    }
}
