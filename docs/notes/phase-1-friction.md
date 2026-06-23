# Phase 1 — Friction Log

This log documents the developer experience friction encountered when managing multiple micro-frontends manually before integrating orchestration tooling.

## Friction Points Identified

### 1. Manual Context-Switching & Startup Overhead
Without dev orchestration, starting the project requires opening **six separate terminal windows/tabs** (one for the Shell, and one for each of the five remotes/design-system). The developer must run `cd <mfe-dir> && npm run dev` in each of them.
*   **The Pain:** This process is slow and repetitive. If one server crashes or fails to boot due to a port collision, the developer has to hunt through multiple tabs to find the error. Shutting down the stack is also manual, requiring `Ctrl+C` in six separate places.

### 2. Dependency Management & Repetitive Installations
Because we are manually scaffolding independent projects rather than utilizing a monorepo workspace tool (like Nx or Turborepo), there is no centralized lockfile or dependency runner.
*   **The Pain:** If we need to install a shared library (like React, TypeScript, or a testing framework) or run a dependency audit, we have to execute `npm install` inside each of the six directories one by one. This increases the risk of version drift and duplicates disk usage significantly.
