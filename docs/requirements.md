# Micro-Frontend Engineering Requirements
## Project: *DockerMart* — A Distributed E-Commerce Shell

> **Audience:** Senior developer (4+ yrs) beginning micro-frontend architecture.  
> **Reference material:** [`microfrontend_guide.md`](./microfrontend_guide.md) — read it *after* you hit each wall, not before.  
> **North Star:** A production-grade micro-frontend system — independently deployable, correctly isolated, observable, and tested. Each phase deliberately exposes a real failure mode you must diagnose and fix yourself. That friction is the learning.

---

## The Product

You are building **DockerMart**, a hypothetical SaaS e-commerce platform. The platform is split across five independent product teams. You play every team's role yourself — so you understand every seam from both sides.

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

UI/UX is deliberately out of scope. Every page can be raw HTML, a white background, black text. What matters is the architecture underneath.

---

## Phase Map

| Phase | Topic | Week | Est. Time |
|-------|-------|------|-----------|
| 1 | Decision Layer | 1 | 3–4 hrs |
| 2 | Building the Remotes | 1–2 | 5–7 hrs |
| 3 | The Shell | 2 | 3–4 hrs |
| 4 | The Cart Widget MFE | 2 | 2–3 hrs |
| 5 | Cross-MFE Communication | 2–3 | 3–4 hrs |
| 6 | CSS Isolation | 3 | 2–3 hrs |
| 7 | The Design System Remote | 3 | 3–4 hrs |
| 8 | Shared Authentication | 3–4 | 2–3 hrs |
| 9 | Testing Strategy | 4 | 5–6 hrs |
| 10 | CI/CD Pipeline | 4–5 | 3–4 hrs |
| 11 | Deployment & Observability | 5 | 4–5 hrs |
| 12 | Performance | 5 | 2–3 hrs |
| 13 | Retrospective | 5–6 | 2 hrs |

---

## Phase 1 — The Decision Layer *(Week 1, ~3–4 hrs)*

> **Learning objective:** Understand why and when micro-frontends are the right tool. Make the architecture decision with evidence, not instinct.

### Task 1.1 — Write the Architecture Decision Record

Before writing a single line of code, document your architectural choice in `docs/adr/ADR-001-integration-strategy.md`.

Use this exact template:

```markdown
# ADR-001: Integration Strategy for DockerMart

## Status
Proposed

## Context
<!-- Describe the team/scale scenario. DockerMart has 5 product teams. -->
<!-- State the specific problem that makes a frontend monolith painful here. -->

## Options Considered
| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| Monorepo (Nx) | ... | ... | ... |
| Build-time npm packages | ... | ... | ... |
| Module Federation (Webpack 5) | ... | ... | ... |
| iframe composition | ... | ... | ... |
| single-spa | ... | ... | ... |

## Decision
<!-- Which strategy and why. -->

## Consequences
<!-- What trade-offs does this decision lock you into? -->
<!-- What becomes harder because of this choice? Name at least three. -->
```

**What to decide:** Justify choosing **Webpack 5 Module Federation** for client-side composition. The quality of reasoning matters more than the decision — name what you are giving up, not just what you gain.

**Acceptance criteria:**
- [ ] Each option row is filled from first principles, not copied from the guide
- [ ] "Consequences" section names at least **three** things that get harder with the chosen approach
- [ ] ADR is committed before any `webpack.config.js` is created

---

### Task 1.2 — Repo Structure

Create the directory structure manually. Do **not** use any scaffolding tool:

```
micro-frontend/
├── shell/
├── catalog-mfe/
├── cart-mfe/
├── checkout-mfe/
├── account-mfe/
├── design-system/
├── scripts/
└── docs/
    └── adr/
```

Each MFE directory must have its own `package.json` with its own `name`, `version`, and `scripts`. Do **not** use a monorepo tool (Nx, Turborepo) yet — the friction is intentional and educational.

---

### Task 1.3 — Dev Orchestration

Running five dev servers manually in five separate terminal tabs is immediately painful. Solve it at the root level:

Install `concurrently` at the workspace root (create a root `package.json`):

```bash
npm init -y
npm install -D concurrently
```

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently -n shell,catalog,cart,checkout,account,ds -c blue,green,yellow,red,cyan,magenta \"npm run dev --prefix shell\" \"npm run dev --prefix catalog-mfe\" \"npm run dev --prefix cart-mfe\" \"npm run dev --prefix checkout-mfe\" \"npm run dev --prefix account-mfe\" \"npm run dev --prefix design-system\"",
    "build:all": "npm run build --prefix catalog-mfe && npm run build --prefix cart-mfe && npm run build --prefix checkout-mfe && npm run build --prefix account-mfe && npm run build --prefix design-system && npm run build --prefix shell"
  }
}
```

**Validation:** `npm run dev` at the root starts all six servers with color-coded, labeled output. Kill any one with `Ctrl+C` — the others keep running.

**Deliverable:** `docs/notes/phase-1-friction.md` — note two painful things you discovered from not having Nx *before* you added `concurrently`. You will return to this file in Phase 13.

---

## Phase 2 — Building the Remotes *(Week 1–2, ~5–7 hrs)*

> **Learning objective:** Configure Module Federation correctly from scratch. Hit the four most common production bugs by triggering them yourself.

### Task 2.1 — Bootstrap Each MFE

Initialize each of the six apps (shell + 5 MFEs) as a **Webpack 5 + React** project. No Create React App, no Vite yet.

Required stack:
- `webpack` 5.x, `webpack-dev-server` 4.x, `webpack-cli` 4.x
- `babel-loader`, `@babel/preset-react`, `@babel/preset-typescript`
- `react` 18.x, `react-dom` 18.x
- `typescript` 5.x
- `html-webpack-plugin`

Each app must:
1. Boot independently (`npm run dev` in its own directory)
2. Serve its own `index.html` with a minimal root component confirming it works
3. Have its own working `webpack.config.js` and `tsconfig.json`

> ⚠️ **No scaffolding tools.** Write the webpack config by hand. This is where most engineers discover what those tools were hiding from them.

**Acceptance criteria:**
- [ ] `cd shell && npm run dev` → app opens at `localhost:3000`
- [ ] `cd catalog-mfe && npm run dev` → app opens at `localhost:3001`
- [ ] Each port is set in `devServer.port` — no port collisions

---

### Task 2.2 — TypeScript Module Declarations

Before wiring Module Federation, create type declarations for all federated imports. Without this, TypeScript refuses to compile when you write `import('catalogApp/CatalogRoot')`.

Create `shell/src/declarations.d.ts`:

```ts
// Federated module declarations — TypeScript does not know about
// runtime-resolved remote modules. These shims satisfy the compiler.
// Keep in sync with each remote's `exposes` config.

declare module 'catalogApp/CatalogRoot' {
  const Component: React.ComponentType;
  export default Component;
}

declare module 'cartApp/CartWidget' {
  const Component: React.ComponentType;
  export default Component;
}

declare module 'checkoutApp/CheckoutRoot' {
  const Component: React.ComponentType;
  export default Component;
}

