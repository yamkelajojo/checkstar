<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CommunityPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityPostController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => CommunityPost::orderByDesc('created_at')->get()]);
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
