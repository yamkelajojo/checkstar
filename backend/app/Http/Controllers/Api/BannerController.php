<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BannerCreative;
use App\Services\StoreContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    public function __construct(
        private StoreContext $storeContext,
    ) {}

    /**
     * GET /api/banners
     * Public: return active published banners.
     */
    public function index(): JsonResponse
    {
        $banners = BannerCreative::published()
            ->with('store:id,name,slug')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $banners]);
    }

    /**
     * GET /api/admin/banners
     * Admin: list banners scoped to the user's store.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = BannerCreative::with('store:id,name,slug');

        if ($user->role->value === 'developer') {
            // Developers see all banners
        } else {
            $store = $this->storeContext->resolve($user);
            $query->where('store_id', $store->id);
        }

        $banners = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['data' => $banners]);
    }

    /**
     * POST /api/admin/banners
     * Create a new banner.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'store_id' => 'nullable|exists:stores,id',
            'slides' => 'required|array|min:1',
            'slides.*.subtitle' => 'nullable|string',
            'slides.*.title' => 'required|string',
            'slides.*.ctaLabel' => 'nullable|string',
            'slides.*.event' => 'nullable|string',
            'slides.*.url' => 'nullable|string',
            'slides.*.bgType' => 'required|in:solid,gradient,radial',
            'slides.*.colors' => 'required|array|min:1',
            'slides.*.colors.*' => 'string',
            'slides.*.pattern' => 'nullable|string',
            'status' => 'nullable|in:draft,published',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $user = $request->user();

        // Enforce store scoping for non-developers
        if ($user->role->value !== 'developer') {
            $store = $this->storeContext->resolve($user);
            $validated['store_id'] = $store->id;
        }

        $validated['created_by'] = $user->id;
        $validated['status'] = $validated['status'] ?? 'draft';

        $banner = BannerCreative::create($validated);
        $banner->load('store:id,name,slug');

        return response()->json(['data' => $banner], 201);
    }

    /**
     * GET /api/admin/banners/{id}
     * Show a single banner.
     */
    public function show(Request $request, BannerCreative $banner): JsonResponse
    {
        $this->authorizeBanner($request, $banner);

        $banner->load('store:id,name,slug', 'creator:id,name');

        return response()->json(['data' => $banner]);
    }

    /**
     * PUT /api/admin/banners/{id}
     * Update a banner.
     */
    public function update(Request $request, BannerCreative $banner): JsonResponse
    {
        $this->authorizeBanner($request, $banner);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'store_id' => 'nullable|exists:stores,id',
            'slides' => 'sometimes|array|min:1',
            'slides.*.subtitle' => 'nullable|string',
            'slides.*.title' => 'required_with:slides|string',
            'slides.*.ctaLabel' => 'nullable|string',
            'slides.*.event' => 'nullable|string',
            'slides.*.url' => 'nullable|string',
            'slides.*.bgType' => 'required_with:slides|in:solid,gradient,radial',
            'slides.*.colors' => 'required_with:slides|array|min:1',
            'slides.*.colors.*' => 'string',
            'slides.*.pattern' => 'nullable|string',
            'status' => 'sometimes|in:draft,published',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $banner->update($validated);
        $banner->load('store:id,name,slug');

        return response()->json(['data' => $banner]);
    }

    /**
     * DELETE /api/admin/banners/{id}
     * Delete a banner.
     */
    public function destroy(Request $request, BannerCreative $banner): JsonResponse
    {
        $this->authorizeBanner($request, $banner);

        $banner->delete();

        return response()->json(['message' => 'Banner deleted']);
    }

    private function authorizeBanner(Request $request, BannerCreative $banner): void
    {
        $user = $request->user();

        if ($user->role->value === 'developer') {
            return;
        }

        $store = $this->storeContext->resolve($user);

        if ($banner->store_id !== $store->id) {
            abort(403, 'Unauthorized to access this banner');
        }
    }
}