declare module 'accountApp/AccountRoot' {
  const Component: React.ComponentType;
  export default Component;
}

declare module 'designSystem/Button' {
  interface ButtonProps { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'danger'; }
  export const Button: React.ComponentType<ButtonProps>;
}

declare module 'designSystem/GlobalStyles' {
  const GlobalStyles: React.ComponentType;
  export default GlobalStyles;
}
```

Each remote MFE also needs its own `src/declarations.d.ts` for any shared design system imports it consumes.

**The learning:** These files are the only TypeScript-visible "contract" between teams at compile time. They go stale when teams rename their exports. Document in `docs/notes/typescript-declarations.md`: what happens when the declaration says `default` export but the remote ships a named export? How would a proper type-safe contract (e.g., a shared types package) solve this?

---

### Task 2.3 — Wire Module Federation

Configure `ModuleFederationPlugin` in each app. Do this in order — shell last.

**Step A — Each remote exposes its root:**

```js
// catalog-mfe/webpack.config.js
new ModuleFederationPlugin({
  name: 'catalogApp',
  filename: 'remoteEntry.js',
  exposes: {
    './CatalogRoot': './src/CatalogRoot',
  },
  shared: {
    react:     { singleton: true, eager: false, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, eager: false, requiredVersion: '^18.0.0' },
  },
})
```

Repeat for `cartApp`, `checkoutApp`, `accountApp`, `designSystem`.

**Step B — Shell consumes all remotes:**

```js
// shell/webpack.config.js
new ModuleFederationPlugin({
  name: 'shell',
  remotes: {
    catalogApp:   'catalogApp@http://localhost:3001/remoteEntry.js',
    cartApp:      'cartApp@http://localhost:3002/remoteEntry.js',
    checkoutApp:  'checkoutApp@http://localhost:3003/remoteEntry.js',
    accountApp:   'accountApp@http://localhost:3004/remoteEntry.js',
    designSystem: 'designSystem@http://localhost:3005/remoteEntry.js',
  },
  shared: {
    react:     { singleton: true, eager: false, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, eager: false, requiredVersion: '^18.0.0' },
  },
})
```

---

### Task 2.4 — Trigger Bug #1: Duplicate React

Remove `singleton: true` from `react` in the Catalog remote's shared config while the shell still has it. Run both apps. Observe the error.

Document in `docs/notes/bug-1-duplicate-react.md`:
- The exact error message in the browser console
- Why it happened (your words — no copy-paste from any source)
- Why `singleton: true` prevents it at the Module Federation runtime level
- Why this bug **never appears on localhost** when both apps declare the same version, but surfaces in production when teams diverge versions

---

### Task 2.5 — Trigger Bug #2: `requiredVersion` Mismatch

This is a distinct bug from Bug #1, commonly confused with it.

In `catalog-mfe`, change `requiredVersion` to `'^17.0.0'` while the shell declares `'^18.0.0'`. Both have `singleton: true`. Run both apps.

Observe the warning in the console: Module Federation will use the **higher** compatible version but logs a version negotiation warning. Now change catalog to `'^16.0.0'` — a range that is incompatible with `^18`. Observe what happens.

Document in `docs/notes/bug-2-version-mismatch.md`:
- The difference in behavior between `^17` (compatible range) vs `^16` (incompatible range)
- What Module Federation does when ranges don't overlap: does it throw, warn, or silently load two copies?
- The organizational fix: who owns the `requiredVersion` decision when 5 teams set it independently?

---

### Task 2.6 — Trigger Bug #3: `publicPath` Trap

In `catalog-mfe/webpack.config.js`, set `publicPath` to a fake CDN URL simulating a production misconfiguration:

```js
output: {
  publicPath: 'https://cdn.dockermart.io/catalog/', // wrong: chunks will 404
}
```

Run the shell. Open the Network tab. Document in `docs/notes/bug-3-publicpath.md`:
- What happens to lazy-loaded chunks vs. `remoteEntry.js` itself
- Why the shell gets a blank white screen with no meaningful error message
- The fix: `publicPath: 'auto'` for production, explicit localhost URL for development

---

### Task 2.7 — Trigger Bug #4: Eager Sync Import

In each MFE's `src/index.js`, the only content must be:
```js
import('./bootstrap');
```

All real imports (React, ReactDOM, root component) live in `src/bootstrap.tsx`.

Trigger Bug #4 deliberately: put `import React from 'react'` at the top of `index.js` with `eager: false` on the shared React config. Run the app. Document the exact error in `docs/notes/bug-4-eager-sync.md`:
- The error message
- Why one async tick matters here — what is the Module Federation runtime doing in that tick?
- Why the `eager: true` workaround (which Stack Overflow recommends) fixes the symptom but defeats lazy loading for all consumers

---

## Phase 3 — The Shell *(Week 2, ~3–4 hrs)*

> **Learning objective:** Build a thin shell that routes correctly, isolates failures, and has zero knowledge of its remotes' internals.

### Task 3.1 — Routing Architecture

Implement the shell's routing table using `react-router-dom` v6. The shell `App.tsx` must mount auth before any route renders:

```tsx
// shell/src/App.tsx
import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initAuth } from './auth';

const CatalogApp  = React.lazy(() => import('catalogApp/CatalogRoot'));
const CheckoutApp = React.lazy(() => import('checkoutApp/CheckoutRoot'));
const AccountApp  = React.lazy(() => import('accountApp/AccountRoot'));
// CartWidget is NOT lazy-loaded here — see Phase 4

