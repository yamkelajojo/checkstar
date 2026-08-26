<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CommunityPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityPostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->has('per_page') ? max(1, min((int) $request->query('per_page'), 100)) : 50;
        $paginator = CommunityPost::orderByDesc('created_at')->paginate($perPage);
        if ($request->has('per_page') || $request->has('page')) {
            return response()->json($paginator);
        }
        return response()->json(['data' => $paginator->items(), 'meta' => [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:community_posts',
            'content' => 'nullable|string',
            'image' => 'nullable|string|max:255',
            'category' => 'required|string|in:gallery,csr',
            'event_date' => 'nullable|date',
            'is_published' => 'boolean',
        ]);

        return response()->json(['data' => CommunityPost::create($validated)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $post = CommunityPost::findOrFail($id);

        $validated = $request->validate([
            'title' => 'string|max:255',
            'slug' => 'string|max:255|unique:community_posts,slug,' . $id,
            'content' => 'nullable|string',
            'image' => 'nullable|string|max:255',
            'category' => 'string|in:gallery,csr',
            'event_date' => 'nullable|date',
            'is_published' => 'boolean',
        ]);

        $post->update($validated);

        return response()->json(['data' => $post]);
    }

    public function destroy(int $id): JsonResponse
    {
        CommunityPost::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
