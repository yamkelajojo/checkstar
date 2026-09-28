<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Owner decision (2026-09-28): the 29 "South African pantry" products were
 * added without sign-off solely so recipe ingredients would have something to
 * link to. The catalogue must stay the original products_dataset inventory.
 * Recipe ingredients simply render without a product link when no matching
 * product exists — that is acceptable by design.
 *
 * The SouthAfricanPantrySeeder that created these rows has been removed from
 * the codebase, but databases seeded before that removal still contain the
 * products, so this migration deletes them (and every row that references
 * them). It is idempotent: on a database that never had these products it is
 * a no-op.
 *
 * Deletion order matters: on MySQL/MariaDB/Postgres the order_items and
 * store_product foreign keys were re-created as RESTRICT by
 * 2026_09_05_000001_restrict_history_foreign_keys, so those rows must go
 * first. Ephemeral rows (carts, favourites) cascade anyway and tracking
 * events null their product reference; they are still handled explicitly so
 * the migration is self-contained on every driver.
 *
 * Note: any seeded demo order_items that happened to reference one of these
 * products are removed with them (order totals are demo figures generated
 * independently of their items, see OrderSeeder).
 */
return new class extends Migration
{
    /**
     * Slugs of the 29 products introduced by the removed
     * SouthAfricanPantrySeeder.
     *
     * @var list<string>
     */
    private const SLUGS = [
        // Pantry staples
        'snowflake-cake-wheat-flour-2-5kg',
        'selati-white-sugar-2kg',
        'selati-light-brown-sugar-1kg',
        'anchor-instant-yeast-10g',
        'sunfoil-sunflower-oil-750ml',
        'robertsons-baking-powder-100g',
        'robertsons-bicarbonate-of-soda-100g',
        'cerebos-iodated-table-salt-500g',
        'all-gold-smooth-apricot-jam-450g',
        'heinz-white-spirit-vinegar-750ml',
        'robertsons-ground-cinnamon-40g',
        'robertsons-ground-ginger-40g',
        'rajah-mild-and-spicy-durban-curry-powder-80g',
        'robertsons-vanilla-essence-40ml',
        'nestle-golden-syrup-500g',
        'coconut-milk-400ml',
        // Dairy & eggs
        'free-range-eggs-6-pack',
        'clover-fresh-cream-250ml',
        'clover-whipping-cream-500ml',
        'nestle-caramel-treat-360g',
        // Snacks & treats
        'bakers-tennis-biscuits-200g',
        'nestle-peppermint-crisp-chocolate-bar-49g',
        'cadbury-dairy-milk-peppermint-crisp-80g',
        // Fruits & vegetables
        'onions-1kg',
        'tomatoes-1kg',
        'potatoes-2kg',
        'garlic-3-pack',
        'fresh-ginger-100g',
        'lemons-1kg',
    ];

    /**
     * Full product definitions, kept so the migration can be rolled back.
     * Shape: [slug, name, category slug, unit, price, tags].
     *
     * @var list<array{string, string, string, string, float, list<string>}>
     */
    private const PRODUCTS = [
        ['snowflake-cake-wheat-flour-2-5kg', 'Snowflake Cake Wheat Flour 2.5kg', 'pantry-staples', '2.5kg', 49.99, ['flour', 'baking', 'cake']],
        ['selati-white-sugar-2kg', 'Selati White Sugar 2kg', 'pantry-staples', '2kg', 42.99, ['sugar', 'baking']],
        ['selati-light-brown-sugar-1kg', 'Selati Light Brown Sugar 1kg', 'pantry-staples', '1kg', 32.99, ['sugar', 'brown', 'baking']],
        ['anchor-instant-yeast-10g', 'Anchor Instant Yeast 10g', 'pantry-staples', '10g', 8.99, ['yeast', 'baking']],
        ['sunfoil-sunflower-oil-750ml', 'Sunfoil Sunflower Oil 750ml', 'pantry-staples', '750ml', 39.99, ['oil', 'cooking']],
        ['robertsons-baking-powder-100g', 'Robertsons Baking Powder 100g', 'pantry-staples', '100g', 18.99, ['baking', 'powder']],
        ['robertsons-bicarbonate-of-soda-100g', 'Robertsons Bicarbonate of Soda 100g', 'pantry-staples', '100g', 16.99, ['baking', 'soda', 'bicarb']],
        ['cerebos-iodated-table-salt-500g', 'Cerebos Iodated Table Salt 500g', 'pantry-staples', '500g', 14.99, ['salt']],
        ['all-gold-smooth-apricot-jam-450g', 'All Gold Smooth Apricot Jam 450g', 'pantry-staples', '450g', 34.99, ['jam', 'apricot']],
        ['heinz-white-spirit-vinegar-750ml', 'Heinz White Spirit Vinegar 750ml', 'pantry-staples', '750ml', 26.99, ['vinegar']],
        ['robertsons-ground-cinnamon-40g', 'Robertsons Ground Cinnamon 40g', 'pantry-staples', '40g', 22.99, ['cinnamon', 'spice']],
        ['robertsons-ground-ginger-40g', 'Robertsons Ground Ginger 40g', 'pantry-staples', '40g', 21.99, ['ginger', 'spice']],
        ['rajah-mild-and-spicy-durban-curry-powder-80g', 'Rajah Mild & Spicy Durban Curry Powder 80g', 'pantry-staples', '80g', 24.99, ['curry', 'durban', 'masala', 'spice']],
        ['robertsons-vanilla-essence-40ml', 'Robertsons Vanilla Essence 40ml', 'pantry-staples', '40ml', 19.99, ['vanilla', 'essence']],
        ['nestle-golden-syrup-500g', 'Nestlé Golden Syrup 500g', 'pantry-staples', '500g', 38.99, ['syrup', 'golden']],
        ['coconut-milk-400ml', 'Coconut Milk 400ml', 'pantry-staples', '400ml', 28.99, ['coconut', 'milk']],
        ['free-range-eggs-6-pack', 'Free Range Eggs 6 Pack', 'dairy-eggs', '6 pack', 39.99, ['eggs']],
        ['clover-fresh-cream-250ml', 'Clover Fresh Cream 250ml', 'dairy-eggs', '250ml', 32.99, ['cream', 'fresh']],
        ['clover-whipping-cream-500ml', 'Clover Whipping Cream 500ml', 'dairy-eggs', '500ml', 54.99, ['cream', 'whipping']],
        ['nestle-caramel-treat-360g', 'Nestlé Caramel Treat 360g', 'dairy-eggs', '360g', 36.99, ['caramel', 'condensed', 'treat']],
        ['bakers-tennis-biscuits-200g', 'Bakers Tennis Biscuits 200g', 'snacks-treats', '200g', 24.99, ['biscuit', 'tennis', 'coconut']],
        ['nestle-peppermint-crisp-chocolate-bar-49g', 'Nestlé Peppermint Crisp Chocolate Bar 49g', 'snacks-treats', '49g', 18.99, ['chocolate', 'peppermint', 'crisp']],
        ['cadbury-dairy-milk-peppermint-crisp-80g', 'Cadbury Dairy Milk Peppermint Crisp 80g', 'snacks-treats', '80g', 22.99, ['chocolate', 'peppermint']],
        ['onions-1kg', 'Onions 1kg', 'fruits-vegetables', '1kg', 22.99, ['onion']],
        ['tomatoes-1kg', 'Tomatoes 1kg', 'fruits-vegetables', '1kg', 29.99, ['tomato']],
        ['potatoes-2kg', 'Potatoes 2kg', 'fruits-vegetables', '2kg', 39.99, ['potato']],
        ['garlic-3-pack', 'Garlic 3 Pack', 'fruits-vegetables', '3 pack', 19.99, ['garlic']],
        ['fresh-ginger-100g', 'Fresh Ginger 100g', 'fruits-vegetables', '100g', 16.99, ['ginger', 'fresh']],
        ['lemons-1kg', 'Lemons 1kg', 'fruits-vegetables', '1kg', 32.99, ['lemon']],
    ];

    public function up(): void
    {
        $ids = DB::table('products')
            ->whereIn('slug', self::SLUGS)
            ->pluck('id');

        if ($ids->isEmpty()) {
            return;
        }

        // History-bearing references first (RESTRICT on MySQL/MariaDB/Postgres).
        if (Schema::hasTable('order_items')) {
            DB::table('order_items')->whereIn('product_id', $ids)->delete();
        }

        if (Schema::hasTable('store_product')) {
            DB::table('store_product')->whereIn('product_id', $ids)->delete();
        }

        // Remaining references (cascade/nullOnDelete anyway, handled
        // explicitly so the order above stays sufficient on every driver).
        if (Schema::hasTable('product_special')) {
            DB::table('product_special')->whereIn('product_id', $ids)->delete();
        }

        if (Schema::hasTable('cart_items')) {
            DB::table('cart_items')->whereIn('product_id', $ids)->delete();
        }

        if (Schema::hasTable('product_favorites')) {
            DB::table('product_favorites')->whereIn('product_id', $ids)->delete();
        }

        if (Schema::hasTable('user_tracking_events')) {
            DB::table('user_tracking_events')->whereIn('product_id', $ids)->update(['product_id' => null]);
        }

        // Hard delete on purpose: these products must be gone for good, even
        // if one was soft-deleted through the admin in the meantime.
        DB::table('products')->whereIn('id', $ids)->delete();
    }

    public function down(): void
    {
        $categoryIds = DB::table('categories')
            ->whereIn('slug', array_unique(array_column(self::PRODUCTS, 2)))
            ->pluck('id', 'slug');

        $storeIds = DB::table('stores')->where('is_active', true)->pluck('id');
        $now = now();

        foreach (self::PRODUCTS as [$slug, $name, $categorySlug, $unit, $price, $tags]) {
            $categoryId = $categoryIds->get($categorySlug);

            if ($categoryId === null) {
                continue;
            }

            $image = 'products/'.$categorySlug.'/'.$slug.'.webp';

            $productId = DB::table('products')->insertGetId([
                'category_id' => $categoryId,
                'name' => $name,
                'slug' => $slug,
                'image' => $image,
                'images' => json_encode([$image]),
                'unit' => $unit,
                'price' => $price,
                'sale_price' => null,
                'tags' => json_encode($tags),
                'is_featured' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($storeIds as $storeId) {
                DB::table('store_product')->insert([
                    'store_id' => $storeId,
                    'product_id' => $productId,
                    'stock_quantity' => 300,
                    'reserved_quantity' => 0,
                    'is_available' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
};