export default function App() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    initAuth().then(() => setAuthReady(true));
  }, []);

  if (!authReady) return <div>Authenticating…</div>;

  return (
    <BrowserRouter>
      <GlobalNav />     {/* Shell-owned chrome — see Phase 4 for CartWidget inside this */}
      <Routes>
        <Route path="/catalog/*"  element={<RemoteMount name="Catalog"><CatalogApp /></RemoteMount>} />
        <Route path="/checkout/*" element={<RemoteMount name="Checkout"><CheckoutApp /></RemoteMount>} />
        <Route path="/account/*"  element={<RemoteMount name="Account"><AccountApp /></RemoteMount>} />
        <Route path="/"           element={<Navigate to="/catalog" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

Rules:
- Shell routes use the `/*` wildcard — never define sub-paths like `/checkout/step-1` in the shell
- Each MFE root is wrapped in a `<Suspense>` + `<RemoteErrorBoundary>` pair
- `<RemoteErrorBoundary>` shows the MFE name in its fallback and does **not** crash the rest of the app

**Validation:** Kill the catalog-mfe dev server. Navigate to `/catalog` — shell shows "Catalog is temporarily unavailable." All other routes and the nav continue to function.

---

### Task 3.2 — Internal Routing in a Remote

Inside `checkout-mfe/src/CheckoutRoot.tsx`, implement the Checkout flow as internal routes:

```
/checkout/cart      → <CartPage />
/checkout/shipping  → <ShippingPage />
/checkout/payment   → <PaymentPage />
/checkout/confirm   → <ConfirmPage />
```

Rules:
- The checkout MFE uses `useNavigate` for step transitions — `navigate('/checkout/payment')`
- The checkout MFE must **not** call `createBrowserHistory()` — it relies on the shell's `<BrowserRouter>`
- Adding `/checkout/gift-wrap` requires **zero changes to the shell**

**Validation:** Bookmark `http://localhost:3000/checkout/shipping`. Refresh. You must land on the shipping step — not the shell root. The URL must be preserved through a hard reload.

---

### Task 3.3 — The Fat Shell Audit

After wiring all routes, review `shell/src/App.tsx` honestly. Answer in `docs/notes/shell-audit.md`:

1. Does the shell contain any business logic that belongs to a specific MFE?
2. Does the shell import anything from a remote other than via `React.lazy` or the event bus?
3. Does the shell own any product state (cart count, selected variant, user preferences)?
4. Would the shell need to be redeployed if the Checkout team adds a new route internally?

If you find any violations, move the logic to the correct remote and document what you moved and why. Answer 4 must be "No" before this phase is complete.

---

## Phase 4 — The Cart Widget MFE *(Week 2, ~2–3 hrs)*

> **Learning objective:** The most important MFE pattern the requirements did not cover initially — a **non-routed, embedded widget** that mounts inside the shell's nav bar, not behind a route. This teaches a fundamentally different MFE composition model.

### Task 4.1 — Understand the Difference

A **full-page MFE** (Catalog, Checkout, Account) owns a route subtree and mounts/unmounts as the user navigates. A **widget MFE** (Cart) is always visible — it lives in the shell's nav bar and must stay mounted across all route changes.

The cart widget:
- Displays a live cart item count (e.g., `🛒 3`)
- Updates whenever `mfe:cart:updated` fires (from any MFE)
- Is independently deployable by the Cart team without touching the shell
- Must **not** be behind a `React.lazy` + route guard — it must be eagerly loaded at shell boot

This distinction matters: using `React.lazy` for a widget that must always be visible causes it to flash in/out during route transitions. Use a different mounting strategy.

---

### Task 4.2 — Expose the Cart Widget

In `cart-mfe/webpack.config.js`:
```js
new ModuleFederationPlugin({
  name: 'cartApp',
  filename: 'remoteEntry.js',
  exposes: {
    './CartWidget': './src/CartWidget',  // widget — NOT a page root
  },
  shared: {
    react:     { singleton: true, eager: false, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, eager: false, requiredVersion: '^18.0.0' },
  },
})
```

In `cart-mfe/src/CartWidget.tsx`:
```tsx
import React, { useState, useEffect } from 'react';
import { mfeOn } from '../../shell/src/mfe-event-bus'; // In practice: a shared package

export default function CartWidget() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    return mfeOn<{ count: number }>('mfe:cart:updated', ({ count }) => setCount(count));
  }, []);

  return <span>🛒 {count}</span>;
}
```

---

### Task 4.3 — Mount the Widget in the Shell Nav

The shell must import the cart widget **eagerly** at module-init time — not via `React.lazy`. Use a dynamic import with an explicit loading state:

```tsx
// shell/src/GlobalNav.tsx
import React, { useEffect, useState } from 'react';

type CartWidgetModule = { default: React.ComponentType };

export function GlobalNav() {
  const [CartWidget, setCartWidget] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Eager import — fetch remoteEntry and resolve the widget immediately on shell boot
    import('cartApp/CartWidget')
      .then((mod: CartWidgetModule) => setCartWidget(() => mod.default))
      .catch(() => setCartWidget(() => () => <span>🛒</span>)); // degraded fallback
  }, []);

  return (
    <nav>
      <span>DockerMart</span>
      {CartWidget ? <CartWidget /> : <span>🛒 …</span>}
    </nav>
  );
}
```

**Validation:** 
- Navigate between `/catalog`, `/checkout`, and `/account`. The cart widget must stay mounted and never flash.
- Kill the cart-mfe dev server. The nav must show `🛒` (the degraded fallback) — the rest of the app must be unaffected.
- Add an item in the catalog. The cart widget must update its count within one event cycle.

---

### Task 4.4 — Widget vs. Page Anti-Pattern Analysis

Document in `docs/notes/widget-vs-page-mfe.md`:

1. What breaks if you load the CartWidget via `React.lazy` inside a route?
2. Why does the Cart team's deploy not require a shell redeploy? What would need to change for it to require one?
3. What are the two scenarios where an iframe would be a better choice than Module Federation for an embedded widget? What is the trade-off in each?

---

## Phase 5 — Cross-MFE Communication *(Week 2–3, ~3–4 hrs)*

> **Learning objective:** Build a decoupled event bus that solves the late-subscriber problem. Experience why prop-drilling across MFE boundaries fails at scale.

### Task 5.1 — The Anti-Pattern First

Implement cart communication the **wrong** way first:

```tsx
// In shell/src/App.tsx — the bad approach
const [cartCount, setCartCount] = useState(0);
<CatalogApp onAddToCart={(item) => setCartCount(c => c + 1)} />
<CheckoutApp cartCount={cartCount} />
```

Ship it. It works. Now rename `onAddToCart` to `onItemAdded` inside `CatalogRoot.tsx`'s internal API. Observe what breaks and where.

Document in `docs/notes/prop-drilling-failure.md`:
- Exactly what broke and which file threw the error
- Which team's deploy caused the break in the **other** team's code
- How many files outside the Catalog MFE's directory you had to change
- Why this recreates the monolith's coupling problem — even though the code lives in separate repos

---

### Task 5.2 — The Event Bus

Create `shell/src/mfe-event-bus.ts`. This file is the single shared communication contract:

```ts
type EventCache = Record<string, unknown>;
const lastState: EventCache = {};

export function mfeEmit<T>(event: string, detail: T): void {
  lastState[event] = detail;
  window.dispatchEvent(new CustomEvent(event, { detail }));
}

export function mfeOn<T>(event: string, handler: (detail: T) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<T>).detail);
  window.addEventListener(event, listener);
  // Late-subscriber replay: hydrate from cache if event already fired
  if (event in lastState) handler(lastState[event] as T);
  return () => window.removeEventListener(event, listener);
}
```

Rules:
- All events must be namespaced: `mfe:catalog:item-added`, `mfe:cart:updated`, `mfe:auth:ready`
- Every `mfeOn` call inside a React component must call the returned cleanup in `useEffect`'s cleanup
- No React state, ref objects, or functions may appear in `event.detail` — only JSON-serializable values
- Event names are an API contract between teams. Treat a rename the same as a breaking API change

**Validation for the late-subscriber fix:**  
Fire `mfe:cart:updated` from the Catalog MFE on mount. Add a 500ms artificial delay before the Checkout MFE mounts. Verify the Checkout MFE receives the correct cart count **without** the catalog firing the event again.

---

### Task 5.3 — Cross-Tab Logout

Implement a logout flow using `BroadcastChannel` — `CustomEvent` is same-page only and cannot synchronize across tabs:

```ts
// shell/src/auth.ts
const authChannel = new BroadcastChannel('mfe:auth');

export function broadcastLogout(): void {
  authChannel.postMessage({ type: 'LOGOUT' });
  performLocalLogout();
}

authChannel.onmessage = (e) => {
  if (e.data.type === 'LOGOUT') performLocalLogout();
};

function performLocalLogout() {
  // Clear session state, redirect to /login
}
```

**Validation:** Open DockerMart in two browser tabs. Log out in Tab A. Tab B must redirect to `/login` within one second with no user action.

**Follow-up question for `docs/notes/broadcast-channel-notes.md`:** What happens to the `BroadcastChannel` listener when the shell navigates to `/login` and the component unmounts? How do you prevent a memory leak? What happens in a same-origin iframe — does `BroadcastChannel` cross the iframe boundary?

---

## Phase 6 — CSS Isolation *(Week 3, ~2–3 hrs)*

> **Learning objective:** Ship a real CSS leakage incident, fix it with two different strategies, and understand when each is appropriate.

### Task 6.1 — Trigger the Leakage Incident

In `checkout-mfe/src/checkout.css`, add a global reset:
```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

button {
  background: #0055cc;
  color: white;
}
```

Mount the checkout MFE alongside the catalog MFE. Take a screenshot of the Catalog MFE's broken layout. Document in `docs/notes/css-leakage-incident.md`:
- Which HTML elements broke and what style property changed on each
- Why the leakage is **non-deterministic** in production (hint: which MFE mounts last wins)
- Why this bug never appeared in the Checkout team's own local dev environment

---

### Task 6.2 — Fix with CSS Modules

Convert `checkout-mfe` to CSS Modules:
- Rename `checkout.css` → `CheckoutPanel.module.css`
- Import via `import styles from './CheckoutPanel.module.css'`
- Remove global resets; scope everything to component-level classes

Confirm the catalog layout is restored. Inspect the generated class names in DevTools. Document the hash format webpack generates and which two factors determine its uniqueness.

---

### Task 6.3 — Fix with `postcss-prefix-selector`

Reintroduce the leakage in `catalog-mfe` using its own CSS reset. Fix it using PostCSS prefix (without touching any CSS selectors):

1. Install: `npm install -D postcss-loader postcss-prefix-selector`
2. Add to the catalog's webpack `module.rules` for `.css` files
3. Configure prefix: `.catalog-app`
4. Wrap the catalog's root element: `<div className="catalog-app">`

Confirm isolation. The existing CSS files must not be modified.

**Deliverable:** `docs/notes/css-strategies-comparison.md` — one paragraph each on when you would choose:
- CSS Modules
- `postcss-prefix-selector`
- Shadow DOM Web Components

Base this on what you just built, not on the guide. Where would `@layer` fit in, and what does it require from all teams to work correctly?

---

## Phase 7 — The Design System Remote *(Week 3, ~3–4 hrs)*

> **Learning objective:** This phase was missing from the first version of these requirements. The design system is not just a component library — it is its own deployed MFE remote with its own version lifecycle and the highest blast radius of anything in the system.

### Task 7.1 — Build the Design System Remote

In `design-system/`, create a minimal but real design system:

`design-system/src/tokens.css`:
```css
:root {
  --color-primary:    hsl(221, 100%, 50%);
  --color-danger:     hsl(0, 90%, 55%);
  --color-surface:    hsl(0, 0%, 100%);
  --color-text:       hsl(0, 0%, 12%);
  --radius-md:        8px;
  --font-body:        'Inter', system-ui, sans-serif;
  --space-4:          4px;
  --space-8:          8px;
  --space-16:         16px;
}
```

`design-system/src/Button.tsx`:
```tsx
import React from 'react';
import './tokens.css';
import styles from './Button.module.css';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger';
  disabled?: boolean;
}

export function Button({ children, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

`design-system/src/GlobalStyles.tsx`:
```tsx
import React, { useEffect } from 'react';

// Injects design tokens into :root once — all remotes read the same tokens
export default function GlobalStyles() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/tokens.css'; // served from design-system's own CDN path
    document.head.appendChild(link);
    return () => link.remove();
  }, []);
  return null;
}
```

Configure `design-system/webpack.config.js` to expose:
```js
exposes: {
  './Button':       './src/Button',
  './GlobalStyles': './src/GlobalStyles',
}
```

---

### Task 7.2 — Consume the Design System in Remotes

In `checkout-mfe` and `catalog-mfe`, import `Button` from the federated design system — **not** from `node_modules`:

```tsx
// checkout-mfe/src/CheckoutRoot.tsx
import { Button } from 'designSystem/Button';

