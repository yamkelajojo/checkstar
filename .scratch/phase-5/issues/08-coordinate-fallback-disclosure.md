# 08 — Coordinate-fallback disclosure

**Status:** needs-decision (HITL)

## Parent

#00 Harden the Order Flow (`.scratch/phase-5/issues/00-harden-order-flow.md`)

## What to build

A product/UX decision, then a small implementation.

Today, when geolocation is unavailable, denied, or times out, the checkout silently ships the Customer's order with the Durban fallback coordinates (`-29.8587, 31.0218`) — dispatch treats this as the delivery location, which may be wrong for the Customer.

Decision needed: how and when to tell the Customer their delivery coordinates defaulted, and whether checkout should still proceed. Options include a disclosure notice on the confirmation page, an inline banner during checkout, or gating placement on explicit confirmation of the fallback location.

The chosen disclosure is then implemented in the checkout/confirmation flow.

## Acceptance criteria

- [ ] Decision recorded: how/when the fallback case is surfaced, and whether checkout is gated on it
- [ ] Implemented per the decision
- [ ] Frontend test covering the disclosure behaviour; `npx vitest run` green

## Blocked by

- Blocked by #01 (Land the P0 order-flow fixes)

## User stories covered

1
