<?php

use App\Models\BannerCreative;
use App\Models\Special;
use Illuminate\Database\Migrations\Migration;

/**
 * Link pre-existing banners that point at the generic /specials page to the
 * actual sale they advertise.
 *
 * Only banners whose slides contain a '/specials' CTA are touched, and only
 * when exactly one sale exists (the seeded "Winter Warmers Sale" slide
 * advertises the `winter-warmers` special). With multiple sales the mapping
 * is ambiguous, so the banner is left standalone for a human to link.
 */
return new class extends Migration
{
    public function up(): void
    {
        $banners = BannerCreative::whereNull('special_id')->get();

        foreach ($banners as $banner) {
            $slides = $banner->slides ?? [];
            $pointsAtSpecials = collect($slides)
                ->filter(fn ($slide) => isset($slide['url']) && str_contains((string) $slide['url'], '/specials'))
                ->isNotEmpty();

            if (! $pointsAtSpecials) {
                continue;
            }

            // Prefer the seeded winter sale; otherwise link when unambiguous.
            $special = Special::where('slug', 'winter-warmers')->first()
                ?? (Special::count() === 1 ? Special::first() : null);

            if ($special === null) {
                continue;
            }

            // Keep the CTA url concrete so older clients land on the sale.
            foreach ($slides as $i => $slide) {
                if (isset($slide['url']) && str_contains((string) $slide['url'], '/specials')) {
                    $slides[$i]['url'] = '/specials/'.$special->slug;
                }
            }

            $banner->forceFill([
                'special_id' => $special->id,
                'slides' => $slides,
            ])->save();
        }
    }

    public function down(): void
    {
        BannerCreative::whereNotNull('special_id')->update(['special_id' => null]);
    }
};