// Use it — same component, same styles, no local copy
<Button variant="primary" onClick={handleSubmit}>Place Order</Button>
```

**Validation:** Open both MFEs simultaneously. Both `Button` components must look identical. Open the Network tab — `design-system/remoteEntry.js` must appear exactly **once** regardless of how many remotes consume it.

Add `designSystem` to the `shared` config in every consuming remote:
```js
shared: {
  react:         { singleton: true, eager: false, requiredVersion: '^18.0.0' },
  'react-dom':   { singleton: true, eager: false, requiredVersion: '^18.0.0' },
  'design-system': { singleton: true, eager: false }, // prevents two DS instances
}
```

---

### Task 7.3 — The Breaking Change Experiment

This task teaches the highest-stakes failure mode in a design system remote.

**Step 1:** Rename the `variant` prop to `intent` in `Button.tsx`:
```tsx
// BREAKING CHANGE: variant → intent
export interface ButtonProps {
  intent?: 'primary' | 'danger'; // was: variant
}
```

Deploy this to a new entry: `design-system/webpack.config.js` → `filename: 'remoteEntry.v2.js'`.

**Step 2:** Keep the shell pointing to `remoteEntry.js` (v1). Update `checkout-mfe` to point to `remoteEntry.v2.js`.

**Step 3:** Open the app. Observe: the Checkout MFE's button renders without the correct variant styles. The Catalog MFE's button still works. Both are mounted simultaneously.

Document in `docs/notes/design-system-breaking-change.md`:
- What the user sees vs. what the developer sees in the console
- Why deploying a renamed prop in a federated remote is more dangerous than in an npm package
- How version-pinned remote URLs prevent a single deploy from breaking all consumers simultaneously
- The 90-day deprecation window pattern: what does the Design System team maintain during the migration?

---

### Task 7.4 — CSS Token Governance

The design system injects CSS tokens into `:root`. Any remote that hard-codes `color: #0055cc` instead of using `var(--color-primary)` is opting out of the governance contract.

Audit all your MFEs. Find any hard-coded color or spacing values. Replace them with CSS custom properties from the design system token sheet.

Add a lint rule to enforce this. Create `.stylelintrc.json` in the design system directory:
```json
{
  "rules": {
    "color-no-hex": [true, { "severity": "warning" }],
    "declaration-property-value-disallowed-list": {
      "color": ["/^#/", "/^rgb/"],
      "background-color": ["/^#/", "/^rgb/"]
    }
  }
}
```

