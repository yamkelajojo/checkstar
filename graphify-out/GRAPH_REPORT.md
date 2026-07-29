# Graph Report - .  (2026-07-29)

## Corpus Check
- Large corpus: 778 files · ~1,148,335 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 332 nodes · 423 edges · 20 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Flutter Common Widgets|Flutter Common Widgets]]
- [[_COMMUNITY_Product Display & Cart|Product Display & Cart]]
- [[_COMMUNITY_Navigation & Routing|Navigation & Routing]]
- [[_COMMUNITY_Checkstar Brand & Business|Checkstar Brand & Business]]
- [[_COMMUNITY_Data Models & API|Data Models & API]]
- [[_COMMUNITY_UI Theme & Categories|UI Theme & Categories]]
- [[_COMMUNITY_App Bootstrap|App Bootstrap]]
- [[_COMMUNITY_Repository Layer|Repository Layer]]
- [[_COMMUNITY_Category Management|Category Management]]
- [[_COMMUNITY_Shopping Cart Logic|Shopping Cart Logic]]
- [[_COMMUNITY_Vegetables Screen|Vegetables Screen]]
- [[_COMMUNITY_Local Storage|Local Storage]]
- [[_COMMUNITY_Cart Screen UI|Cart Screen UI]]
- [[_COMMUNITY_Web Scraping Scripts|Web Scraping Scripts]]
- [[_COMMUNITY_State Management|State Management]]
- [[_COMMUNITY_Site Scraper|Site Scraper]]
- [[_COMMUNITY_iOS App Delegate|iOS App Delegate]]
- [[_COMMUNITY_Android Main Activity|Android Main Activity]]
- [[_COMMUNITY_App Constants|App Constants]]
- [[_COMMUNITY_Assets Constants|Assets Constants]]

