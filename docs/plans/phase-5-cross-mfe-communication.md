# Implementation Plan: DockerMart Micro-Frontend (Phase 5)

This plan outlines the implementation of **Phase 5: Cross-MFE Communication**. We will implement decoupled communication channels using a shared, namespaced custom event bus and synchronize session actions across multiple browser tabs.

---

## Senior Dev Context: Why Phase 5 Matters
Micro-frontends must remain decoupled:
1. **No Shared State Stores**: Coupling MFEs to a shared Redux or Zustand store breaks autonomous deployments.
2. **Tab Synchronization**: Actions like user logouts should immediately apply to all open browser tabs to secure user sessions.

---

## Proposed Phase 5 Steps

### Task 5.1 — Demonstrate Prop-Drilling Issue
*   Observe why React context and props cannot bridge the runtime Module Federation gap.

### Task 5.2 — Implement Namespaced Event Bus
*   Build `mfe-event-bus.ts` with namespaced event helpers (`mfeEmit`, `mfeOn`) and a late-subscriber replay cache.

### Task 5.3 — Cross-Tab Session Sync
*   Use browser `BroadcastChannel` APIs inside `auth.ts` to sync logout state across tabs instantly.

---

## Proposed Changes

### [NEW] [mfe-event-bus.ts](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/shell/src/mfe-event-bus.ts)
A replay-cached global event bus module.

### [MODIFY] [auth.ts](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/shell/src/auth.ts)
Broadcast tab messages.

---

## Verification Plan
*   Open the store in two browser tabs. Perform a logout in Tab A and verify Tab B logs out instantly.
*   Update Cart item count and verify the count updates in the nav widget instantly.
