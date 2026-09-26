# Gates: Manager QA Refactor

OWNS: backend/app/**, backend/tests/**, frontend/src/**, mobile/src/**, docs/manager-qa-refactor-plan.md

Scope: resolve the approved manager QA issues without breaking Store Context, guest browsing, staff workflows, or mobile map behavior

- [ ] G1: Store Inventory returns usable product image URLs and its image regression test passes
      CHECK: php backend/artisan test --filter=test_store_inventory_returns_root_relative_product_image_paths
      EXPECT: /Tests\s+\d+\s+passed/
      EVIDENCE: pending

- [ ] G2: Store Orders show every product snapshot inline, remove the wrong Customer link, and preserve Store scope
      CHECK: php backend/artisan test --filter=StoreOrderApiTest
      EXPECT: /Tests\s+\d+\s+passed/
      EVIDENCE: pending

- [ ] G3: Store Manager can open and edit an existing Sale with decimal-string prices; targeted admin money formatting checks pass
      CHECK: npm --prefix frontend test -- "src/app/(admin)/admin/specials/**tests**/SpecialsAdminClient.test.tsx"
      EXPECT: /Tests\s+\d+\s+passed/
      EVIDENCE: pending

- [ ] G4: Audit Logs has a predictable return link and the no-store dashboard state matches the centered-card acceptance criteria
      CHECK: npm --prefix frontend test -- "src/app/(admin)/**tests**/manager-surfaces.test.tsx"
      EXPECT: /Tests\s+\d+\s+passed/
      EVIDENCE: pending

- [ ] G5: Mobile delivery and route map component regressions pass
      CHECK: npm --prefix mobile test -- --runInBand src/components/shared/**tests**/RouteMap.test.tsx src/components/**tests**/LiveDeliveryMap.test.tsx
      EXPECT: /Tests:\s+\d+\s+passed/
      EVIDENCE: pending

- [ ] G6: Web Live Operations map renders with tiles and operational layers; mobile map renders with markers on a supported device
      EVIDENCE: pending

- [ ] G7: Banner editor usability changes preserve create/edit validation and saving behavior
      CHECK: npm --prefix frontend test -- "src/app/(admin)/admin/banners"
      EXPECT: /Tests\s+\d+\s+passed/
      EVIDENCE: pending

- [ ] G8: Admin performance changes are justified by recorded before/after measurements; no unsupported Redis dependency is introduced
      EVIDENCE: pending

- [ ] G9: Frontend production build and all focused frontend regressions pass after integration
      CHECK: npm --prefix frontend run build
      EXPECT: /Compiled successfully/
      EVIDENCE: pending
