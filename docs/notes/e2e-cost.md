# Architectural Note: Full-System E2E Testing Costs & Strategy

Booting the entire micro-frontend ecosystem to verify a single user path is extremely high-cost and slow. This note documents the trade-offs and deployment strategies.

---

### 1. Runtime of this test vs. the per-MFE E2E tests combined
*   **Per-MFE standalones (Task 9.4)** run in parallel, require minimal environment setup, and typically complete in **under 2 seconds**.
*   **Full-System E2E (Task 9.5)** must wait for all 6 local dev servers to initialize, bundlers to compile their chunks, and the host to negotiate authentication. This process can take **15–30 seconds** before a single click is even performed.
*   **Scaling Limit**: As the number of MFEs grows from 6 to 30+, a full-system test becomes exponentially slower, while per-MFE standalone runtimes remain constant.

---

### 2. What happens if the cart-mfe dev server takes 8 seconds to start?
*   **Test Failure (Timeout)**: The E2E runner will attempt to navigate and interact with the elements. If `cart-mfe` is not fully initialized, the cart widget will fail to resolve and throw a timeout exception.
*   **Flakiness Spike**: Slow server startup leads to "flaky tests" where the code is 100% correct, but slow network or CPU speeds cause arbitrary test failures in the pipeline.

---

### 3. Why this test is not a replacement for the contract tests in Task 9.3
*   **Coarse-Grained Feedback**: If the full E2E test fails, we only know "adding to cart didn't update the widget count". It does not tell us *why* (e.g., did Catalog change the event name, or did Cart fail to listen, or did the design system button throw?).
*   **Contract Tests are Instant & Direct**: Task 9.3 contract verification runs in **milliseconds** by parsing files statically. It targets the exact API/exposes/event mismatch and fails immediately at compilation time.
*   **Expensive Debugging**: Debugging full E2E failure requires examining browser logs, network panels, and server outputs across 6 processes.

---

### 4. What would your CI strategy be: which tests run on every PR vs. merge to main?

We recommend a **layered gating strategy** to optimize developer velocity and catch bugs early:

| Trigger Phase | Test Suite | Rationale |
| :--- | :--- | :--- |
| **Every PR Commit** | 1. Isolated Unit Tests (Vitest)<br>2. Contract Tests (Task 9.3)<br>3. Standalone per-MFE E2E | Runs in <5 seconds. Guarantees the local MFE remains self-consistent, compile-valid, and does not violate shell API interfaces. |
| **PR Merge / Post-Merge** | Full-System E2E Smoke Test (Task 9.5) | Runs as a final integration gate before deployment to staging/production. Verifies dynamic runtime orchestration. |
| **Scheduled / Nightly** | Extended E2E User Flows | Validates tertiary paths and edge-cases without slowing down day-to-day developer PR loops. |
