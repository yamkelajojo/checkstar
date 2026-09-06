<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->has('per_page') ? max(1, min((int) $request->query('per_page'), 100)) : 50;
        $paginator = ContactMessage::with('user')->orderByDesc('created_at')->paginate($perPage);
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

    public function show(int $id): JsonResponse
    {
        $message = ContactMessage::findOrFail($id);
        $message->update(['is_read' => true]);

        return response()->json(['data' => $message]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'read' => 'sometimes|boolean',
        ]);

        $message = ContactMessage::findOrFail($id);
        $message->update([
            'is_read' => (bool) ($validated['read'] ?? ! $message->is_read),
        ]);

        return response()->json(['data' => $message]);
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        $message = ContactMessage::findOrFail($id);
        $message->update([
            'reply_body' => $validated['body'],
            'replied_at' => now(),
            'is_read' => true,
        ]);

        return response()->json(['data' => $message->fresh()]);
    }
}
