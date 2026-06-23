# DockerMart — Distributed E-Commerce Shell (Micro-Frontends)

DockerMart is a modern, production-grade e-commerce SaaS platform structured as a distributed micro-frontend (MFE) architecture. The project is split across multiple independent frontend applications orchestrated dynamically at runtime.

---

## 🏗️ Architecture & Component Map

DockerMart is composed of a core orchestrating Shell, four functional micro-frontends, and a shared federated Design System:

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Shell (Port 3000)                           │
│   Global nav · Authentication · Route orchestration · Cart widget    │
├────────────────┬───────────────┬────────────────┬────────────────────┤
│  Catalog MFE   │   Cart MFE    │  Checkout MFE  │   Account MFE      │
│  (Port 3001)   │  (Port 3002)  │  (Port 3003)   │   (Port 3004)      │
│                │               │                │                    │
│  /catalog/*    │ sidebar widget │  /checkout/*   │   /account/*       │
├────────────────┴───────────────┴────────────────┴────────────────────┤
│                     Design System (Port 3005)                        │
│           Shared tokens · Button · Input · Modal · Typography        │
└──────────────────────────────────────────────────────────────────────┘
```

*   **Shell ([shell/](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/shell))**: The entry point/host. Handles routing (orchestrating `/catalog/*`, `/checkout/*`, and `/account/*`), global layout navigation, authentication, and error boundary fallback handling.
*   **Catalog MFE ([catalog-mfe/](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/catalog-mfe))**: Handles browsing products, product detail pages, and publishing items-added events.
*   **Cart MFE ([cart-mfe/](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/cart-mfe))**: An embedded widget rather than a full page, rendered inside the navigation bar to track item counts.
*   **Checkout MFE ([checkout-mfe/](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/checkout-mfe))**: Handles the shopping cart review, shipping details, payment processing, and confirmation pages.
*   **Account MFE ([account-mfe/](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/account-mfe))**: Manages user details, order history, and preferences.
*   **Design System ([design-system/](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/design-system))**: Exposes design tokens and shared UI components (e.g. Buttons, Inputs) as a runtime-federated remote.

---

## 🛠️ Integration Strategy

We utilize **Webpack 5 Module Federation** to load remote modules dynamically at runtime. This provides:
1.  **Deployment Independence**: Teams can deploy updates to their MFEs without redeploying the Shell.
2.  **Shared Dependencies**: The Module Federation runtime negotiates shared singletons (e.g., React, React-DOM) to prevent the client from downloading duplicate copies.

For a detailed analysis of our integration choices, pros/cons, and runtime trade-offs, see [ADR-001: Integration Strategy](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/docs/adr/ADR-001-integration-strategy.md).

---

## 📁 Workspace Directory Structure

```
micro-frontend/
├── shell/          # Host Shell Application (Port 3000)
├── catalog-mfe/    # Product Catalog Remote MFE (Port 3001)
├── cart-mfe/       # Cart Widget Remote MFE (Port 3002)
├── checkout-mfe/   # Checkout flow Remote MFE (Port 3003)
├── account-mfe/    # Account management Remote MFE (Port 3004)
├── design-system/  # Shared Design System Remote (Port 3005)
├── scripts/        # Utility scripts
└── docs/           # Architecture Decision Records & Phase Guidelines
```

---

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+ recommended)
*   npm (v9+ recommended)

### Installation

Install workspace root dependencies (including orchestration tooling like `concurrently`):

```bash
npm install
```

*(Note: In subsequent phases, dependencies will be installed inside each MFE directory).*

### Running Locally

To orchestrate and run all six development servers (Shell + remotes) concurrently, execute:

```bash
npm run dev
```

This boots all development servers with color-coded logging outputs.

### Production Build

To compile all micro-frontends for deployment:

```bash
npm run build:all
```

---

## 📘 Learning & Phase Map

This project is built incrementally following the structured [requirements.md](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/docs/requirements.md) roadmap:
*   **Phase 1**: Decision Layer (ADR & Workspace setup) `[Current]`
*   **Phase 2**: Bootstrap Remotes & Module Federation (Wiring remotes)
*   **Phase 3**: Routing & The Shell (Error Boundaries, Route Wildcards)
*   **Phase 4**: Embedded Widget Composition (Eager loading)
*   **Phase 5**: Cross-MFE Communication (Custom Event Bus, BroadcastChannel)
*   **Phase 6**: CSS Isolation (CSS Modules & PostCSS Prefixing)
*   **Phase 7**: Federated Design System (Tokens, breaking version changes)
*   *Phases 8-13*: Auth, Testing, CI/CD, Observability, Performance tuning.