Document in `docs/notes/design-system-governance.md`: how do you enforce this rule in a CI pipeline when each MFE has its own pipeline and the linting config lives in the design system repo?

---

## Phase 8 — Shared Authentication *(Week 3–4, ~2–3 hrs)*

> **Learning objective:** Implement a single auth source of truth and understand the security constraints that microfrontend auth imposes.

### Task 8.1 — Shell-Owned Auth Flow

In `shell/src/auth.ts`:

```ts
export interface User { id: string; name: string; roles: string[]; }

let cachedUser: User | null = null;

export async function initAuth(): Promise<User | null> {
  // Real system: fetch('/api/me', { credentials: 'include' })
  // The credentials: 'include' flag sends the httpOnly cookie — the JWT never
  // touches JavaScript land. No MFE can steal it.
  await new Promise(r => setTimeout(r, 200)); // simulate async validation
  const user: User = { id: 'usr_01', name: 'Alice', roles: ['customer'] };
  cachedUser = user;
  mfeEmit('mfe:auth:ready', user);
  return user;
}

export function getToken(): string | null {
  // Returns null — the token lives in an httpOnly cookie, not accessible to JS.
  // This is the correct answer. Any other implementation is wrong.
  return null;
}
```

The shell must call `initAuth()` before any route renders. No MFE calls its own `/api/me`.

---

### Task 8.2 — Auth Consumption in Remotes

In each MFE, consume auth state via the event bus:

```tsx
// checkout-mfe/src/CheckoutRoot.tsx
const [user, setUser] = useState<User | null>(null);

useEffect(() => {
  return mfeOn<User>('mfe:auth:ready', (u) => setUser(u));
}, []);
```

**Validation:** Add a 600ms artificial delay to the Checkout MFE's mount. The user object must be available on first render via the last-state cache — the component must not show a null-user state for 600ms.

**Token refresh:** Implement a background interval in the shell that fires `mfe:auth:refreshed` every 15 minutes. No MFE should own a token refresh timer.

---

### Task 8.3 — Security Self-Assessment

Answer in `docs/notes/auth-security-notes.md`:

1. Why must the JWT live in an `httpOnly` cookie and **not** `localStorage`?
2. In a federated system where any remote's code executes in the same browser origin, how many attack surfaces does `localStorage` token storage create? What is the blast radius of a single compromised remote?
3. What prevents a malicious third-party MFE from calling `mfeEmit('mfe:auth:ready', { id: 'admin', roles: ['superadmin'] })` and escalating privilege?
4. The `mfe:auth:ready` event fires before some remotes mount (late-subscriber problem). How does your last-state cache prevent this — and what is the cache's own security risk if an attacker can write to it?

Write the answers in your own words. These are the questions that will come up in a security review.

---

## Phase 9 — Testing Strategy *(Week 4, ~5–6 hrs)*

> **Learning objective:** Build the full four-layer MFE testing pyramid. Understand exactly what each layer catches — and what it cannot catch, no matter how many tests you write.

### Task 9.1 — Unit Tests (Per-MFE, Fully Isolated)

In each MFE, set up **Vitest** + React Testing Library:

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

Write tests for:
- `catalog-mfe`: A `<ProductCard>` component that fires `mfe:catalog:item-added` when the button is clicked. Assert the event is dispatched with the correct product ID in its `detail`.
- `cart-mfe`: The `<CartWidget>` renders count `0` initially, then updates to `3` when `mfe:cart:updated` is dispatched with `{ count: 3 }`.
- `checkout-mfe`: A `<CartSummary>` that renders the correct item count from component state.
- `shell/src/mfe-event-bus.ts`: Pure TypeScript unit tests — no DOM, no remotes. Test `mfeOn` replays the cached state for late subscribers.

**Hard rule:** No test in `catalog-mfe/` may import from `checkout-mfe/` or `shell/`. Each MFE's test suite must be completely self-contained and runnable with all other dev servers off.

---

### Task 9.2 — Integration Tests (Shell + Mocked Remotes)

In `shell/`, test the shell's own behavior with remotes replaced by lightweight mocks:

```tsx
// shell/src/__tests__/shell-routing.test.tsx
// Jest config must resolve 'catalogApp/CatalogRoot' as a module alias

jest.mock('catalogApp/CatalogRoot',  () => ({ default: () => <div>Mock Catalog</div> }));
jest.mock('checkoutApp/CheckoutRoot',() => ({ default: () => <div>Mock Checkout</div> }));
jest.mock('cartApp/CartWidget',      () => ({ default: () => <span data-testid="cart">🛒 0</span> }));

test('navigating to /catalog renders the Catalog mount point', async () => { /* ... */ });

test('error boundary shows MFE name when remote module throws on import', async () => {
  jest.mock('checkoutApp/CheckoutRoot', () => {
    throw new Error('Remote module not found');
  });
  // render shell, navigate to /checkout
  // assert: "Checkout is temporarily unavailable" is in the document
  // assert: the nav and /catalog route still render correctly
});
```

**Validation:** All shell integration tests pass with every MFE dev server off.

---

### Task 9.3 — Contract Test (Consumer-Driven, Without Pact)

Create `docs/contracts/shell-consumes-checkout.json`:
```json
{
  "consumer": "shell",
  "provider": "checkoutApp",
  "version": "1",
  "interactions": [
    { "type": "exposes",     "module": "./CheckoutRoot" },
    { "type": "fires_event", "event": "mfe:checkout:complete", "detail_keys": ["orderId", "total"] },
    { "type": "fires_event", "event": "mfe:checkout:abandoned", "detail_keys": ["cartId"] }
  ]
}
```

Create `docs/contracts/shell-consumes-cart.json`:
```json
{
  "consumer": "shell",
  "provider": "cartApp",
  "version": "1",
  "interactions": [
    { "type": "exposes",     "module": "./CartWidget" },
    { "type": "fires_event", "event": "mfe:cart:updated", "detail_keys": ["count", "items"] }
  ]
}
```

Write `scripts/verify-contract.js` that:
1. Reads a contract JSON passed as a CLI argument
2. Reads the provider's `webpack.config.js` and verifies all `exposes` entries exist
3. Greps the provider's `src/` directory for each `fires_event` entry
4. Exits `1` if any check fails, with a descriptive message naming the broken interaction

Add this to the checkout MFE's `package.json`:
```json
"scripts": {
  "test:contract": "node ../../scripts/verify-contract.js ../../docs/contracts/shell-consumes-checkout.json"
}
```

**Validation:** Rename `./CheckoutRoot` to `./CheckoutRootV2` in the checkout webpack config. Run `npm run test:contract` — it must exit `1` and name the broken module.

---

### Task 9.4 — Per-MFE E2E (Standalone Remote Testing)

This is the layer most engineers skip — and the one that provides the most ROI per test written.

Each MFE writes Playwright tests that run **against its own dev server alone**. The shell is not booted. The shell's `remoteEntry.js` is intercepted and aborted:

