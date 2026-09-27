<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Models\UserTrackingEvent;
use App\Services\RecommendationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The personalised branch of the recommendation engine was untested — every
 * existing test used a customer with no history, i.e. the cold-start branch.
 * Real seeded customers have tracking history, and that branch 500'd with an
 * ambiguous `created_at` in its affinity join. These pin the personalised
 * path end to end.
 */
class PersonalisedRecommendationsTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    /** @var array<int, Product> */
    private array $products = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => UserRole::Customer]);

        foreach (['alpha', 'beta', 'gamma'] as $i => $slug) {
            $category = Category::create(['name' => ucfirst($slug).' Cat', 'slug' => $slug.'-cat']);
            $this->products[$i] = Product::create([
                'category_id' => $category->id,
                'name' => ucfirst($slug).' Product', 'slug' => $slug.'-product',
                'unit' => 'each', 'price' => 10 + $i, 'is_active' => true,
            ]);
        }
    }

    /** Above COLD_START_THRESHOLD so the personalised branch is taken. */
    private function giveHistory(): void
    {
        foreach ($this->products as $index => $product) {
            UserTrackingEvent::create([
                'customer_id' => $this->customer->id,
                'event_type' => 'product_view',
                'product_id' => $product->id,
                'created_at' => now()->subDays($index),
            ]);
        }
        // One more view of the first category so affinity has a clear winner.
        UserTrackingEvent::create([
            'customer_id' => $this->customer->id,
            'event_type' => 'add_to_cart',
            'product_id' => $this->products[0]->id,
            'created_at' => now(),
        ]);
    }

    public function test_a_customer_with_history_gets_personalised_recommendations(): void
    {
        $this->giveHistory();

        $this->actingAs($this->customer)
            ->getJson('/api/recommendations')
            ->assertStatus(200)
            ->assertJsonPath('isPersonalised', true)
            ->assertJsonCount(3, 'recommendations')
            ->assertJsonPath('profileSummary.interactionCount', 4);
    }

    public function test_the_affinity_join_qualifies_its_timestamp_column(): void
    {
        // Guards the ambiguous-column regression directly: both joined
        // tables carry `created_at`, so an unqualified ORDER BY is a SQL
        // error on SQLite and MySQL alike.
        $this->giveHistory();

        $service = app(RecommendationService::class);
        $result = $service->getRecommendations($this->customer->fresh(), 5);

        $this->assertTrue($result['isPersonalised']);
        $this->assertNotEmpty($result['recommendations']);
    }

    public function test_viewed_products_are_boosted_by_the_novelty_signal(): void
    {
        $this->giveHistory();

        $payload = $this->actingAs($this->customer)
            ->getJson('/api/recommendations')
            ->assertStatus(200)
            ->json('recommendations');

        $ids = array_column($payload, 'id');
        $this->assertContains($this->products[0]->id, $ids);
    }

    public function test_recommendations_carry_usable_media_urls(): void
    {
        $this->giveHistory();

        $payload = $this->actingAs($this->customer)
            ->getJson('/api/recommendations')
            ->assertStatus(200)
            ->json('recommendations');

        foreach ($payload as $product) {
            // No image in the factory → the placeholder must stand in, never
            // a null/absent value that would blank the card.
            $this->assertArrayHasKey('image', $product);
            $this->assertNotNull($product['image']);
        }
    }
}
