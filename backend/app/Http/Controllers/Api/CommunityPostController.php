<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityPostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CommunityPost::where('is_published', true);

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $posts = $query->orderByDesc('event_date')->get();

        return response()->json(['data' => $posts]);
    }
}