```ts
// checkout-mfe/e2e/checkout-flow.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Intercept the shell's remote — we are testing the checkout MFE in isolation
  await page.route('**/shell/remoteEntry.js', route => route.abort());
});

test('shipping form navigates to payment on submit', async ({ page }) => {
  // Boot only the checkout-mfe dev server (localhost:3003)
  await page.goto('http://localhost:3003/checkout/shipping');
  await page.fill('[data-testid="street"]', '123 Main St');
  await page.click('[data-testid="next"]');
  await expect(page).toHaveURL(/\/checkout\/payment/);
});

test('confirm page fires mfe:checkout:complete event', async ({ page }) => {
  await page.goto('http://localhost:3003/checkout/confirm');
  const eventFired = page.waitForEvent('console');
  await page.click('[data-testid="place-order"]');
  // Assert that the console received the event (or use page.evaluate to check window events)
});
```

**Validation:** These tests pass with only `checkout-mfe` running. The shell server must be off.

Document in `docs/notes/per-mfe-e2e.md`:
- Why is this faster and more reliable than booting the full system?
- What class of bugs can this test catch that unit tests cannot?
- What class of bugs can this test **not** catch that the full-system E2E (Task 9.5) can?

---

### Task 9.5 — Full-System E2E Smoke Test

Write **one** Playwright test that boots the full system (all six servers) and validates the critical path only:

```
1. Open http://localhost:3000
2. Navigate to /catalog — assert a product card is visible
3. Click "Add to Cart" — assert the cart widget in the nav updates its count
4. Navigate to /checkout/cart — assert the cart item is present
5. Navigate to /account — assert the authenticated user's name is displayed
```

Document in `docs/notes/e2e-cost.md`:
- Runtime of this test vs. the per-MFE E2E tests combined
- What happens if the cart-mfe dev server takes 8 seconds to start?
- Why this test is not a replacement for the contract tests in Task 9.3
- What would your CI strategy be: which tests run on every PR, which run only on merge to main?

---

## Phase 10 — CI/CD Pipeline *(Week 4–5, ~3–4 hrs)*

> **Learning objective:** Independent deployability is meaningless without independent CI pipelines. Each MFE must have its own pipeline that deploys without coordinating with any other team.

### Task 10.1 — Per-Remote GitHub Actions Pipeline

Create `.github/workflows/catalog-mfe.yml`:

```yaml
name: Catalog MFE — CI/CD

on:
  push:
    paths:
      - 'catalog-mfe/**'  # Only triggered by changes in this MFE's directory
      - '.github/workflows/catalog-mfe.yml'

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: catalog-mfe

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: catalog-mfe/package-lock.json

      - name: Install
        run: npm ci

      - name: Unit Tests
        run: npm run test

      - name: Contract Verification
        run: npm run test:contract
        # Blocks deploy if shell's consumer contract is violated

      - name: Production Build
        run: npm run build
        env:
          NODE_ENV: production
          MFE_VERSION: ${{ github.sha }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: catalog-mfe-dist
          path: catalog-mfe/dist/
```

Create identical pipelines for `cart-mfe.yml`, `checkout-mfe.yml`, `account-mfe.yml`, `design-system.yml`, and `shell.yml`.

**Critical rule:** The `paths` filter ensures the Catalog team's CI only runs when Catalog files change. A commit to `checkout-mfe/` must **not** trigger the catalog pipeline. This is the CI embodiment of independent deployability.

---

### Task 10.2 — Deploy Gate: Contract-First

The contract verification step in Task 10.1 runs **before** the build. If it fails, the build does not run. The deploy does not happen. The developer gets a clear failure message naming the broken interaction.

Trigger the gate deliberately: rename an exposed module in `checkout-mfe`, push to a branch. Observe the CI pipeline fail at the contract step, not at runtime.

Document in `docs/notes/ci-contract-gate.md`:
- At what step in the pipeline did the failure surface?
- How does this differ from a runtime failure in production (where does the developer learn about the break)?
- What is the cost difference between a CI failure and a production user seeing a blank screen?

---

### Task 10.3 — The Shell Pipeline Is Special

The shell's pipeline has a different trigger and a different risk profile:

```yaml
# .github/workflows/shell.yml
on:
  push:
    paths:
      - 'shell/**'
      - 'docs/contracts/**'  # Shell also re-runs if any contract changes
```

The shell pipeline must run the integration tests (Task 9.2) — mocked remotes, no servers needed.

Document in `docs/notes/shell-pipeline-notes.md`:
- Why does a contract file change trigger the shell pipeline?
- The shell is the only app where a bug affects all users simultaneously. What additional CI gates would you add to the shell pipeline that you would not add to a remote pipeline?
- How do you prevent the shell from becoming a coordination bottleneck if 5 teams file PRs against it simultaneously?

---

### Task 10.4 — Dev vs. Prod Remote URLs in CI

The shell's webpack config currently has `http://localhost:300X` as remote URLs. Production deploys must use CDN URLs. Implement the environment split:

```js
// shell/webpack.config.js
const isProd = process.env.NODE_ENV === 'production';
const CDN = 'https://cdn.dockermart.io';

remotes: {
  catalogApp:   isProd ? `catalogApp@${CDN}/catalog/remoteEntry.js`   : 'catalogApp@http://localhost:3001/remoteEntry.js',
  cartApp:      isProd ? `cartApp@${CDN}/cart/remoteEntry.js`         : 'cartApp@http://localhost:3002/remoteEntry.js',
  checkoutApp:  isProd ? `checkoutApp@${CDN}/checkout/remoteEntry.js` : 'checkoutApp@http://localhost:3003/remoteEntry.js',
  accountApp:   isProd ? `accountApp@${CDN}/account/remoteEntry.js`   : 'accountApp@http://localhost:3004/remoteEntry.js',
  designSystem: isProd ? `designSystem@${CDN}/design-system/remoteEntry.js` : 'designSystem@http://localhost:3005/remoteEntry.js',
}
```

Document in `docs/notes/remote-url-strategy.md`: what are the limitations of hard-coding remote URLs at compile time? What is a "Module Federation Remote Registry" and when does your system need one?

---

## Phase 11 — Deployment & Observability *(Week 5, ~4–5 hrs)*

> **Learning objective:** Make the system independently deployable with version pinning, feature-flagged rollouts, and error attribution per remote.

### Task 11.1 — Production Build Configuration

In each MFE's webpack config, implement the production/dev split:

