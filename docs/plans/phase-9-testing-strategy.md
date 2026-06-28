# Implementation Plan: DockerMart Micro-Frontend (Phase 9)

This plan outlines the complete testing strategy for **Phase 9: Testing Strategy**. We will design and construct a four-layer micro-frontend testing pyramid spanning Unit, Integration, Contract, and E2E boundaries.

---

## Senior Dev Context: Why Phase 9 Matters
Testing a federated MFE application requires a decoupled, layered approach:
1. **Isolated Unit Testing**: Remotes must compile and run their tests with zero dependencies on other remotes or the Shell. We use Vitest and JSDOM inside each MFE directory.
2. **Integration boundaries**: The host Shell is integration-tested by mocking remote modules. We ensure layout boundaries and error boundaries function when a remote is offline or throws errors.
3. **Consumer-Driven Contracts**: Webpack Module Federation relies on runtime interfaces. If MFE A changes its exposed entry path or the events it triggers, MFE B can break. Instead of expensive runtime E2E tests, we enforce consumer contracts using a fast, custom Node validation script during build time.
4. **Per-MFE E2E Standalone**: Playwright tests should execute against a standalone remote without booting the Shell. We intercept the Shell's remote entry script, allowing teams to test user flows in complete isolation.
5. **Full System Smoke Test**: We write exactly one E2E path test that boots all servers to verify critical end-to-end user navigation (Catalog -> Cart -> Account).

---

## Proposed Phase 9 Steps

### Task 9.1 — Unit Tests (Per-MFE, Fully Isolated)
We will configure **Vitest** + React Testing Library (RTL) in the MFE directories:
*   **Install Dependencies**: Install `vitest`, `@testing-library/react`, `@testing-library/user-event`, and `jsdom` in `catalog-mfe`, `cart-mfe`, `checkout-mfe`, and `shell`.
*   **`catalog-mfe`**:
    *   Create [ProductCard.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/catalog-mfe/src/ProductCard.tsx): Dispatches a native browser `CustomEvent` `'mfe:catalog:item-added'` with product ID.
    *   Create [ProductCard.test.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/catalog-mfe/src/ProductCard.test.tsx): Asserts click triggers the correct CustomEvent detail.
*   **`cart-mfe`**:
    *   Create [CartWidget.test.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/cart-mfe/src/CartWidget.test.tsx): Mock the shell event bus module, dispatch `'mfe:cart:updated'`, and assert state count updates from `0` to `3`.
*   **`checkout-mfe`**:
    *   Create [CartSummary.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/checkout-mfe/src/CartSummary.tsx): Displays cart count from state.
    *   Create [CartSummary.test.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/checkout-mfe/src/CartSummary.test.tsx): Asserts item count renders correctly.
*   **`shell`**:
    *   Create [mfe-event-bus.test.ts](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/shell/src/mfe-event-bus.test.ts): Asserts that subscription hydrates late-subscribers from `window.__MFE_EVENT_BUS_CACHE__`.

#### Command to Run Task 9.1 Test Cases:
```bash
# Run isolated unit tests for catalog, cart, checkout, and shell remotes
npm run test --prefix catalog-mfe
npm run test --prefix cart-mfe
npm run test --prefix checkout-mfe
npm run test --prefix shell
```

---

### Task 9.2 — Integration Tests (Shell + Mocked Remotes)
We will write shell integration tests inside `shell/src/__tests__/shell-routing.test.tsx` using Vitest:
*   Mock `catalogApp/CatalogRoot`, `checkoutApp/CheckoutRoot`, and `cartApp/CartWidget`.
*   **Routing Check**: Assert navigating to `/catalog` mounts "Mock Catalog".
*   **Boundary Resilience**: Mock `checkoutApp/CheckoutRoot` to throw an error on load. Assert the host error boundary catches the crash, shows the fallback UI "Checkout App Error", and keeps the rest of the application active.

#### Command to Run Task 9.2 Test Cases:
```bash
# Run host integration tests (includes routing and error boundary fallback tests)
npm run test --prefix shell
```

---

### Task 9.3 — Contract Test (Consumer-Driven, Without Pact)
We will enforce contract checks:
*   Create [shell-consumes-checkout.json](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/docs/contracts/shell-consumes-checkout.json) and [shell-consumes-cart.json](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/docs/contracts/shell-consumes-cart.json) containing contract parameters.
*   Write [verify-contract.js](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/scripts/verify-contract.js):
    1.  Read a contract JSON parameter.
    2.  Locate provider's Webpack configuration and verify exposed paths.
    3.  Scan the provider's `src/` directory files for expected custom event dispatches.
    4.  Exit `1` on mismatch.
*   Weld `"test:contract"` script inside `checkout-mfe/package.json`.

#### Command to Run Task 9.3 Test Cases:
```bash
# Run provider contract verification tests
npm run test:contract --prefix checkout-mfe
npm run test:contract --prefix cart-mfe
```

---

### Task 9.4 — Per-MFE E2E (Standalone Remote Testing)
We will implement standalone remote testing using Playwright:
*   Create `checkout-mfe/e2e/checkout-flow.spec.ts`.
*   Abort `**/shell/remoteEntry.js` via Playwright's `page.route` to verify the checkout remote executes standalone on port `3003`.
*   Document benefits in `docs/notes/per-mfe-e2e.md`.

#### Command to Run Task 9.4 Test Cases:
```bash
# Run standalone isolated Playwright E2E tests against checkout MFE dev server
npm run test:e2e --prefix checkout-mfe
```

---

### Task 9.5 — Full-System E2E Smoke Test
We will build a Playwright E2E smoke test at `e2e/smoke.spec.ts` that runs across all active services:
*   Launch all six servers.
*   Navigate home -> catalog -> add item -> verify cart nav updates -> checkout page -> account profile view.
*   Document costs and CI/CD PR trigger strategy in `docs/notes/e2e-cost.md`.

#### Command to Run Task 9.5 Test Cases:
```bash
# Run root-level system-wide Playwright smoke tests
npm run test:e2e
```

---

## Proposed Changes

### [MODIFY] [package.json](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/catalog-mfe/package.json)
### [MODIFY] [package.json](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/cart-mfe/package.json)
### [MODIFY] [package.json](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/checkout-mfe/package.json)
### [MODIFY] [package.json](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/shell/package.json)
Add test runners and scripts.

### [NEW] [ProductCard.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/catalog-mfe/src/ProductCard.tsx)
### [NEW] [CartSummary.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/checkout-mfe/src/CartSummary.tsx)
New UI components.

### [NEW] [verify-contract.js](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/scripts/verify-contract.js)
Node-based contract validator.

### [NEW] `*.test.tsx`, `*.test.ts`, and `*.spec.ts` files across all workspaces.

---

## Verification Plan

### Automated Tests
*   **Unit Tests**: Run `npm run test` in each directory.
*   **Contract Tests**: Run `npm run test:contract` in checkout MFE.
*   **E2E Tests**: Run `npx playwright test`.
