# Implementation Plan: E-commerce Platform Core Build (React Router)

**Plan ID:** `ecomm-platform-core-build-001`
**Version:** 1.1 (Revised for React Router/JS)
**Date:** 2024-07-25
**Mode:** @mode:semi

## 1\. Overview

This plan outlines the steps to build Phase 1 (Core Platform) of the multi-tenant e-commerce platform using **React Router v7 and JavaScript**, deploying to Cloudflare Pages/Workers. It focuses on establishing the basic project structure, core data models, minimal storefront, basic product display, cart functionality, and order creation (without payments).

## 2\. Scope

*Refer to Scope Definition in AI Workflow message dated 2024-07-25T10:00:00Z or Section 1 in the Planning phase summary.*

## 3\. Mode

*Refer to Mode Selection Record in AI Workflow message dated 2024-07-25T10:00:00Z or Section 2 in the Planning phase summary.*

## 4\. High-Level Phases (Mapped to AI Workflow Phases)

1.  **Preparation (AI Phase 3):** Setup project structure, dependencies, Cloudflare/Vite config.
2.  **Implementation (AI Phase 4):** Build core features task-by-task using React Router/JS.
3.  **Verification (AI Phase 5):** Test and validate Phase 1 functionality.
4.  **Documentation (AI Phase 6):** Document setup, core logic, generate external service instructions, update README for JS/React Router.

## 5\. Detailed Task Breakdown (Implementation Phase - Revised)

**Task Group 1: Project Setup & Initial Configuration (Corresponds to AI Phase 3 Prep)**

*   [ ] **IMP.1.1 (Revised):** Initialize a basic Node.js project (`npm init -y`). Create `app/` directory.
*   [ ] **IMP.1.2 (Revised):** Install necessary dependencies: `react`, `react-dom`, `react-router-dom`, `@react-router/dev`, `firebase`, `vitest`, `vite`, `vite-tsconfig-paths` (for potential alias usage, despite JS), `autoprefixer`, `chakra-ui`, `@chakra-ui/react`, `framer-motion`. Install dev dependencies: `@cloudflare/workers-types`, `wrangler`.
*   [ ] **IMP.1.3 (Revised):** Create `vite.config.js` with the specified React Router/Cloudflare configuration:
    ```javascript
    import { reactRouter } from "@react-router/dev/vite";
    import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
    import autoprefixer from "autoprefixer";
    import { defineConfig } from "vite";
    import tsconfigPaths from "vite-tsconfig-paths"; // Keep for potential aliases

    export default defineConfig(() => ({
      server: {
        port: 8788, // Or another suitable port
        fs: {
          allow: ["app", /* Add other necessary dirs e.g., node_modules subdirs */],
        },
      },
      css: {
        postcss: {
          plugins: [autoprefixer],
        },
      },
      plugins: [
        cloudflareDevProxy({
          getLoadContext({ context }) {
            // Ensure env and bindings are passed correctly
            const cloudflare = context.cloudflare || {};
            return {
               cloudflare: {
                 ...cloudflare,
                 env: cloudflare.env || {},
                 cf: cloudflare.cf || {},
                 ctx: cloudflare.ctx || { waitUntil: () => {}, passThroughOnException: () => {} }
               }
             };
          },
        }),
        reactRouter(),
        tsconfigPaths(), // For potential jsconfig.json paths
      ],
       // Ensure build output is suitable for Cloudflare Pages functions
       build: {
        outDir: "dist", // Standard output directory
        rollupOptions: {
          input: {
            // Define entry points if necessary, often handled by adapter
          },
          output: {
             // Adjust output format if needed, usually ESM for workers
             format: 'es',
          }
        }
      }
    }));
    ```
*   [ ] **IMP.1.4 (Revised):** Create initial `wrangler.toml` configuration:
    *   Define pages build output directory (`dist`).
    *   Define D1 binding (`DB`).
    *   Define compatibility flags (e.g., `nodejs_compat` might be needed).
    *   Set `main = "./functions/_worker.js"` (or similar based on adapter output).
    *   *(Generate instructions for USER to create D1 database via Cloudflare dashboard/Wrangler and update `wrangler.toml` with the `database_id`)*.
*   [ ] **IMP.1.5 (Revised):** Create Cloudflare Functions entry point (`functions/[[path]].js`) to integrate with React Router handler (details depend slightly on adapter specifics, but generally imports server build and handles requests).
*   [ ] **IMP.1.6 (New):** Create custom server entry point (`app/entry.server.jsx`) as referenced in user instructions (e.g., similar structure to `counterscale` example, adapting for JS). This handles SSR.
*   [ ] **IMP.1.7 (New):** Create client entry point (`app/entry.client.jsx`).
*   [ ] **IMP.1.8 (New):** Create root layout component (`app/root.jsx`) containing Chakra UI provider and `Outlet`.
*   [ ] **IMP.1.9 (New):** Create basic `app/routes` directory and a sample route (e.g., `app/routes/_index.jsx`) to test setup.
*   [ ] **IMP.1.10 (New):** Create `_routes.json` at the root with basic include/exclude rules as specified.
*   [ ] **IMP.1.11 (New):** Configure `package.json` scripts for dev (`vite dev` or `wrangler pages dev dist --live-reload`), build (`vite build`).
*   [ ] **IMP.1.12 (Revised):** Create basic directory structure: `app/models` (JS objects/classes), `app/services` (JS modules), `app/utils`, `app/components/core`, `app/components/storefront`.
*   [ ] **CHECKPOINT 3.1 (Revised):** Review project structure, dependencies, Vite config, Wrangler config, Functions entry point, server/client entries, `_routes.json`. Verify basic dev server runs (`wrangler pages dev`).

