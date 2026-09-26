# Manager QA Refactor Plan

## Purpose

Resolve the reported guest and staff testing issues across the web app, and make map reliability an explicit cross-platform requirement. This is a discovery plan only: no implementation begins until the interview reaches shared understanding and the user confirms the plan.

## Domain Boundaries

The project glossary in [`../CONTEXT.md`](../CONTEXT.md) defines Customer, Guest, Store, Store Manager, Order, Product, Store Context, and Special. In particular, staff operations are Store-scoped; requested order visibility must preserve that boundary unless the domain rules are deliberately changed.

## Codebase Findings

| Area                     | Verified current behavior                                                                                                                                                                                                                                                                                                        | Working hypothesis / gap                                                                                                                                                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inventory images         | The web inventory uses `product.image` directly. The store-inventory endpoint returns StoreProduct with its related Product; unlike the regular Product API, it does not absolutize image paths. Product assets use `products/...` paths.                                                                                        | Relative image paths may resolve under `/admin/inventory/...` and fail. Confirm through the API payload and browser network request before choosing a shared serialization fix.                                                                                                                     |
| Store Orders             | The endpoint scopes Orders through `StoreContext` and eager-loads `items`; OrderItem casts `product_snapshot` to an array. The card renders up to six snapshot names when `order.items` exists. Existing API tests verify store isolation but not item payloads.                                                                 | The missing products may be a response-shape, fixture/data, or rendering problem. The magnifier definitely links to the Customer route `/account/orders/{id}`. Keep Store scope, verify why item snapshots fail to appear, then render every item inline and remove the magnifier; no detail route. |
| Sales editing            | Product `price` and `sale_price` are Laravel `decimal:2` casts. The sale form calculates `base` from those values and calls `base.toFixed(2)` directly.                                                                                                                                                                          | The user reports the editor fails while opening. Reproduce with decimal-string values, normalize safely, and include a targeted audit of other admin/staff money displays.                                                                                                                          |
| Performance              | Laravel's sample environment defaults `CACHE_STORE=database` and config supports Redis. The frontend QueryClient already has a two-minute global `staleTime`; a few hooks override it. No performance measurements have been captured in this investigation.                                                                     | Redis or longer stale times may not address the actual bottleneck. Measure critical admin flows and API/query timings before selecting caching or query changes.                                                                                                                                    |
| Audit Logs navigation    | The Operations Audit Logs page has no page-level back control. It is protected within the staff Dashboard layout and sits under `/operations/audit-logs`.                                                                                                                                                                        | Add a predictable labeled link to its parent `/operations` page.                                                                                                                                                                                                                                    |
| Maps                     | Web Live Operations uses dynamically loaded Leaflet with OpenStreetMap tiles and renders operational map layers. The mobile app has separate `react-native-maps` components for live delivery and route views; mobile project instructions pin Expo SDK 57. Existing route documentation conflicts with current mobile map code. | Diagnose the actual blank-map failure on each platform first. A Mapbox migration would add tokens/configuration and is not proven necessary; provider choice and offline/network behavior need agreement.                                                                                           |
| Banner editor            | The banner editor is a modal with collapsible slide editors, preview, color/pattern controls, and validation. Several fields rely on placeholders instead of persistent labels; status and dates share a three-column row. No dedicated banner-form test was found.                                                              | Keep the modal; improve form hierarchy, labeling, responsive layout, and keyboard/accessibility behavior while retaining the established design system.                                                                                                                                             |
| No-store dashboard state | `EmptyState` centers its icon/text/action internally. The no-store branch renders it below a left-aligned page heading within a `max-w-5xl` main container. A manager-surface test covers the state but not visual alignment.                                                                                                    | Constrain and center the card within the dashboard column, keep its contents centered, and preserve the left-aligned dashboard heading.                                                                                                                                                             |

## Reported Work Items

1. Restore product images in the Inventory tab.
2. Render all Order Items inline for authorized staff within Store Context.
3. Remove the misleading Order-card magnifier; do not add an Order detail route.
4. Benchmark Manager workflows; fix measured bottlenecks and add Redis only if justified.
5. Fix the Sales editor open failure and audit admin/staff monetary formatting risks.
6. Add a labeled Audit Logs back link to `/operations`.
7. Diagnose and restore reliable map behavior on web and mobile without changing providers unless proven necessary.
8. Improve the Banner editor's usability and visual hierarchy in its existing modal and design system.
9. Center the no-store card and contents within the dashboard column while keeping the heading left-aligned.

## Proposal Dispositions

The following implementation suggestions were included in the supplied notes and resolved during the interview:

