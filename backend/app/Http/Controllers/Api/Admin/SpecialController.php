<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Special;
use App\Services\StoreContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Sale (Special) management for store operators.
 *
 * Roles: developer (any store, or chain-wide), store_owner / store_manager
 * (own store only, enforced via StoreContext). A sale is created together
 * with its products and optional per-product special prices, and a banner
 * can be linked to front it on the home page.
 */
class SpecialController extends Controller
{
    public function __construct(
        private StoreContext $storeContext,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        // No product column constraint: a constrained eager load drops the
        // product_special pivot (special_price), which the admin product
        // picker needs to prefill existing sale prices.
        $query = Special::with(['products', 'store:id,name,slug']);

        if ($user->role->value !== UserRole::Developer->value) {
            $query->where('store_id', $this->storeContext->resolve($user)->id);
        }

        $perPage = $request->has('per_page') ? max(1, min((int) $request->query('per_page'), 100)) : 50;
        $paginator = $query->orderByDesc('created_at')->paginate($perPage);

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
            'slug' => 'required|string|max:255|unique:specials,slug',
            'description' => 'nullable|string',
            'banner_image' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
            'store_id' => 'nullable|exists:stores,id',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $validated['store_id'] = $this->resolveStoreId($request, $validated['store_id'] ?? null);
        $validated['is_active'] = $validated['is_active'] ?? true;

        $special = Special::create($validated);
        $special->load(['products', 'store:id,name,slug']);

        return response()->json(['data' => $special], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $special = $this->own($request, Special::findOrFail($id));
        $special->load(['products', 'store:id,name,slug', 'banner:id,name,status']);

        return response()->json(['data' => $special]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $special = $this->own($request, Special::findOrFail($id));

        $validated = $request->validate([
            'title' => 'string|max:255',
            'slug' => 'string|max:255|unique:specials,slug,'.$id,
            'description' => 'nullable|string',
            'banner_image' => 'nullable|string|max:255',
            'start_date' => 'date',
            'end_date' => 'date|after:start_date',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        // A store operator cannot move their sale to another store.
        unset($validated['store_id']);

        $special->update($validated);
        $special->load(['products:id,name,slug,price,sale_price,unit', 'store:id,name,slug']);

        return response()->json(['data' => $special]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $special = $this->own($request, Special::findOrFail($id));
        $special->delete(); // pivot rows + linked banner cascade (nullOnDelete)

        return response()->json(['message' => 'Deleted']);
    }

    /**
     * PUT /admin/specials/{id}/products
     *
     * Idempotent full sync of a sale's products:
     *   { "products": [{ "product_id": 3, "special_price": 29.99 }, …] }
     *
     * - products in the payload are attached (or re-priced)
     * - products missing from the payload are detached
     * - `special_price` is optional; omitted = keep the previously stored
     *   pivot price, or none (the product's own price then applies)
     */
    public function syncProducts(Request $request, int $id): JsonResponse
    {
        $special = $this->own($request, Special::findOrFail($id));

        $validated = $request->validate([
            'products' => 'present|array',
            'products.*.product_id' => 'required|integer|exists:products,id',
            'products.*.special_price' => 'nullable|numeric|min:0',
        ]);

        // Previously stored pivot prices, keyed by product_id.
        $existing = $special->products()
            ->select('product_id', 'special_price')
            ->pluck('special_price', 'product_id');

        $attach = [];
        foreach ($validated['products'] as $entry) {
            $productId = (int) $entry['product_id'];

            if (isset($entry['special_price'])) {
                $attach[$productId] = ['special_price' => (float) $entry['special_price']];
            } elseif ($existing->has($productId) && $existing->get($productId) !== null) {
                $attach[$productId] = ['special_price' => (float) $existing->get($productId)];
            } else {
                $attach[$productId] = [];
            }
        }

        DB::transaction(function () use ($special, $attach): void {
            // Detach-all + re-attach: a repeated sync never leaves stale rows.
            $special->products()->detach();
            foreach ($attach as $productId => $pivot) {
                $special->products()->attach($productId, $pivot);
            }
        });

        $special->load('products');

        return response()->json(['data' => $special]);
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    /**
     * store_id handling: developers may omit it (chain-wide) or target any
     * store; everyone else is locked to their own store and can never
     * write another store's id.
     */
    private function resolveStoreId(Request $request, ?int $store_id): ?int
    {
        $user = $request->user();

        if ($user->role->value === UserRole::Developer->value) {
            return $store_id; // null = chain-wide
        }

        return $this->storeContext->resolve($user)->id;
    }

    /** 403 unless the user may act on this sale. Returns the sale. */
    private function own(Request $request, Special $special): Special
    {
        $user = $request->user();

        if ($user->role->value !== UserRole::Developer->value) {
            $store = $this->storeContext->resolve($user);
            if ((int) $special->store_id !== (int) $store->id) {
                abort(403, 'Unauthorized to access this sale');
            }
        }

        return $special;
    }
}
