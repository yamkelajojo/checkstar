<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MediaService;
use App\Services\RecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function __construct(
        private MediaService $media,
        private RecommendationService $recommendations,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $result = $this->recommendations->getRecommendations($request->user());

        // Recommendations render as product cards on the home rail, so they
        // carry the same verified media URLs as the catalogue.
        foreach ($result['recommendations'] as $product) {
            $this->media->applyToProduct($product);
        }

        return response()->json($result);
    }
}
