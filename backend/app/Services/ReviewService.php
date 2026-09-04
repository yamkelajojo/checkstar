<?php

namespace App\Services;

use App\Enums\GameEvent;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReviewService
{
    private RiderStatsRecorder $riderStats;

    private GamificationService $gamification;

    public function __construct(RiderStatsRecorder $riderStats, GamificationService $gamification)
    {
        $this->riderStats = $riderStats;
        $this->gamification = $gamification;
    }

    /**
     * Submit a review for a delivered order.
     *
     * @return array{success: bool, message: string, order?: Order}
     */
    public function submitReview(User $reviewer, int $orderId, int $rating, ?string $comment = null): array
    {
        $order = Order::with('rider')->findOrFail($orderId);

        if ($order->rider_id === null) {
            return ['success' => false, 'message' => 'No rider assigned to this order'];
        }

        if ($order->status !== OrderStatus::Delivered) {
            return ['success' => false, 'message' => 'Order must be delivered before reviewing'];
        }

        if ($order->review) {
            return ['success' => false, 'message' => 'Already reviewed'];
        }

        DB::transaction(function () use ($order, $reviewer, $rating, $comment) {
            Review::create([
                'order_id' => $order->id,
                'reviewer_id' => $reviewer->id,
                'rider_id' => $order->rider_id,
                'rating' => $rating,
                'comment' => $comment,
                'created_at' => now(),
            ]);

            $order->rider_rating = $rating;
            $order->rider_review = $comment;
            $order->save();

            $this->riderStats->recordReview($order->rider, $rating);
            $this->gamification->handleEvent($order->rider->fresh(), GameEvent::RatingReceived);
        });

        return ['success' => true, 'message' => 'Review submitted', 'order' => $order->fresh()];
    }
}
