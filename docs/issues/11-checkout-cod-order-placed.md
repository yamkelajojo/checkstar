## What to build

The checkout climax: delivery address + notes, the COD payment-method seam, the Guest → sign-in choreography, placing the Order, and the "Order placed" success screen.

## Acceptance criteria

- [ ] **Additive backend:** `payment_method` enum on Orders (`cod` | `card`, default `cod`, set at intake); `PaymentStateMachine` unchanged (`paid` fires on Delivery Confirmation for COD); `transactions` table reserved for future Stripe.
- [ ] Checkout screen: delivery address + delivery notes fields; payment-method selector seam — "Cash on delivery" enabled, `card` shown disabled "coming soon".
- [ ] Validation: `AnimatedError` + `useErrorShake` on invalid fields; `commit` haptic on submit; min-order gating prevents submitting a below-minimum order.
- [ ] Guest → sign-in choreography: tapping Place order without a session pushes the Auth screen (`intent: 'checkout'`) while checkout stays mounted; on auth success run `/cart/sync` merge, `goBack()` to checkout, refetch the server cart on focus, then allow Place order again.
- [ ] Place order → **"Order placed"** success screen (native-stack push): hero-once `AnimatedLogo` win with a bouncy spring, Caveat line "We'll get it to your door", order number, `success` haptic, and a "View order" → Order timeline (Slice 12). No confetti.
- [ ] Order is created through the existing order-intake flow (pricing cascade, auto-confirm, dispatch) — no dispatch logic changes in the app.

## Blocked by

- Blocked by Slice 7 (cart draft)
- Blocked by Slice 8 (auth)
- Blocked by Slice 9 (delivery-store + store-scoped browse)
- Blocked by Slice 10 (cart sync)
