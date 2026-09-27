<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RecommendationService
{
    const COLD_START_THRESHOLD = 3;

    const DECAY_HALF_LIFE_DAYS = 14;

    const MAX_CATEGORY_SHARE = 0.4;

    public function getRecommendations(User $customer, int $limit = 20): array
    {
        $interactionCount = DB::table('user_tracking_events')
            ->where('customer_id', $customer->id)
            ->count();

        if ($interactionCount < self::COLD_START_THRESHOLD) {
            return $this->coldStartRecommendations($limit);
        }

        return $this->personalisedRecommendations($customer, $limit);
    }

    private function coldStartRecommendations(int $limit): array
    {
        // Bounded candidate set: cold-start scoring is dominated by
        // freshness (7-day half-life), so the newest window contains every
        // competitive candidate and we never scan the whole catalogue on
        // the app home screen.
        $products = Product::query()
            ->where('is_active', true)
            ->with(['category', 'storeProducts', 'specials'])
            ->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->map(function ($product) {
                $ageDays = max(1, (now()->diffInDays($product->created_at)));
                $freshness = pow(0.5, $ageDays / 7);
                $product->_score = ($product->is_featured ? 0.3 : 0) + $freshness * 0.4 + (1 / $ageDays) * 0.3;
                $product->_isPersonalised = false;

                return $product;
            })
            ->sortByDesc('_score')
            ->take($limit)
            ->values();

        return [
            'recommendations' => $products,
            'isPersonalised' => false,
            'profileSummary' => null,
        ];
    }

    private function personalisedRecommendations(User $customer, int $limit): array
    {
        $categoryAffinity = $this->buildCategoryAffinity($customer->id);
        $viewedProductIds = $this->getViewedProductIds($customer->id);

        // Bounded candidate set that preserves both scoring signals:
        // the most-ordered products (popularity) plus the newest window
        // (freshness). Scoring itself is unchanged.
        $products = Product::query()
            ->where('is_active', true)
            ->with(['category', 'storeProducts', 'specials'])
            ->withCount('orderItems')
            ->orderByDesc('order_items_count')
            ->limit(400)
            ->get()
            ->merge(
                Product::query()
                    ->where('is_active', true)
                    ->with(['category', 'storeProducts', 'specials'])
                    ->withCount('orderItems')
                    ->orderByDesc('created_at')
                    ->limit(200)
                    ->get()
            )->unique('id')
            ->map(function ($product) use ($categoryAffinity, $viewedProductIds) {
                $catId = $product->category_id;
                $categoryMatch = $categoryAffinity[$catId] ?? 0;

                $popularity = min(1.0, $product->order_items_count / 50);

                $ageDays = max(1, now()->diffInDays($product->created_at));
                $freshness = pow(0.5, $ageDays / 7);

                $novelty = in_array($product->id, $viewedProductIds) ? 0.2 : 1.0;

                $product->_score = ($categoryMatch * 0.30) + ($popularity * 0.20) + ($freshness * 0.15) + ($novelty * 0.15);
                $product->_isPersonalised = true;

                return $product;
            })
            ->sortByDesc('_score')
            ->values();

        $diversified = $this->applyDiversity($products, $limit);

        return [
            'recommendations' => $diversified,
            'isPersonalised' => true,
            'profileSummary' => [
                'interactionCount' => DB::table('user_tracking_events')->where('customer_id', $customer->id)->count(),
            ],
        ];
    }

    private function buildCategoryAffinity(int $customerId): array
    {
        // Both tables carry `created_at`, so every column reference has to be
        // qualified or SQLite/MySQL reject the query as ambiguous (the
        // personalised path 500'd for any customer with real history).
        $events = DB::table('user_tracking_events')
            ->join('products', 'user_tracking_events.product_id', '=', 'products.id')
            ->where('user_tracking_events.customer_id', $customerId)
            ->select('products.category_id', 'user_tracking_events.created_at')
            ->orderByDesc('user_tracking_events.created_at')
            ->limit(50)
            ->get();

        $affinity = [];
        foreach ($events as $event) {
            $catId = $event->category_id;
            $ageDays = max(1, now()->diffInDays($event->created_at));
            $decay = pow(0.5, $ageDays / self::DECAY_HALF_LIFE_DAYS);
            $affinity[$catId] = ($affinity[$catId] ?? 0) + $decay;
        }

        $max = max(array_values($affinity) ?: [1]);

        return array_map(fn ($v) => $v / $max, $affinity);
    }

    private function getViewedProductIds(int $customerId): array
    {
        return DB::table('user_tracking_events')
            ->where('customer_id', $customerId)
            ->where('event_type', 'product_view')
            ->whereNotNull('product_id')
            ->pluck('product_id')
            ->toArray();
    }

    /**
     * Item-to-item "related products" for the product page. Signals, in
     * order of weight:
     *  - Same aisle: sharing a category is the strongest "similar item" cue.
     *  - Bought together: products that land in the same orders as this one
     *    (classic market-basket co-purchase signal, bounded candidate set).
     *  - Price proximity: a similar price band feels like a comparable item.
     *  - Popularity: well-ordered products break ties.
     * The product itself and inactive products are never recommended. When
     * scoring leaves the list short it is backfilled with the most-ordered
     * active products so the shelf never renders half-empty.
     *
     * @return \Illuminate\Support\Collection<int, Product>
     */
    public function getRelatedProducts(Product $product, int $limit = 8): \Illuminate\Support\Collection
    {
        // Co-purchase counts for products seen in the same orders as this one.
        $coCounts = DB::table('order_items as a')
            ->join('order_items as b', 'a.order_id', '=', 'b.order_id')
            ->where('a.product_id', $product->id)
            ->where('b.product_id', '!=', $product->id)
            ->select('b.product_id', DB::raw('count(*) as co_count'))
            ->groupBy('b.product_id')
            ->orderByDesc('co_count')
            ->limit(60)
            ->pluck('co_count', 'b.product_id');

        $maxCo = max(1, (int) $coCounts->max());

        $candidates = Product::query()
            ->where('is_active', true)
            ->where('products.id', '!=', $product->id)
            ->with(['category', 'storeProducts', 'specials'])
            ->withCount('orderItems')
            ->orderByDesc('order_items_count')
            ->limit(400)
            ->get();

        $categoryId = $product->category_id;
        $basePrice = max(0.01, (float) ($product->sale_price ?? $product->price));

        $scored = $candidates
            ->map(function (Product $candidate) use ($categoryId, $coCounts, $maxCo, $basePrice) {
                $sameCategory = $candidate->category_id === $categoryId ? 1.0 : 0.0;
                $boughtTogether = min(1.0, (int) ($coCounts[$candidate->id] ?? 0) / $maxCo);

                $candidatePrice = max(0.01, (float) ($candidate->sale_price ?? $candidate->price));
                $priceProximity = 1.0 - min(1.0, abs(log($candidatePrice / $basePrice)) / log(3.0));

                $popularity = min(1.0, $candidate->order_items_count / 50);

                $candidate->_score = ($sameCategory * 0.45)
                    + ($boughtTogether * 0.35)
                    + ($priceProximity * 0.10)
                    + ($popularity * 0.10);

                return $candidate;
            })
            ->sortByDesc('_score')
            ->values();

        if ($scored->count() > $limit) {
            $scored = $scored->slice(0, $limit)->values();
        }

        // Backfill: a sparse aisle shouldn't render a sparse shelf. Most
        // ordered active products first, never duplicating what's chosen.
        if ($scored->count() < $limit) {
            $chosen = $scored->pluck('id')->all();
            $backfill = Product::query()
                ->where('is_active', true)
                ->where('products.id', '!=', $product->id)
                ->whereNotIn('products.id', $chosen)
                ->with(['category', 'storeProducts', 'specials'])
                ->withCount('orderItems')
                ->orderByDesc('order_items_count')
                ->limit($limit - $scored->count())
                ->get()
                ->each(fn (Product $p) => $p->_score = 0.0);

            $scored = $scored->merge($backfill)->values();
        }

        return $scored;
    }

    private function applyDiversity($products, int $limit): array
    {
        $maxPerCategory = ceil($limit * self::MAX_CATEGORY_SHARE);
        $counts = [];
        $result = [];
        $overflow = [];

        foreach ($products as $product) {
            $catId = $product->category_id;
            $counts[$catId] = ($counts[$catId] ?? 0) + 1;

            if ($counts[$catId] <= $maxPerCategory) {
                $result[] = $product;
            } else {
                $overflow[] = $product;
            }

            if (count($result) >= $limit) {
                break;
            }
        }

        $i = 0;
        while (count($result) < $limit && $i < count($overflow)) {
            $result[] = $overflow[$i];
            $i++;
        }

        return array_values(array_slice($result, 0, $limit));
    }
}
