# 06 — Reversible nullable-store migration

**Status:** ready-for-agent

## Parent

#00 Harden the Order Flow (`.scratch/phase-5/issues/00-harden-order-flow.md`)

## What to build

The `orders.store_id` nullable migration is made safely reversible. Its `down()` currently uses a bare `->constrained()->change()`, which drops the original `cascadeOnDelete()` foreign key and would fail on rollback.

`down()` is corrected to restore the foreign key exactly as the original migration defined it (constraint + `cascadeOnDelete`), and a migrate + rollback round-trip proves it.

## Acceptance criteria

- [ ] `down()` restores the original `constrained()->cascadeOnDelete()` foreign key on `orders.store_id`
- [ ] `php artisan migrate:refresh` (or migrate + rollback) completes without error in the test database
- [ ] A round-trip test (migrate → rollback → migrate) passes; `php vendor/bin/phpunit` green

## Blocked by

- Blocked by #01 (Land the P0 order-flow fixes)

## User stories covered

13
