# Implementation Plan: DockerMart Micro-Frontend (Phase 1)

This plan outlines the implementation of **Phase 1: Decision Layer**. We will formulate the core architectural strategy, outline our repository layout, and build the root orchestration scripting to start all micro-frontend servers simultaneously.

---

## Senior Dev Context: Why Phase 1 Matters
Starting a micro-frontend architecture requires aligning on a clear development lifecycle strategy.
1. **Scaffolding Governance**: By manually configuring our dependencies and build configurations (Webpack, Babel, TSConfig), we avoid the bloat of standard CLI generators and understand every configuration boundary.
2. **Dev Orchestration**: Developers need a single command to launch and sync all separate microservice applications, avoiding the friction of opening multiple terminal tabs.

---

## Proposed Phase 1 Steps

### Task 1.1 — Write the Architecture Decision Record (ADR)
*   Create `docs/adr/ADR-001-integration-strategy.md` outlining the choice of Webpack 5 Module Federation over iframe or build-time packages.

### Task 1.2 — Repository Structure
*   Create root project layout manually scaffolded for:
    *   `shell/` (Host)
    *   `catalog-mfe/`
    *   `cart-mfe/`
    *   `checkout-mfe/`
    *   `account-mfe/`
    *   `design-system/`

### Task 1.3 — Dev Orchestration
*   Configure root `package.json` with scripts using `concurrently` to run dev commands in all child directories in parallel.

---

## Proposed Changes

### [NEW] [ADR-001-integration-strategy.md](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/docs/adr/ADR-001-integration-strategy.md)
Document the core micro-frontend integration strategy.

### [NEW] [package.json](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/package.json)
Configure root workspace scripts.

---

## Verification Plan
*   Run `npm run dev` from the root and confirm all sub-app directories attempt to execute their local scripts.
