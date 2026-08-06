# 07 — Product fetch hardening + tidy

**Status:** ready-for-agent

## Parent

#00 Harden the Order Flow (`.scratch/phase-5/issues/00-harden-order-flow.md`)

## What to build

The catalogue fetch is hardened and tidied, frontend-only.

`api.getAllProducts` currently loops `while (all.length < total)` with a `Number.POSITIVE_INFINITY` page-1 sentinel — if any page returns empty data it loops forever. It is changed to terminate when a page returns no data, driven by the server's `total`.

The orphaned `api.getProducts` and `useProducts` (no consumers since every caller switched to `useAllProducts`/`useProducts`' twin) are removed.

Browsing the catalogue never hangs, and the dead twins are gone.

## Acceptance criteria

- [ ] `getAllProducts` terminates when a page returns empty data
- [ ] The `Number.POSITIVE_INFINITY` sentinel is removed in favour of the server `total`
- [ ] `api.getProducts` and `useProducts` are deleted with no remaining references
- [ ] Unit tests cover multi-page aggregation and empty-page termination; `npx vitest run` and `npx tsc --noEmit` (no new errors) green

## Blocked by

None - can start immediately

## User stories covered

11