**Task Group 2: Core D1 Schema & Migrations**

*   [ ] **IMP.2.1:** Create D1 migration files (`migrations/`) for core tables:
    *   `0001_create_stores.sql`
    *   `0002_create_products.sql` (basic: id, store_id, sku, price_usd, visible, created_at, updated_at)
    *   `0003_create_product_translations.sql` (basic: product_id, language, name, description, slug)
    *   `0004_create_categories.sql` (basic: id, store_id, parent_id)
    *   `0005_create_category_translations.sql` (basic: category_id, language, name, slug)
    *   `0006_create_carts.sql` (id, store_id, session_id, currency, created_at, updated_at)
    *   `0007_create_cart_items.sql` (id, cart_id, product_id, quantity, price_at_add)
    *   `0008_create_orders.sql` (basic: id, store_id, order_number, status='PENDING', currency, subtotal, total, created_at)
    *   `0009_create_order_items.sql` (id, order_id, product_id, sku, name, price, quantity, subtotal)
    *   `0010_create_customer_profiles.sql` (basic: id (firebase_uid), email, created_at)
*   [ ] **IMP.2.2 (Revised):** Define basic data models/classes in `app/models/` (as plain JS objects or classes).
*   [ ] **IMP.2.3:** Apply migrations using `wrangler d1 migrations apply DB --local` and `... --remote`. Verify schema in Cloudflare dashboard.
*   [ ] **CHECKPOINT 4.1:** Review D1 migration files and applied schema. Confirm core tables exist.

**Task Group 3: Firebase Authentication Setup**

*   [ ] **IMP.3.1:** Generate detailed instructions for USER to set up Firebase.
*   [ ] **CHECKPOINT 4.2:** Confirm user has Firebase config. Review instructions.
*   [ ] **IMP.3.2 (Revised):** Create Firebase client-side initialization service (`app/services/firebase.client.js`).
*   [ ] **IMP.3.3 (Revised):** Implement basic `AuthContext` provider (`app/context/AuthContext.jsx`) using Firebase SDK (`onAuthStateChanged`).
*   [ ] **IMP.3.4 (Revised):** Create basic Login and Signup components (`app/components/core/Auth/Login.jsx`, `Signup.jsx`).
*   [ ] **IMP.3.5 (Revised):** Add basic routes (`app/routes/login.jsx`, `app/routes/signup.jsx`) using the components. Define loaders/actions if needed for form handling.
*   [ ] **IMP.3.6 (Revised):** Implement simple header component showing login/logout status based on `AuthContext`.

**Task Group 4: Store Context & Basic Product API**

*   [ ] **IMP.4.1 (Revised):** Implement loader logic (likely in `root.jsx` or specific route loaders) to:
    *   Identify store (e.g., from hostname passed via `getLoadContext` in `vite.config.js`).
    *   Fetch basic store data from D1 (using binding from `getLoadContext`).
    *   Provide store context (e.g., via React context or passed down from loaders).
*   [ ] **IMP.4.2 (Revised):** Implement React Router loaders and actions for product data:
    *   **Loader (`app/routes/products.$slug.jsx`, `app/routes/categories.$slug.jsx`):** Fetch single product or list of products based on params (slug) and store context. Include translations.
    *   **Action (e.g., hypothetical `/admin/products` route action):** Handle basic CRUD operations for products.
    *   *(Requires basic D1 query service layer `app/services/d1.server.js`)*.
*   [ ] **IMP.4.3 (Revised):** Add basic unit/integration tests (Vitest) for D1 service functions and potentially testing loaders/actions.
*   [ ] **CHECKPOINT 4.3 (Revised):** Review store context logic, product loaders/actions, D1 service, and tests.

**Task Group 5: Minimal Storefront UI**

*   [ ] **IMP.5.1 (Revised):** Create basic layout component (`app/components/storefront/Layout.jsx`) using Chakra UI. Render within `root.jsx`.
*   [ ] **IMP.5.2 (Revised):** Implement homepage route (`app/routes/_index.jsx`) displaying basic store info (from loader) and featured products (fetched via loader).
*   [ ] **IMP.5.3 (Revised):** Implement product detail page route (`app/routes/products.$slug.jsx`):
    *   Use loader to fetch product data.
    *   Display data.
    *   Include "Add to Cart" button (likely using `fetcher.Form` from React Router).