```js
const isProd = process.env.NODE_ENV === 'production';

output: {
  publicPath: isProd ? 'auto' : `http://localhost:${PORT}/`,
  // remoteEntry.js intentionally has NO contenthash — it must be a stable, cacheable URL
  // All other chunks get contenthash for long-term CDN caching
  filename:      isProd ? '[name].[contenthash].js'       : '[name].js',
  chunkFilename: isProd ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
  clean: true,
}
```

Run `NODE_ENV=production npm run build:all` from the workspace root. Confirm:
- `remoteEntry.js` has no contenthash suffix
- All other JS chunks have contenthash suffixes
- No remote bundle references `localhost` in any chunk

**Question to document:** Why does `remoteEntry.js` intentionally omit the content hash while all other chunks use `[contenthash]`? What breaks if `remoteEntry.js` gets a contenthash?

---

### Task 11.2 — Versioned Remote Entry Points

Simulate a breaking change in the Checkout remote:

1. In `checkout-mfe/webpack.config.js`, emit a second entry: add a `ModuleFederationPlugin` config that also writes `remoteEntry.v2.js`
2. In v2, rename the exposed module from `./CheckoutRoot` to `./CheckoutRoot_v2`
3. Point the shell to `remoteEntry.v2.js`
4. Confirm it breaks (contract violation surfaced at runtime — before your CI gate catches it)
5. Roll back the shell to `remoteEntry.js` (v1)
6. Verify the app works on v1 while v2 is still deployed alongside it

**The learning:** Both versions coexist in the same CDN bucket. The shell, not the Checkout team, controls which version users receive. Zero coordination required for the rollback.

---

### Task 11.3 — Feature-Flagged Remote Version

Implement a client-side feature flag that routes a percentage of users to v2:

```ts
// shell/src/remote-resolver.ts
function hashUserId(id: string): number {
  return id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

export function resolveRemoteUrl(remoteName: string, userId: string): string {
  const flags = (window as any).__MFE_FLAGS__ ?? {};
  const rollout = Number(flags[`${remoteName}_v2_rollout`] ?? 0);
  const bucket = hashUserId(userId) % 100;
  const CDN = 'https://cdn.dockermart.io';
  return bucket < rollout
    ? `${remoteName}@${CDN}/${remoteName}/v2/remoteEntry.js`
    : `${remoteName}@${CDN}/${remoteName}/v1/remoteEntry.js`;
}
```

Since Module Federation remote URLs are resolved at compile time, document why this function cannot directly patch the webpack `remotes` config at runtime, and describe the `import(/* webpackIgnore: true */ url)` dynamic import pattern as the production workaround.

---

### Task 11.4 — Error Attribution

In the shell's `RemoteErrorBoundary`, add structured error logging:

```tsx
componentDidCatch(error: Error, info: React.ErrorInfo) {
  const mfeVersion = (window as any).__MFE_VERSIONS__?.[this.props.name] ?? 'unknown';
  // In production: replace console.error with your Sentry/Datadog client
  console.error('[MFE Error]', {
    message:   error.message,
    component: info.componentStack,
    tags: {
      'mfe.name':    this.props.name,
      'mfe.version': mfeVersion,
      'mfe.remote':  `https://cdn.dockermart.io/${this.props.name.toLowerCase()}/remoteEntry.js`,
    },
    timestamp: new Date().toISOString(),
  });
}
```

Each MFE injects its own version at mount time:
```ts
// checkout-mfe/src/bootstrap.tsx
(window as any).__MFE_VERSIONS__ ??= {};
(window as any).__MFE_VERSIONS__['checkoutApp'] = process.env.MFE_VERSION ?? 'dev';
// MFE_VERSION is set at build time in CI: MFE_VERSION=${{ github.sha }}
```

**Validation:** Kill the checkout dev server. The error boundary must fire and log an object with `mfe.name: 'Checkout'` and `mfe.version: 'dev'`.

---

## Phase 12 — Performance *(Week 5, ~2–3 hrs)*

> **Learning objective:** Measure the real cost of a micro-frontend system and apply the five performance contracts.

### Task 12.1 — Bundle Analysis

Install `webpack-bundle-analyzer` in each MFE. Run a production build and open each report.

**What to find and fix:**
- [ ] `react` or `react-dom` appearing inside any remote bundle (must be absent when `shared` is correct)
- [ ] Any utility library (`lodash`, `axios`, `date-fns`) present in more than one remote's bundle
- [ ] Any remote bundle exceeding 150KB gzipped
- [ ] The design system's `tokens.css` being duplicated in multiple bundles

For each finding: document what you found, why it happened, and what config change fixed it.

---

### Task 12.2 — Speculative Prefetch

In the Catalog MFE, when the user hovers over "Add to Cart", speculatively prefetch the Checkout remote:

```ts
let prefetched = false;

export function prefetchCheckout() {
  if (prefetched) return;
  prefetched = true;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = 'http://localhost:3003/remoteEntry.js';
  document.head.appendChild(link);
}
```

Measure time-to-interactive for `/checkout` with and without the prefetch using the Network tab (disable cache). Document the delta and whether it differs on a throttled "Slow 4G" connection.

---

### Task 12.3 — Lighthouse Audit

Run Lighthouse on the shell's initial load:
```bash
npx lighthouse http://localhost:3000/catalog --output json --output-path ./docs/lighthouse-report.json
```

Record: LCP, TBT, Performance score.

If LCP > 3s: identify the blocking resource in the waterfall. The most common culprit is `remoteEntry.js` files fetched sequentially on shell boot. Fix: ensure the shell's initial bundle contains zero remote module imports — all remotes must be loaded only via `React.lazy` behind a route match (or eagerly in `useEffect`, as with the Cart widget).

Document your before/after scores in `docs/notes/performance-audit.md`.

---

## Phase 13 — Retrospective & Monorepo Revisit *(Week 5–6, ~2 hrs)*

> **Learning objective:** Complete the feedback loop. Make evidence-based decisions rather than architecture-by-hype.

### Task 13.1 — Friction Log Retrospective

Return to `docs/notes/phase-1-friction.md`. Add a third section: "Phase 13 — Retrospective."

Answer:
1. How many times did you run `npm install` in multiple directories for the same dependency change?
2. How many times did a change in one MFE require manually restarting another MFE's dev server?
3. How many separate GitHub Actions pipeline files do you now maintain for what is logically one product?
4. At what team size does the Module Federation complexity start paying for itself — and what is the precise signal you would watch for?
5. Would Nx's `affected` command, `nx run-many`, and automatic dependency graph have saved meaningful time during this project? Be specific.

---

### Task 13.2 — What Breaks at Scale

Sketch answers in `docs/notes/scale-problems.md`. There are no single correct answers — quality of reasoning matters:

1. **Stale remotes:** A user opens DockerMart and leaves the tab open for 3 days. The Checkout team deploys 8 times. The user clicks "Checkout." What does Module Federation fetch — v1 or v8? What does the user see if v8 renamed an exposed module that the shell's cached `remoteEntry.js` references? How do you handle this?

2. **Shared library upgrade:** React 19 is released. How do you upgrade all six apps to React 19 without causing a duplicate-React runtime crash during the migration window when some remotes are on React 18 and others on React 19?

3. **Design system version skew:** The shell pins `designSystem` to `v1/remoteEntry.js`. The Checkout MFE independently pins it to `v2/remoteEntry.js`. Both versions load simultaneously. What CSS conflicts arise? Which `--color-primary` value wins in `:root`? How do you prevent this?

4. **Remote registry:** The shell's webpack config hard-codes all six remote URLs. You grow to 20 teams. Every time a new MFE is created, the shell must be updated and redeployed. What is the production-grade alternative? (Keywords: Module Federation Remote Registry, dynamic `__webpack_init_sharing__`)

5. **Single-SPA vs. Module Federation:** A new team wants to embed an Angular widget into the DockerMart shell (which is React 18). What are your options? What does `single-spa` give you that Module Federation alone does not?

---

## Completion Criteria

You have completed this project when all of the following are true:

| # | Criterion |
|---|-----------|
| 1 | All six apps (shell + 5 MFEs) start independently with `npm run dev` |
| 2 | Root `npm run dev` starts all six servers in one command with labeled output |
| 3 | Shell loads Catalog, Checkout, Account via `React.lazy` — no static imports |
| 4 | Cart widget loads eagerly in the shell nav and persists across all route changes |
| 5 | Design system remote is loaded once — no duplicate copies in any bundle |
| 6 | Killing any one MFE's dev server shows an error boundary — does not crash the shell or other MFEs |
| 7 | Cart state is communicated via the event bus — no props passed to MFE root components |
| 8 | A 600ms late-mounting MFE receives auth state from cache on first render — no null flash |
| 9 | No CSS leakage between any two MFEs — confirmed by triggering it then fixing it |
| 10 | Design system v2 breaking change deployed without crashing MFEs still on v1 |
| 11 | TypeScript compiles without errors — `declarations.d.ts` covers all federated imports |
| 12 | Unit tests pass with all MFE dev servers off |
| 13 | Contract verification script exits `0` when satisfied; exits `1` on a breaking rename |
| 14 | Per-MFE Playwright tests pass with only that MFE's server running |
| 15 | Each MFE has its own GitHub Actions workflow triggered only by its own directory changes |
| 16 | Production build: chunks have `[contenthash]`, `remoteEntry.js` does not |
| 17 | Bundle analysis shows no duplicate `react`, `react-dom`, or design system in any remote bundle |
| 18 | All four production bugs documented with root cause in your own words |
| 19 | Retrospective answers in `docs/notes/` are written from firsthand experience, not the guide |

---

## Bug Reference Card

| Bug | Symptom | Root Cause | Fix |
|-----|---------|------------|-----|
| **#1 Duplicate React** | "Invalid hook call" in the console | `singleton: true` missing from `shared.react` | Add `singleton: true` to both shell and all remotes |
| **#2 Version Mismatch** | MF warning: "Unsatisfied version" or silent second instance | `requiredVersion` ranges across remotes don't overlap | Align `requiredVersion` across all consumers; use `^major` not exact pins |
| **#3 publicPath** | Lazy chunks 404 in prod; blank white screen | `publicPath` hard-coded to `localhost` in production build | `publicPath: 'auto'` for prod, explicit URL for dev |
| **#4 Eager sync import** | "Shared module not available for eager consumption" | Shared module imported synchronously in `index.js` before MF runtime negotiates | Move all imports to `bootstrap.tsx`; `index.js` is a single `import('./bootstrap')` |

---

## File Structure at Completion

```
micro-frontend/
├── package.json                        ← root: concurrently dev:all, build:all
├── .github/
│   └── workflows/
│       ├── shell.yml
│       ├── catalog-mfe.yml
│       ├── cart-mfe.yml
│       ├── checkout-mfe.yml
│       ├── account-mfe.yml
│       └── design-system.yml
├── scripts/
│   └── verify-contract.js              ← contract verification CLI tool
├── shell/
│   └── src/
│       ├── index.js                    ← import('./bootstrap') only
│       ├── bootstrap.tsx
│       ├── App.tsx                     ← thin shell: auth gate + routes only
│       ├── GlobalNav.tsx               ← mounts CartWidget eagerly
│       ├── mfe-event-bus.ts
│       ├── auth.ts
│       ├── remote-resolver.ts
│       └── declarations.d.ts           ← TypeScript shims for all federated modules
├── catalog-mfe/
│   ├── e2e/                            ← per-MFE Playwright tests (standalone)
│   └── src/
├── cart-mfe/
│   └── src/
│       └── CartWidget.tsx              ← widget, not a page root
├── checkout-mfe/
│   ├── e2e/
│   └── src/
│       └── CheckoutRoot.tsx            ← owns all /checkout/* subroutes
├── account-mfe/
├── design-system/
│   ├── src/
│   │   ├── tokens.css                  ← all CSS custom properties
│   │   ├── Button.tsx
│   │   ├── Button.module.css
│   │   └── GlobalStyles.tsx
│   └── .stylelintrc.json
└── docs/
    ├── adr/
    │   └── ADR-001-integration-strategy.md
    ├── contracts/
    │   ├── shell-consumes-checkout.json
    │   └── shell-consumes-cart.json
    ├── notes/
    │   ├── phase-1-friction.md
    │   ├── typescript-declarations.md
    │   ├── bug-1-duplicate-react.md
    │   ├── bug-2-version-mismatch.md
    │   ├── bug-3-publicpath.md
    │   ├── bug-4-eager-sync.md
    │   ├── widget-vs-page-mfe.md
    │   ├── prop-drilling-failure.md
    │   ├── broadcast-channel-notes.md
    │   ├── css-leakage-incident.md
    │   ├── css-strategies-comparison.md
    │   ├── design-system-breaking-change.md
    │   ├── design-system-governance.md
    │   ├── auth-security-notes.md
    │   ├── shell-audit.md
    │   ├── per-mfe-e2e.md
    │   ├── e2e-cost.md
    │   ├── ci-contract-gate.md
    │   ├── shell-pipeline-notes.md
    │   ├── remote-url-strategy.md
    │   ├── performance-audit.md
    │   └── scale-problems.md
    ├── requirements.md                 ← this file
    └── microfrontend_guide.md          ← reference material
```

---

## How to Use the Reference Guide

[`microfrontend_guide.md`](./microfrontend_guide.md) maps to phases as follows. Read each chapter **after** completing the corresponding phase — not before:

| Phase | Guide Chapters |
|-------|---------------|
| 1 | Ch. 1 (Monolith vs. MFE), Ch. 2 (Integration strategies) |
| 2 | Ch. 3 (Module Federation in depth) |
| 3 | Ch. 4 (Shell architecture), Ch. 8 (Routing) |
| 4 | Ch. 4 (Shell), Ch. 2 (iframe vs. MFE comparison) |
| 5 | Ch. 5 (Cross-MFE communication), Ch. 7 (Auth state) |
| 6 | Ch. 6 (CSS isolation) |
| 7 | Ch. 9 (Federated design system) |
| 8 | Ch. 7 (Shared state & authentication) |
| 9 | Ch. 10 (Testing strategy) |
| 10 | Ch. 11 (Deployment) |
| 11 | Ch. 11 (Deployment & observability) |
| 12 | Ch. 12 (Performance) |
| 13 | Ch. 13 (Summary), Ch. 2 (Monorepo decision) |

---

*Requirements authored for DockerMart micro-frontend learning track. Revised: 2026-06.*
