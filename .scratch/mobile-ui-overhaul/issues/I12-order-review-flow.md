# I12 — Order Review Flow Integration Test

**What to build:** Customer can rate (1–5 stars) and comment on delivered order via inline `ReviewCard` in `OrderDetailScreen`. Submits via `reviewOrder` API, shows success toast, refreshes order.

**Seam Under Test:** `ReviewCard` component + `reviewOrder` API + `OrderDetailScreen` reviewable state

**Blocked by:** I06, I11, 06c, 06b, 07a, 09b

**Status:** ready-for-agent

- [ ] Reviewable condition: `canReview(order.status, order.rider_rating)` → `true` only when `status === 'delivered'` AND `rider_rating === null`
- [ ] Star rating: 5 `Pressable` stars, fill `brand.star` when selected, `accessibilityLabel` "N stars"
- [ ] Comment: `TextInput` placeholder "How was your Rider?", optional
- [ ] Submit: disabled until rating > 0, `TactilePressable` with `hapticOnPress="commit"`, calls `reviewOrder(orderId, rating, comment)`
- [ ] Success: `Toast` "Thanks for your review!", `onDone()` invalidates queries, `ReviewCard` disappears (reviewable becomes false)
- [ ] Error: `Toast` "Could not submit the review.", rating/comment preserved
- [ ] Loading: submitting state shows "…" in button, disabled
- [ ] TalkBack: stars announce rating, input labeled, button labeled "Submit review"

**Notes:** Reference `mobile/src/features/orders/OrderDetailScreen.tsx:300-357` (ReviewCard), `mobile/src/lib/apiClient.ts:158-161` (reviewOrder), `mobile/src/features/orders/model.ts` (canReview). Distinct from status tracking (I11) — this is post-delivery feedback.