## God Nodes (most connected - your core abstractions)
1. `package:get/get.dart` - 25 edges
2. `package:flutter/material.dart` - 24 edges
3. `Phase One Redesign` - 14 edges
4. `package:holmon/constants/assets.dart` - 13 edges
5. `Checkstar` - 13 edges
6. `package:holmon/models/dto/product.dart` - 10 edges
7. `package:holmon/views/common_widgets/appBar.dart` - 7 edges
8. `package:holmon/domain/cartViewModel.dart` - 6 edges
9. `Original checkstar.co.za Website` - 6 edges
10. `package:holmon/models/dto/cart.dart` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Checkstar` --features--> `Checkstar Recipes Collection`  [INFERRED]
  cs.md → checkstar_recipes.md
- `Checkstar Logo Icon (Star + Checkmark)` --represents--> `Checkstar`  [INFERRED]
  checkstar-logo-icon-star.html → cs.md
- `Checkstar Text Logo` --represents--> `Checkstar`  [INFERRED]
  checkstar-logo-text.html → cs.md
- `Original checkstar.co.za Website` --has_issues--> `Original Site Issues`  [EXTRACTED]
  cs.md → orginal_site_issues.md
- `Original Site Issues` --motivates--> `Phase One Redesign`  [EXTRACTED]
  orginal_site_issues.md → PHASE_ONE_SPEC.md

## Hyperedges (group relationships)
- **Checkstar Brand Identity** — checkstar_brand, we_care_enough_tagline, checkstar_logo_icon, checkstar_logo_text, checkstar_now_now, durban_cbd_store, mount_edgecombe_store, overport_store [EXTRACTED 1.00]
- **Phase One Tech Stack** — phase_one_redesign, laravel_backend, vue3_frontend, tailwind_css, motion_v, pinia_state, leaflet_osm [EXTRACTED 1.00]

## Communities

### Community 0 - "Flutter Common Widgets"
Cohesion: 0.06
Nodes (27): onClose, onInit, ProductViewModel, Dimensions, build, InkResponse, PortionWidget, SizedBox (+19 more)

### Community 1 - "Product Display & Cart"
Cohesion: 0.07
Nodes (30): build, Carousel, RepaintBoundary, build, CartItemWidget, InkWell, AnimatedContainer, build (+22 more)

### Community 2 - "Navigation & Routing"
Cohesion: 0.07
Nodes (28): MyRoutes, BottomNavigationBar, BottomNavigationBarItem, build, _buildBottomNavigationBar, _buildBottomNavigationBarItem, _buildCartNavigationBarItem, createState (+20 more)

### Community 3 - "Checkstar Brand & Business"
Cohesion: 0.08
Nodes (29): Checkers Product Images (300), Checkstar, Checkstar Logo Icon (Star + Checkmark), Checkstar Text Logo, Checkstar Now Now Delivery App, Database Schema (Core Entities), Grocery Delivery System, Checkstar Design System (+21 more)

### Community 4 - "Data Models & API"
Cohesion: 0.07
Nodes (23): CartItem, toRawJson, Categorie, toRawJson, Product, toRawJson, Api, ApiImpl (+15 more)

### Community 5 - "UI Theme & Categories"
Cohesion: 0.08
Nodes (21): AppThemes, build, MyAppBar, RepaintBoundary, build, CategoriesView, Expanded, build (+13 more)

### Community 6 - "App Bootstrap"
Cohesion: 0.1
Nodes (20): build, GetMaterialApp, initDependencies, MyApp, ThemeProvider, build, DashboardScreen, _DashboardScreenState (+12 more)

### Community 7 - "Repository Layer"
Cohesion: 0.11
Nodes (17): ProductRepository, ProductRepositoryImpl, initDependencies, build, Divider, Profile, Scaffold, SizedBox (+9 more)

### Community 8 - "Category Management"
Cohesion: 0.11
Nodes (18): CategorieViewModel, getAllCategories, build, Categories, _CategoriesState, CategoryItem, Center, CircularProgressIndicator (+10 more)

### Community 9 - "Shopping Cart Logic"
Cohesion: 0.14
Nodes (12): dispose, onClose, ShoppingCartViewModel, _updateCartLength, CartRepository, CartRepositoryImpl, UnimplementedError, dart:async (+4 more)

### Community 10 - "Vegetables Screen"
Cohesion: 0.15
Nodes (12): build, Center, Container, DefaultTabController, initState, Scaffold, VegetableCardWidget, VegetablesScreen (+4 more)

### Community 11 - "Local Storage"
Cohesion: 0.18
Nodes (10): CartLocalStorage, CartLocalStorageImpl, getKeyToList, UnimplementedError, getKeyProduct, getKeyToPage, LocalStorage, LocalStorageImpl (+2 more)

### Community 12 - "Cart Screen UI"
Cohesion: 0.18
Nodes (10): build, CartItemWidget, CartScreen, Center, Column, Divider, ElevatedButton, Scaffold (+2 more)

### Community 13 - "Web Scraping Scripts"
Cohesion: 0.33
Nodes (6): get_checkers_store_context(), get_checkers_token(), scrape_checkers(), scrape_pnp(), search_checkers_products(), search_pnp_products()

### Community 14 - "State Management"
Cohesion: 0.29
Nodes (6): EmptyDataState, FailureState, LoadedState, LoadingState, MyState, NoInternetState

### Community 15 - "Site Scraper"
Cohesion: 0.8
Nodes (4): css_images(), dl(), fetch_page(), log()

### Community 17 - "iOS App Delegate"
Cohesion: 0.5
Nodes (2): FlutterAppDelegate, AppDelegate

### Community 18 - "Android Main Activity"
Cohesion: 1.0
Nodes (1): MainActivity

### Community 19 - "App Constants"
Cohesion: 1.0
Nodes (1): AppConstants

### Community 20 - "Assets Constants"
Cohesion: 1.0
Nodes (1): Assets

## Knowledge Gaps
- **221 isolated node(s):** `MainActivity`, `MyApp`, `initDependencies`, `build`, `ThemeProvider` (+216 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `iOS App Delegate`** (4 nodes): `AppDelegate.swift`, `FlutterAppDelegate`, `AppDelegate`, `.application()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Android Main Activity`** (2 nodes): `MainActivity.kt`, `MainActivity`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Constants`** (2 nodes): `AppConstants`, `appConstants.dart`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Assets Constants`** (2 nodes): `Assets`, `assets.dart`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `package:get/get.dart` connect `Flutter Common Widgets` to `Product Display & Cart`, `Navigation & Routing`, `Data Models & API`, `UI Theme & Categories`, `App Bootstrap`, `Repository Layer`, `Category Management`, `Shopping Cart Logic`, `Vegetables Screen`, `Cart Screen UI`?**
  _High betweenness centrality (0.233) - this node is a cross-community bridge._
- **Why does `package:flutter/material.dart` connect `UI Theme & Categories` to `Flutter Common Widgets`, `Product Display & Cart`, `Navigation & Routing`, `Data Models & API`, `App Bootstrap`, `Repository Layer`, `Category Management`, `Vegetables Screen`, `Cart Screen UI`?**
  _High betweenness centrality (0.199) - this node is a cross-community bridge._
- **Why does `package:holmon/models/dto/product.dart` connect `Data Models & API` to `Flutter Common Widgets`, `Product Display & Cart`, `Repository Layer`, `Category Management`, `Vegetables Screen`, `Local Storage`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Checkstar` (e.g. with `Checkstar Recipes Collection` and `Checkstar Logo Icon (Star + Checkmark)`) actually correct?**
  _`Checkstar` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MainActivity`, `MyApp`, `initDependencies` to the rest of the system?**
  _221 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Flutter Common Widgets` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Product Display & Cart` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._