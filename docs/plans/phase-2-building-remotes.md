# Implementation Plan: DockerMart Micro-Frontend (Phase 2)

This plan outlines the implementation of **Phase 2: Building the Remotes**. We will build individual remote MFEs, configure their build pipelines, expose components via Module Federation, and trigger/document classic edge-case configuration bugs.

---

## Senior Dev Context: Why Phase 2 Matters
Configuring Module Federation manually requires careful management of compiler and bundler boundaries:
1. **Shared Dependency singletons**: React hooks crash if multiple copies of React execute in the browser. We must enforce version matching and singletons.
2. **Path Resolution**: Remotes require absolute or self-resolving `publicPath` configurations to prevent asset load failures.

---

## Proposed Phase 2 Steps

### Task 2.1 — Bootstrap Each MFE
*   Configure Webpack 5, React 18, Babel, and TypeScript compilers inside all MFE folders.

### Task 2.2 — TypeScript Module Declarations
*   Create `declarations.d.ts` modules to let TypeScript know how to resolve remote-exported types without compilation errors.

### Task 2.3 — Wire Module Federation
*   Configure Webpack `ModuleFederationPlugin` inside all MFEs, setting up exposed routes and shared packages.

### Tasks 2.4 - 2.7 — Configuration Bugs Investigation
*   Intentionally trigger and document:
    *   **Bug #1**: Duplicate React Hook Dispatcher Error.
    *   **Bug #2**: Shared Dependency version mismatch.
    *   **Bug #3**: `publicPath` path resolution trap.
    *   **Bug #4**: Eager synchronous entry package load failure.

---

## Proposed Changes
*   Webpack, Babel, TSConfig files inside all 6 directories.
*   Exposures and dynamic async bootstrap entries (`src/index.js` importing `bootstrap.tsx`).

---

## Verification Plan
*   Run production builds and check compilation of each MFE.
