# Implementation Plan: DockerMart Micro-Frontend (Phase 4)

This plan outlines the implementation of **Phase 4: The Cart Widget MFE**. We will explore micro-frontend composition styles: embedding small fragments (widgets) from one remote directly into parent layouts.

---

## Senior Dev Context: Why Phase 4 Matters
Micro-frontends are not just full-page routing apps. Often, components from one domain must mount in another.
1. **Widget Composition**: A navigation bar owned by the Shell needs to show a cart widget owned by the Cart MFE.
2. **Graceful Degradation**: If the Cart MFE is offline, the navbar must fall back to a static offline indicator rather than crashing the navigation.

---

## Proposed Phase 4 Steps

### Task 4.1 — Understand MFE Types
*   Differentiate between full-page MFE routers and localized widgets.

### Task 4.2 — Expose the Cart Widget
*   Expose the `CartWidget` component from `cart-mfe`'s Webpack configuration.

### Task 4.3 — Mount the Widget in the Shell
*   Inject dynamic imports inside Shell's `GlobalNav.tsx` with error handling.

### Task 4.4 — Widget vs. Page Anti-Pattern Analysis
*   Document structural coupling risks.

---

## Proposed Changes

### [MODIFY] [GlobalNav.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/shell/src/GlobalNav.tsx)
Eagerly load CartWidget dynamically.

---

## Verification Plan
*   Load the application with all servers active. Confirm the Cart MFE count displays.
*   Kill the Cart MFE dev server and verify the navbar gracefully displays `Offline` without crashing.
