# Implementation Plan: DockerMart Micro-Frontend (Phase 3)

This plan outlines the implementation of **Phase 3: The Shell**. We will construct the main host routing table, handle remote loading errors gracefully using boundaries, and nesting route structures.

---

## Senior Dev Context: Why Phase 3 Matters
The Shell acts as the thin host orchestrator.
1. **Thin Host Principle**: The Shell must contain zero business logic or domain code. It only manages layout, global navigation, and routing.
2. **Error Boundaries**: If a remote server goes offline, the rest of the store must continue operating. A dynamic React Error Boundary prevents a single remote crash from taking down the entire website.

---

## Proposed Phase 3 Steps

### Task 3.1 — Routing Architecture
*   Implement standard layouts, React Router v6 wildcards, and lazy-loaded components inside Shell's `App.tsx`.
*   Implement `<RemoteErrorBoundary>` fallbacks.

### Task 3.2 — Internal Routing in a Remote
*   Configure relative subrouting and page transitions inside Checkout MFE (`CheckoutRoot.tsx`).

### Task 3.3 — Fat Shell Audit
*   Perform an audit to verify that the Shell is clean of business logic.

---

## Proposed Changes

### [MODIFY] [App.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/shell/src/App.tsx)
Build routing layout and error boundary configurations.

### [MODIFY] [CheckoutRoot.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/checkout-mfe/src/CheckoutRoot.tsx)
Configure nested routes.

---

## Verification Plan
*   Verify that navigating across page paths (e.g. `/catalog`, `/checkout/cart`, `/checkout/shipping`) transitions smoothly.
*   Simulate a crash on one remote and confirm the other pages load cleanly.