- Inventory: investigate the serialized image URL and browser request before choosing a shared media-path fix.
- Orders: keep Store Context, show every snapshot item inline, remove the magnifier, and do not build a detail route.
- Performance: benchmark first; Redis only if measured and operationally justified. Audit admin/staff money-formatting risks.
- Audit Logs: back link destination is `/operations`.
- Maps: repair the existing Leaflet/OpenStreetMap web and native-map mobile implementations first; defer provider migration unless current providers are proven to be the blocker.
- Banner editor: retain the modal and improve scannability, accessibility, and responsive layout.
- No-store state: center a constrained card and its contents; retain the left-aligned heading.

## Evidence To Capture During Diagnosis

- Inventory API image value and resulting browser request/status.
- Store Orders payload shape and item snapshot values for a real manager-visible Order.
- Exact Sales edit reproduction and runtime error.
- Cold/warm timings for representative admin routes and API requests.
- Web map console/network/tile failures and mobile map device/platform behavior.
- Audit Logs navigation and back link to `/operations`.
- Banner edit workflow at desktop and mobile breakpoints.
- Screenshot-defined placement for the centered no-store card.

Screenshots supplied for this review (local, not copied into the repository): `Screenshot 2026-09-26 085856.png`, `090318.png`, `091239.png`, `092959.png`, and `093138.png`.

## Interview Progress

Ask one question at a time, record the answer here immediately, and update any affected recommendation or acceptance criterion before asking the next question.

### Confirmed Decisions

1. **Order visibility is Store-scoped.** Store Managers, Store Owners, and Logistics Officers see Orders and their items only for their resolved Store. Developers must explicitly select a Store. This preserves the existing `Store Context` domain rule.
2. **Order Items stay inline.** Render every purchased Product and quantity on each Order card; remove the misleading magnifier link and do not add a separate staff Order detail route.
3. **Sales failure occurs on editor open.** Reproduce the Store Manager flow with an existing sale whose Product prices arrive as decimal strings; the editor must open, format prices safely, and keep current sale data intact. Start with the implicated editor boundary before deciding whether to audit other money displays.
4. **Performance work is measurement-led.** Baseline the slow Manager workflows and API requests first. Add Redis only if profiling shows a cache/storage bottleneck Redis can address and the target environment can operate it; otherwise fix the measured bottleneck without adding infrastructure.
5. **Maps keep current providers pending diagnosis.** Reproduce and repair web Leaflet/OpenStreetMap and mobile native-map behavior first. Do not add Mapbox or paid credentials unless a provider limitation is proven. Acceptance requires the relevant map surface to render on both platforms, with its required markers/layers and graceful handling when coordinates or network access are unavailable.
6. **Audit Logs returns to Live Operations.** The back-navigation control on `/operations/audit-logs` returns to `/operations` with a predictable labeled link.
7. **Banner editor remains a modal.** Preserve the current create/edit workflow; improve typography, persistent labels, responsive grouping, slide controls, and keyboard/accessibility behavior without changing the Banner domain or API contract.
8. **No-store state alignment.** Center a constrained “No store linked” card in the dashboard column, center its internal contents, and preserve the left-aligned dashboard heading and role label.
9. **Admin money formatting gets a targeted audit.** Check admin/staff price and total displays for decimal-string `.toFixed()` failures; fix confirmed unsafe formatting only. Non-money `.toFixed()` uses are out of scope.

| #   | Decision                                               | Status                                                                                       |
| --- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 1   | Staff Order visibility and Store scope                 | Confirmed: keep existing Store scope                                                         |
| 2   | Inline Order products versus staff detail route        | Confirmed: all items inline, no detail page                                                  |
| 3   | Sales failure reproduction                             | Confirmed: editor fails while opening                                                        |
| 4   | Performance targets and allowed infrastructure changes | Confirmed: baseline first; Redis only if justified                                           |
| 5   | Map reliability scope and provider/token constraints   | Confirmed: diagnose and fix current providers first; paid migration only if proven necessary |
| 6   | Audit Logs back-navigation destination                 | Confirmed: `/operations`                                                                     |
| 7   | Banner editor modal versus page flow and UX priority   | Confirmed: keep modal and improve usability                                                  |
| 8   | No-store card alignment axis                           | Confirmed: center card and contents; keep heading left                                       |
| 9   | Admin money formatting audit scope                     | Confirmed: targeted audit of admin/staff money displays                                      |

**Plan approval:** Approved by the user. Implementation is in progress.

## Implementation Slices

| Slice | Scope                                                                   | Status      |
| ----- | ----------------------------------------------------------------------- | ----------- |
| 1     | Inventory images, Store Order Items, remove misleading order link       | In progress |
| 2     | Sales editor open failure and targeted admin money-format audit         | Not started |
| 3     | Audit Logs return link and no-store dashboard alignment                 | Not started |
| 4     | Web and mobile map diagnosis and reliability fixes                      | Not started |
| 5     | Banner editor modal usability refinement                                | Not started |
| 6     | Admin performance baseline, integration checks, production verification | Not started |
