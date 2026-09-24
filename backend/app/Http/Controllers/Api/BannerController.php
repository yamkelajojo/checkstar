<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\BannerCreative;
use App\Models\Special;
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
     * Public: return active published banners, each with a `special` summary
     * (id/slug/title) when the banner fronts a sale — clients deep-link to
     * the sale's products instead of a free-text URL.
     */
    public function index(): JsonResponse
    {
        $banners = BannerCreative::published()
            ->with(['store:id,name,slug', 'special:id,slug,title'])
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
        $query = BannerCreative::with(['store:id,name,slug', 'special:id,slug,title']);

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
     * Create a new banner — either standalone or linked to a sale
     * (`special_id`). Linked banners get their slide CTA normalised to the
     * sale's public path so every client lands on the sale's products.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules(create: true));

        $user = $request->user();

        // Enforce store scoping for non-developers
        if ($user->role->value !== 'developer') {
            $store = $this->storeContext->resolve($user);
            $validated['store_id'] = $store->id;
        }

        if (isset($validated['special_id']) && $validated['special_id'] !== null) {
            $this->authorizeSpecial($user, Special::findOrFail($validated['special_id']));
            $validated['slides'] = $this->withSaleCta($validated['slides'], $validated['special_id']);
        }

        $validated['created_by'] = $user->id;
        $validated['status'] = $validated['status'] ?? 'draft';

        $banner = BannerCreative::create($validated);
        $banner->load('store:id,name,slug', 'special:id,slug,title');

        return response()->json(['data' => $banner], 201);
    }

    /**
     * GET /api/admin/banners/{id}
     * Show a single banner.
     */
    public function show(Request $request, BannerCreative $banner): JsonResponse
    {
        $this->authorizeBanner($request, $banner);

        $banner->load('store:id,name,slug', 'creator:id,name', 'special:id,slug,title');

        return response()->json(['data' => $banner]);
    }

    /**
     * PUT /api/admin/banners/{id}
     * Update a banner.
     */
    public function update(Request $request, BannerCreative $banner): JsonResponse
    {
        $this->authorizeBanner($request, $banner);

        $validated = $request->validate($this->rules(create: false));

        // Same tenant guard as store(): a non-developer can never move a
        // banner into another store's rotation by passing store_id.
        $user = $request->user();
        if ($user->role->value !== 'developer') {
            $validated['store_id'] = $this->storeContext->resolve($user)->id;
        }

        if (array_key_exists('special_id', $validated) && $validated['special_id'] !== null) {
            $this->authorizeSpecial($user, Special::findOrFail($validated['special_id']));
            if (array_key_exists('slides', $validated)) {
                $validated['slides'] = $this->withSaleCta($validated['slides'], $validated['special_id']);
            }
        }

        $banner->update($validated);
        $banner->load('store:id,name,slug', 'special:id,slug,title');

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

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    /** Shared slide validation rules for create/update. */
    private function rules(bool $create): array
    {
        return [
            'name' => $create ? 'required|string|max:255' : 'sometimes|string|max:255',
            'store_id' => 'nullable|exists:stores,id',
            'special_id' => 'nullable|exists:specials,id',
            'slides' => ($create ? 'required' : 'sometimes').'|array|min:1',
            'slides.*.subtitle' => 'nullable|string',
            'slides.*.title' => 'required|string',
            'slides.*.ctaLabel' => 'nullable|string',
            'slides.*.event' => 'nullable|string',
            'slides.*.url' => 'nullable|string',
            'slides.*.image' => 'nullable|string|max:255',
            'slides.*.bgType' => 'required|in:solid,gradient,radial',
            'slides.*.colors' => 'required|array|min:1',
            'slides.*.colors.*' => 'string',
            'slides.*.pattern' => 'nullable|string',
            'status' => 'nullable|in:draft,published',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ];
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

    /**
     * A store operator may only link their own store's sale (or a
     * chain-wide sale). Developers may link any.
     */
    private function authorizeSpecial($user, Special $special): void
    {
        if ($user->role->value === UserRole::Developer->value) {
            return;
        }

        if ($special->store_id !== null && (int) $special->store_id !== (int) $this->storeContext->resolve($user)->id) {
            abort(403, 'Unauthorized to link this sale');
        }
    }

    /** Force each slide's CTA to the linked sale's public path. */
    private function withSaleCta(array $slides, int $specialId): array
    {
        $special = Special::findOrFail($specialId);

        foreach ($slides as $i => $slide) {
            $slides[$i]['url'] = '/specials/'.$special->slug;
        }

        return $slides;
    }
}