*   [ ] **IMP.5.4 (Revised):** Implement basic category listing page (`app/routes/categories.$slug.jsx`):
    *   Use loader to fetch category info and products.
    *   Display data.
*   [ ] **CHECKPOINT 4.4 (Revised):** Review basic storefront UI components and routes. Verify data fetched via loaders is displayed.

**Task Group 6: Cart Functionality**

*   [ ] **IMP.6.1 (Revised):** Implement React Router actions and potentially resource routes for cart management:
    *   **Loader (e.g., `/cart` route or root loader):** Get current cart contents (based on session ID managed via cookies).
    *   **Action (`/cart` route or specific action endpoints):** Handle Add Item, Update Item, Remove Item.
    *   *(Requires session management utility `app/utils/session.server.js` using `cookie` package or similar)*.
    *   *(Requires cart service layer `app/services/cart.server.js` interacting with D1)*.
*   [ ] **IMP.6.2 (Revised):** Create Cart UI component (`app/components/storefront/CartDisplay.jsx`).
*   [ ] **IMP.6.3 (Revised):** Integrate "Add to Cart" button (`fetcher.Form`) on product page to call the Add Item action.
*   [ ] **IMP.6.4 (Revised):** Integrate Cart UI component (e.g., in header or `/cart` route). Use loader data and actions for updates.
*   [ ] **IMP.6.5 (Revised):** Add basic unit/integration tests for cart service functions and actions.
*   [ ] **CHECKPOINT 4.5 (Revised):** Review cart actions, session logic, frontend integration, and tests.

**Task Group 7: Basic Checkout & Order Creation**

*   [ ] **IMP.7.1 (Revised):** Create basic multi-step checkout UI (`app/routes/checkout.jsx`). Use client-side state for form steps.
*   [ ] **IMP.7.2 (Revised):** Implement React Router action on the final checkout step:
    *   Read cart data from session.
    *   Calculate totals.
    *   Create `orders` and `order_items` records in D1.
    *   Clear the cart session.
    *   Redirect to confirmation page.
    *   *(Requires order service layer `app/services/order.server.js`)*.
*   [ ] **IMP.7.3 (Revised):** Create basic order confirmation page (`app/routes/order.$orderId.jsx`) using a loader to fetch order details.
*   [ ] **IMP.7.4 (Revised):** Add basic unit/integration tests for the order creation action/service.
*   [ ] **CHECKPOINT 4.6 (Revised):** Review checkout UI flow and order creation action/tests.

## 6\. Verification Approach (Phase 1 - Revised)

*   **Unit Tests:** Vitest tests for server-side logic (services, utils).
*   **Integration Tests:** Basic Vitest tests verifying D1 interactions, potentially testing loaders/actions.
*   **Manual Testing:** Similar flows as before, adapted for React Router navigation/forms.
*   **Schema Validation:** Manually verify D1 schema against migration files in Cloudflare dashboard.

## 7\. Documentation (Phase 1 - Revised)

*   **README.md:** Update setup/dev/deploy commands for Vite/React Router setup. Mention `FIREBASE_CONFIG` env var.
*   **Firebase Setup Guide:** `docs/setup/firebase.md`.
*   **Code Comments:** Document critical JS logic.
*   **(Future) Stripe Setup Guide:** Placeholder for `docs/setup/stripe.md`.

## 8\. Human Checkpoints

*   **Checkpoint 2.1:** Approval of this overall Plan. (COMPLETE)
*   **Checkpoint 3.1:** After initial project structure and `wrangler.toml` setup (Preparation).
*   **Checkpoint 4.1:** After core D1 schema definition and initial migration.
*   **Checkpoint 4.2:** After generating Firebase setup instructions & before implementing auth logic.
*   **Checkpoint 4.3:** After implementing basic Product CRUD API endpoints & tests.
*   **Checkpoint 4.4:** After implementing minimal Storefront UI (product display).
*   **Checkpoint 4.5:** After implementing Cart API logic & frontend integration & tests.
*   **Checkpoint 4.6:** After implementing basic Checkout -> Order creation logic & tests.
*   **Checkpoint 5.1:** After Phase 1 Verification activities.

## 9\. Risk Assessment

*   *Risk:* D1 query performance/limitations. *Mitigation:* Design simple queries initially, monitor performance, plan for indexing. Add logging.
*   *Risk:* State management complexity in Remix/Workers. *Mitigation:* Use Remix loaders/actions effectively, keep server-side logic clean, manage session state carefully.
*   *Risk:* External Service Configuration Errors (Firebase/Stripe later). *Mitigation:* Provide clear, step-by-step instructions for user setup, validate configurations in code.
*   *Risk:* Scope creep within Phase 1. *Mitigation:* Adhere strictly to the defined In-Scope items, defer features to later phases. Regular scope checks at checkpoints.
*   *Risk:* Vite/Cloudflare adapter configuration. *Mitigation:* Test extensively, consult Cloudflare support, follow best practices.
*   *Risk:* React Router data loading patterns. *Mitigation:* Test extensively, consult React Router documentation, follow best practices. 