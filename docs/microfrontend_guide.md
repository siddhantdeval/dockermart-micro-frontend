# Classroom Session: Micro-Frontends (The City of Independent Districts)

---

## 👨‍🏫 Welcome to the Classroom!
*"Welcome, frontend engineers! We've already studied React component architecture, state management, and how to build polished single-page applications. But what happens when your team grows from 5 engineers to 50, all pushing code into the same monolithic frontend repository? The build takes 8 minutes. A single broken import redlines the entire deploy. Two teams want to ship at 9 AM and they're fighting over `main`. Today, we are learning **Micro-Frontends** — the architectural pattern that lets you decompose a frontend monolith into independently deployable UI slices, each owned by a different team, assembled into a seamless product at runtime. We will use JavaScript (Node.js) and TypeScript throughout — no Python, no Go."*

---

## 📖 Chapter 1: The Frontend Monolith vs. The City of Districts
### 🗺️ Progressive Importance: 🟢 Beginner (Core Concept)

In a **Frontend Monolith**, every page, component, and route lives in a single React application. One `npm run build`, one deploy pipeline, one massive `node_modules`. For a team of 3, this is perfect — it is fast, simple to reason about, and cheap to run.

In a **Micro-Frontend Architecture**, the application is divided into independently owned and deployed UI "districts." The Checkout team owns their slice. The Product Catalog team owns theirs. The Navigation team owns the shell. No team steps on another's deploy pipeline.

The transition becomes necessary when:
* **Build and test times** grow beyond ~5 minutes, slowing every deploy
* **Team blast radius** means a bug in the `Cart` component can block the `Search` team from shipping
* **Technology lock-in** forces an entire 3-year-old codebase to upgrade from React 17 to React 18 as a single coordinated effort
* **The Central Problem:** A monolithic frontend couples the delivery cadence of independent product teams, turning organizational problems into technical ones.

### ⛔ When NOT to Federate

Before reaching for micro-frontends, use this decision table. Most teams who regret micro-frontends skipped it.

| Signal | Recommendation |
|---|---|
| Fewer than 3–4 independent product teams | Stay monolith or use a monorepo |
| All teams deploy on the same weekly release cycle | Monorepo with Nx or Turborepo |
| Heavy SEO requirements, content-heavy pages | Server-Side Composition (not Module Federation) |
| Two or more teams are blocking each other's production deploys weekly | Module Federation is justified |
| Different tech stacks must coexist (React + Vue + Angular) | `single-spa` or Web Components wrapper |
| Product is an internal tool or admin panel | Stay monolith — complexity cost vastly outweighs benefit |

### 🛠️ Hitting the Code: Lab 1
**Goal:** Feel the difference between a co-located import and a remote, runtime-loaded module.
1. Save as `import-comparison.js` and run it with Node.js:
   ```javascript
   // BEFORE: Monolith — a co-located import. Fast, synchronous, guaranteed.
   function CheckoutButton() { return { label: 'Buy Now' }; }
   const btn = CheckoutButton();
   console.log("🏠 Monolith import:", btn ? "✅ Loaded instantly" : "❌ Missing");

   // AFTER: Micro-Frontend — a remote, async import. Can fail. Can be any version.
   async function loadRemoteCheckout() {
     try {
       const remoteUrl = "https://checkout.myapp.com/remoteEntry.js";
       console.log(`🌐 Fetching remote module from: ${remoteUrl}`);
       await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network latency
       // Simulating a remote load failure (30% chance)
       if (Math.random() > 0.7) throw new Error("Remote chunk 404: checkout team not deployed yet");
       console.log("✅ Remote CheckoutButton loaded successfully");
     } catch (err) {
       console.error("❌ Remote load failed:", err.message);
       console.log("♻️ Falling back to local stub component");
     }
   }

   loadRemoteCheckout();
   ```

---

## 📖 Chapter 2: Integration Strategies & The Monorepo Question
### 🗺️ Progressive Importance: 🟡 Intermediate (Architecture Decisions)

*"Before a city district can function, the urban planners must decide: will each district connect via a shared rail network, or will every road be independently built? The wrong decision here costs years of refactoring — and most teams make it on day one."*

**The Problem:** "Micro-Frontend" is not a single technology — it is an architectural philosophy with several valid implementation strategies, and a critical predecessor question: *should you federate at all, or should you modularize within a monorepo first?*

### The Monorepo vs. Polyrepo vs. Module Federation Triangle

| Approach | How It Works | Best For | The Hidden Cost |
|---|---|---|---|
| **Monorepo** (Nx / Turborepo) | All MFEs in one git repo; shared as internal `@scope/ui` packages; `nx affected` only builds changed apps | Teams &lt; 4, same release cadence, shared infra | Still one deploy pipeline; affected calculation fails on deep deps |
| **Polyrepo + npm packages** | Each MFE is its own git repo, published to npm | Strict team ownership of source | Shell must bump version + redeploy for every remote patch |
| **Module Federation** | Remotes deployed independently; shell fetches them at runtime | 4+ teams, independent deploy cadences | Webpack/Vite config complexity; runtime coupling is implicit |

> **Rule of thumb:** Start with a **monorepo**. Graduate to Module Federation only when two teams are genuinely blocking each other's deploys more than once per week.

### The Four Integration Strategies

* **Build-Time Integration (npm packages):** Micro-frontends are published as npm packages. Simple, type-safe — but defeats the purpose: all teams must coordinate releases, and the shell must be rebuilt and redeployed whenever *any* remote changes.
  * **Best for:** Design systems, internal shared component libraries.

* **Server-Side Composition (Edge / SSR stitching):** The server assembles HTML fragments from different team endpoints before sending a single document to the browser. Used by Amazon, Zalando, and IKEA.
  * **Best for:** SEO-critical apps, e-commerce, content-heavy sites where First Contentful Paint is a revenue metric.

* **Client-Side Composition (Module Federation):** Micro-frontends are loaded at runtime by the browser. Each remote is its own independently deployed JavaScript bundle.
  * **Best for:** Rich SPAs with heavy interactivity, platform products where teams deploy independently multiple times per day.
  * **Key Tools:** `Webpack 5 ModuleFederationPlugin` or `@originjs/vite-plugin-federation` for Vite projects.

* **iframe Composition:** Each micro-frontend runs in a fully sandboxed `<iframe>`. Hard CSS and JS isolation — no shared globals, no style leakage. But: cross-frame communication requires `postMessage`, scroll and focus management is painful, and iframes create accessibility nightmares. Used by Spotify's embedded player, legacy enterprise dashboards.
  * **Best for:** True third-party embeds where security isolation is non-negotiable. Avoid for first-party team-owned MFEs.

**The Anti-Pattern: Choosing Build-Time Integration for "Independence".**
Teams adopt npm package integration thinking it gives them autonomy. In practice, the shell app becomes a coordination point: every consuming team must bump the version, rebuild, and redeploy every time any remote publishes a patch. You've recreated the monolith's coupling — just with more `package.json` overhead and slower feedback loops.

**The Multi-Framework Trap.**
The most commonly cited MFE advantage is "run React and Vue side by side." In theory this enables gradual migrations. In practice: CSS isolation between frameworks is brutal (each framework generates its own class naming conventions), `CustomEvent` payloads must serialize data that React refs and Vue reactivity objects cannot, and your bundle size doubles. Only reach for multi-framework MFEs via `single-spa` or Web Component wrappers when you have an active legacy codebase to migrate — not as a greenfield default.

### 🛠️ Hitting the Code: Lab 2
**Goal:** Compare the structural difference between the three code-based strategies.
1. No install needed. Study these three layout patterns:
   ```
   // ── STRATEGY 1: Monorepo (Nx) ──────────────────────────────────────────
   // apps/
   //   shell/           → hosts the app
   //   checkout/        → internal Nx app, shared via @scope/checkout
   //   catalog/         → internal Nx app, shared via @scope/catalog
   // libs/
   //   ui/              → shared design system
   // nx.json → "affected" only rebuilds what changed
   //
   // Deployment: one CI pipeline, coordinated releases. No federation.

   // ── STRATEGY 2: Build-Time (npm packages, Polyrepo) ───────────────────
   // shell/package.json:
   //   "dependencies": { "@team/checkout": "1.4.2" }   ← VERSION PIN
   //   import { Checkout } from '@team/checkout'        ← STATIC IMPORT
   //
   // Checkout ships → shell team bumps version → rebuild → redeploy shell.
   // No true independence: 3-step ceremony per remote patch.

   // ── STRATEGY 3: Client-Side (Module Federation) ───────────────────────
   // shell/webpack.config.js:
   //   remotes: {
   //     checkoutApp: "checkout@https://checkout.myapp.com/remoteEntry.js"
   //   }
   // shell/src/App.tsx:
   //   const Checkout = React.lazy(() => import('checkoutApp/Checkout'));
   //
   // Checkout team deploys → shell picks it up on next user page load.
   // ✅ True independence: zero shell involvement.
   ```

---

## 📖 Chapter 3: Webpack Module Federation In Depth (The District Power Grid)
### 🗺️ Progressive Importance: 🟡 Intermediate (Module Federation)

*"Imagine every district in our city generates its own electricity. When the Shell (the city grid) needs power from the Checkout District, it doesn't need to rewire anything — it just plugs into that district's live power socket. The district can upgrade its generators independently, and the grid adapts at runtime."*

**The Anti-Pattern: Duplicating React across every remote.**
When teams first configure Module Federation, they often forget to mark `react` and `react-dom` as `shared` singletons. The result: the shell loads React 18.2, the checkout remote loads its own copy of React 18.2, and the cart remote loads React 17.0 — all on the same page. React throws a cryptic runtime error: *"You may be seeing this because you're using a version of React that does not support Hooks in the same application as another copy of React."* This is extremely hard to debug in production, and it happens because every engineer's local `localhost` dev works fine.

**The Solution: `ModuleFederationPlugin` with Shared Singletons.**

Configure the plugin in both the **host (shell)** and each **remote's** `webpack.config.js`:

* **`name`**: A globally unique identifier for this remote's module namespace.
* **`filename: "remoteEntry.js"`**: The manifest file the shell fetches to discover what modules this remote exposes.
* **`exposes`**: The components this remote makes available to the outside world.
* **`shared`**: Dependencies that should only ever have one runtime instance. Mark `react`, `react-dom`, and `react-router-dom` as `singleton: true` and `eager: false`.
* **`singleton: true`**: If two remotes declare incompatible versions, Module Federation uses the highest compatible version rather than loading two copies. This is the guard against the React duplicate bug.
* **`eager: false`**: Defers loading shared modules until they are actually needed. Setting `eager: true` on a remote causes it to include the shared library in its initial synchronous chunk — which can produce a mysterious "Shared module is not available for eager consumption" error at runtime when the module was already initialized by the shell.

> **📦 Vite users:** Replace `ModuleFederationPlugin` with `federation()` from `@originjs/vite-plugin-federation`. The config shape is nearly identical — substitute `vite.config.ts` for `webpack.config.js`. The `@module-federation/vite` package (Module Federation 2.0) unifies Webpack and Vite under one API if your org uses both build tools.

### 🙋‍♂️ Student Q&A

**Student (Daniel):** *"If `eager: false` is safer, why does every Stack Overflow answer tell me to set `eager: true` in the remote's entry point to fix the 'Shared module not available' error? Am I supposed to ignore that advice?"*

**Teacher:** *"You've hit the most cargo-culted fix in Module Federation. Setting `eager: true` in the remote's `bootstrap.js` is a real workaround — but it fixes a symptom, not the cause. The real cause is that the remote's `index.js` is importing shared modules synchronously before the Module Federation runtime has negotiated which version to use. The correct fix is to move all application imports into a `bootstrap.js` file and make `index.js` a single dynamic import: `import('./bootstrap')`. This gives the MF runtime one async tick to resolve versions before any shared module is consumed. The `eager: true` hack works but forces the shared lib into the initial synchronous bundle — which defeats lazy loading for all consumers."*

### 🛠️ Hitting the Code: Lab 3
**Goal:** Study production-grade `ModuleFederationPlugin` configs for a shell and a checkout remote — and understand the `publicPath` trap that breaks every first production deploy.

> **Note:** This is a config reference (Type 3 Snippet). It requires a full project structure to run. Save these files in their respective repos and run `webpack serve` in each.

1. Save as `checkout-remote/webpack.config.js`:
   ```javascript
   const { ModuleFederationPlugin } = require('webpack').container;
   const HtmlWebpackPlugin = require('html-webpack-plugin');

   const isProd = process.env.NODE_ENV === 'production';

   module.exports = {
     mode: isProd ? 'production' : 'development',
     entry: './src/index.js',
     output: {
       // ✅ CRITICAL: Use 'auto' in production so Webpack infers the CDN origin
       // at runtime from the <script> tag. NEVER ship 'http://localhost:3001/'
       // to production — all lazy-loaded chunks will 404 with no useful error.
       publicPath: isProd ? 'auto' : 'http://localhost:3001/',
     },
     plugins: [
       new ModuleFederationPlugin({
         name: 'checkoutApp',                         // Unique global namespace
         filename: 'remoteEntry.js',                  // Manifest the shell fetches
         exposes: {
           './CheckoutPanel': './src/CheckoutPanel',  // Public API of this remote
         },
         shared: {
           react:     { singleton: true, eager: false, requiredVersion: '^18.0.0' },
           'react-dom': { singleton: true, eager: false, requiredVersion: '^18.0.0' },
         },
       }),
       new HtmlWebpackPlugin({ template: './public/index.html' }),
     ],
   };
   ```

2. Save as `checkout-remote/src/index.js` (the bootstrap wrapper that avoids `eager` issues):
   ```javascript
   // ✅ All real imports live in bootstrap.js, not here.
   // This gives Module Federation one async tick to negotiate shared versions
   // before any shared module (like React) is first imported.
   import('./bootstrap');
   ```

3. Save as `shell/webpack.config.js`:
   ```javascript
   const { ModuleFederationPlugin } = require('webpack').container;
   const isProd = process.env.NODE_ENV === 'production';

   module.exports = {
     mode: isProd ? 'production' : 'development',
     entry: './src/index.js',
     output: {
       publicPath: isProd ? 'auto' : 'http://localhost:3000/',
     },
     plugins: [
       new ModuleFederationPlugin({
         name: 'shell',
         remotes: {
           // Dev: hit localhost. Prod: hit the CDN-hosted remote.
           checkoutApp: isProd
             ? 'checkoutApp@https://cdn.myapp.com/checkout/remoteEntry.js'
             : 'checkoutApp@http://localhost:3001/remoteEntry.js',
         },
         shared: {
           react:     { singleton: true, eager: false, requiredVersion: '^18.0.0' },
           'react-dom': { singleton: true, eager: false, requiredVersion: '^18.0.0' },
         },
       }),
     ],
   };
   ```

> ⚠️ **The `publicPath` Production Trap:** Mismatching `publicPath` in production causes all lazy-loaded chunks to fetch from `localhost` — the browser sees a CORS error or a 404, renders a blank white screen, and logs no meaningful message. It is the most common first-deploy failure for MFE teams and the hardest to diagnose without knowing to look for it.

---

## 📖 Chapter 4: The Shell Application & Routing (The City Planning Office)
### 🗺️ Progressive Importance: 🟡 Intermediate (Composition)

*"A city needs a master map — a planning office that knows which district owns which zone, so that when a citizen asks for 'the checkout area,' they're directed correctly. Without it, every district tries to grab land from every other."*

**The Anti-Pattern: Fat Shell Anti-Pattern.**
Teams realize the shell "just does routing," so they start slipping business logic into it: auth middleware, global state management, A/B test flags, analytics event schemas. Within 6 months, the shell has become the new monolith. It must be deployed for every feature change because every team depends on it. The entire point of micro-frontends — independent deployability — is undermined by a shell that knows too much.

**The Solution: The Thin Shell Principle.**

The shell application must own exactly three responsibilities and nothing more:
1. **Global navigation chrome** — the top nav, sidebar, and footer that must be consistent across all districts.
2. **Route-to-remote mapping** — a routing table that maps URL paths to the correct micro-frontend and lazily loads it.
3. **App bootstrapping** — authentication token injection, theme provider, feature flag context. Nothing more.

Each route lazily loads its owning micro-frontend with `React.lazy()` and ``<Suspense>``. If the remote fails to load (network error, bad deploy), the shell catches it with an ``<ErrorBoundary>`` and renders a fallback — the rest of the application continues to function.

### 🛠️ Hitting the Code: Lab 4
**Goal:** Build a thin shell router that lazily mounts three micro-frontends with per-remote error isolation.
1. In `shell/src/App.tsx`:
   ```tsx
   import React, { Suspense } from 'react';
   import { BrowserRouter, Routes, Route } from 'react-router-dom';

   // 🌐 Remote micro-frontends loaded at RUNTIME — not from node_modules
   const CatalogApp  = React.lazy(() => import('catalogApp/CatalogRoot'));
   const CheckoutApp = React.lazy(() => import('checkoutApp/CheckoutRoot'));
   const AccountApp  = React.lazy(() => import('accountApp/AccountRoot'));

   // Isolates a failing remote — the rest of the shell keeps working
   class RemoteErrorBoundary extends React.Component<
     { name: string; children: React.ReactNode },
     { hasError: boolean }
   > {
     state = { hasError: false };
     static getDerivedStateFromError() { return { hasError: true }; }
     render() {
       if (this.state.hasError)
         return <div className="remote-error">⚠️ {this.props.name} is temporarily unavailable.</div>;
       return this.props.children;
     }
   }

   function RemoteMount({ name, children }: { name: string; children: React.ReactNode }) {
     return (
       <RemoteErrorBoundary name={name}>
         <Suspense fallback={<div>⏳ Loading {name}…</div>}>
           {children}
         </Suspense>
       </RemoteErrorBoundary>
     );
   }

   export default function Shell() {
     return (
       <BrowserRouter>
         {/* Shell owns ONLY the global chrome */}
         <nav>🏙️ MyApp — Global Nav (Shell-owned)</nav>
         <Routes>
           {/* Asterisk = route delegation: sub-paths are the remote's problem */}
           <Route path="/catalog/*"  element={<RemoteMount name="Catalog"><CatalogApp /></RemoteMount>} />
           <Route path="/checkout/*" element={<RemoteMount name="Checkout"><CheckoutApp /></RemoteMount>} />
           <Route path="/account/*"  element={<RemoteMount name="Account"><AccountApp /></RemoteMount>} />
         </Routes>
       </BrowserRouter>
     );
   }
   ```

---

## 📖 Chapter 5: Cross-MFE Communication (The District Postal System)
### 🗺️ Progressive Importance: 🔴 Senior (Communication)

*"In a city of independent districts, no district should barge into another's building and rearrange the furniture. But they still need to send messages to each other. That's what the postal system is for — a neutral, decoupled channel that any district can publish to or subscribe from."*

**The Anti-Pattern: Direct React Prop Drilling Across Remotes.**
Engineers who come from monolith thinking try to pass data between micro-frontends the same way they pass props between components: `<CheckoutApp cartItems={shellCartState} onComplete={shellOnComplete} />`. This tightly couples the shell to the internal prop API of every remote. When the Checkout team renames `cartItems` to `lineItems` in their internal refactor, the shell breaks. The shell must now be redeployed with every internal API change of every remote team.

**The Anti-Pattern: Fire-and-Forget Events with No Late-Subscriber Guarantee.**
Remote A fires `mfe:cart:updated` at mount time. Remote B — the Checkout MFE — loads 300ms later because it's behind a `React.lazy()` boundary. Remote B registers its listener *after* the event was already dispatched. The event is silently lost. Remote B renders with stale cart data — a timing bug that only appears at real network latencies, never in `localhost` development. This is the #1 bug engineers ship after learning the Custom Event pattern.

**The Solution: Custom Events + Last-State Cache (The Reliable Postal Bus).**

The browser's native `CustomEvent` API is a zero-dependency, framework-agnostic message bus:

* **Publishing:** Any MFE fires `window.dispatchEvent(new CustomEvent('mfe:cart:updated', { detail: { count: 3 } }))`. It has no knowledge of who listens.
* **Subscribing:** Any other MFE calls `window.addEventListener('mfe:cart:updated', handler)`. Framework-agnostic.
* **Event Namespacing:** Always prefix with `mfe:` and the owning team name: `mfe:cart:updated`, `mfe:auth:ready`. Prevents collisions and makes ownership obvious in logs.
* **Late-Subscriber Fix:** Maintain a module-level last-known-state cache alongside the event bus. Every late-mounting remote calls `getLastState('mfe:cart')` immediately after registering its listener to hydrate from the cache — the same pattern Redux uses with its initial state.
* **Serialization constraint:** `CustomEvent`'s `detail` must be JSON-serializable. No React refs, no functions, no circular objects. If you need to pass a callback, use an event name as a reply channel instead.
* **Cross-tab sync:** Use `BroadcastChannel` instead of `CustomEvent` when events must sync across multiple open browser tabs (e.g., user logs out in Tab A → Checkout in Tab B should also log out). `CustomEvent` is same-page only.

### 🛠️ Hitting the Code: Lab 5
**Goal:** Implement cross-MFE communication with a last-state cache to fix the late-subscriber race condition.
1. Save as `custom-event-bus.js` and run it:
   ```javascript
   const EventEmitter = require('events');
   const mfeBus = new EventEmitter(); // Represents window in a browser

   // ── LAST-STATE CACHE: fixes the late-subscriber race condition ─────────
   const lastState = {};

   function mfeEmit(event, detail) {
     lastState[event] = detail; // Cache before firing
     mfeBus.emit(event, detail);
   }

   function mfeOn(event, handler) {
     mfeBus.on(event, handler);
     // If this remote mounted late, replay the last known state immediately
     if (lastState[event]) {
       console.log(`♻️ Late subscriber: replaying cached state for "${event}"`);
       handler(lastState[event]);
     }
   }

   // ── CATALOG MICRO-FRONTEND: fires first ──────────────────────────────
   function CatalogMFE() {
     console.log("📦 [CatalogMFE] User added item. Emitting cart update...");
     mfeEmit('mfe:cart:updated', { count: 3, lastAdded: 'Nike Air Max' });
   }

   // ── CHECKOUT MFE: mounts 400ms AFTER catalog fires ───────────────────
   function CheckoutMFE() {
     setTimeout(() => {
       console.log("🛒 [CheckoutMFE] Mounted 400ms late. Registering listener...");
       mfeOn('mfe:cart:updated', (detail) => {
         // ✅ Receives cached state even though it missed the original event
         console.log(`🛒 [CheckoutMFE] Cart synced! Count: ${detail.count}, Item: ${detail.lastAdded}`);
       });
     }, 400);
   }

   // ── BROADCAST CHANNEL: cross-tab logout example ───────────────────────
   // (Browser only — shown as pseudocode comment for Node.js context)
   // const logoutChannel = new BroadcastChannel('mfe:auth');
   // logoutChannel.postMessage({ type: 'LOGOUT' });  // Tab A logs out
   // logoutChannel.onmessage = (e) => redirectToLogin(); // Tab B receives it

   CatalogMFE();   // Fires first — CheckoutMFE hasn't mounted yet
   CheckoutMFE();  // Mounts late but still gets the correct cart state
   ```

---

## 📖 Chapter 6: CSS Isolation & Style Leakage (The District Building Code)
### 🗺️ Progressive Importance: 🔴 Senior (Style Architecture)

*"The Catalog District builds a beautiful main street. The new Checkout District opens next door and installs a neon sign whose glare floods the entire block. Nobody warned them their lights would affect the neighbors. The building code exists precisely to prevent this."*

**The Failure Story:** The Checkout team's CSS file contains `* { box-sizing: border-box; margin: 0; }` — a common reset. The moment their remote mounts, every `<input>` in the Catalog MFE loses its margin, and every third-party widget loses its padding. The Catalog team files a P1 incident. The root cause takes 4 hours to find: a CSS reset in a different team's bundle. This happens on first deploy, in production, with real users watching.

**The Anti-Pattern: Global CSS Selectors in Remote Bundles.**
MFE teams write CSS the same way they do in monoliths: `button { background: blue; }`, `.card { padding: 16px; }`. These rules are global. The moment two remotes mount simultaneously, their stylesheets fight for specificity. The last-mounted MFE's stylesheet wins — a non-deterministic outcome that changes depending on network latency.

**The Solution: Four CSS Isolation Strategies (Pick Based on Your Constraints).**

**Strategy 1 — CSS Modules (Default Recommendation):**
Webpack and Vite both support CSS Modules natively. A class named `.button` in `Checkout.module.css` compiles to `.checkoutApp__button__3xK9f` — a globally unique hash. No leakage possible. Works with any framework.
```css
/* checkout/src/Checkout.module.css */
.panel { padding: 24px; }    /* compiles to: .checkoutApp__panel__aB3x */
.button { background: blue; } /* compiles to: .checkoutApp__button__Zq7k */
```
```jsx
import styles from './Checkout.module.css';
export function CheckoutPanel() {
  return <div className={styles.panel}><button className={styles.button}>Pay</button></div>;
}
```

**Strategy 2 — `postcss-prefix-selector` (For Legacy Global CSS):**
For teams with existing global CSS they can't refactor, a PostCSS plugin prefixes every selector at build time:
```css
/* Before (global, leaks everywhere): */
.card { padding: 16px; }

/* After postcss-prefix-selector adds .checkout-app: */
.checkout-app .card { padding: 16px; }
```
Configure the remote's root element with `<div class="checkout-app">` and all styles are scoped to it automatically. Zero code changes to existing CSS.

**Strategy 3 — CSS `@layer` (Modern Specificity Control):**
CSS Cascade Layers (`@layer`) let each MFE declare its styles at a named specificity level. The shell defines the layer order, guaranteeing which MFE's styles win in a conflict:
```css
/* shell injects this once into :root */
@layer reset, design-system, catalog, checkout, account;
/* Any checkout styles in @layer checkout cannot override design-system tokens */
```
Browser support: all modern browsers. Especially powerful when combined with CSS Custom Properties.

**Strategy 4 — Shadow DOM Web Components (Hard Isolation):**
Wrapping a micro-frontend in a Web Component with `mode: 'open'` creates a true style boundary — no CSS crosses the shadow root in either direction. Used by SAP, Salesforce, and any team embedding truly third-party MFEs. The trade-off: design system CSS variables *do* cross shadow boundaries, but framework-specific CSS-in-JS solutions do not. Accessibility (`aria-*` attributes, focus management) requires extra care across shadow boundaries.

### 🛠️ Hitting the Code: Lab 6
**Goal:** Demonstrate CSS Modules isolation and the `postcss-prefix-selector` approach.
1. Install: `npm install --save-dev postcss postcss-prefix-selector`
2. Save as `css-isolation-demo.js` and run it:
   ```javascript
   // Simulates what CSS Modules and postcss-prefix-selector do at build time

   // ── CSS MODULES SIMULATION ─────────────────────────────────────────────
   function cssModulesCompile(className, componentName) {
     // Webpack generates a deterministic hash from file path + class name
     const hash = Buffer.from(`${componentName}__${className}`).toString('base64').slice(0, 5);
     return `${componentName}__${className}__${hash}`;
   }

   const checkoutStyles = {
     panel:  cssModulesCompile('panel', 'checkoutApp'),
     button: cssModulesCompile('button', 'checkoutApp'),
   };
   const catalogStyles = {
     panel:  cssModulesCompile('panel', 'catalogApp'),  // Different hash!
     button: cssModulesCompile('button', 'catalogApp'),
   };

   console.log("✅ CSS Modules — no collision possible:");
   console.log(`   Checkout .panel  → .${checkoutStyles.panel}`);
   console.log(`   Catalog  .panel  → .${catalogStyles.panel}`);
   console.log(`   Same class name, different selectors: ${checkoutStyles.panel !== catalogStyles.panel}`);

   // ── POSTCSS PREFIX SIMULATION ─────────────────────────────────────────
   function postcssPrefixSelector(css, prefix) {
     // Simplified: prefix every selector in the stylesheet
     return css.replace(/^([.#\w][^{]+)\{/gm, `${prefix} $1{`);
   }

   const legacyCheckoutCss = `.card { padding: 16px; }\n.button { background: blue; }`;
   const scoped = postcssPrefixSelector(legacyCheckoutCss, '.checkout-app');

   console.log("\n✅ postcss-prefix-selector — legacy CSS scoped without code changes:");
   console.log(scoped);
   ```

---

## 📖 Chapter 7: Shared State & Authentication (The City ID Card)
### 🗺️ Progressive Importance: 🔴 Senior (State Management)

*"Every district in the city must honor the same resident ID card. The DMV (the Auth Service) issues it once. Every district's security desk reads it. No district gets to issue its own conflicting ID system."*

**The Problem:** Authentication state and user identity must be consistent across all micro-frontends simultaneously. If the Catalog MFE logs the user in but the Checkout MFE doesn't know they're logged in, the user gets a bizarre experience: they can browse as themselves but must log in again at checkout.

**The Anti-Pattern: Each MFE Managing Its Own Auth.**
Three teams implement three different token storage mechanisms: one uses `localStorage`, one uses an in-memory React context, one reads from a cookie. The Catalog team's token expires and they redirect to `/login`. Now the user is kicked out mid-Checkout flow by a different team's auth logic. Auth flows diverge, logout is inconsistent, and a security audit becomes impossible.

**The Solution: Shell-Owned Auth Context + Token Propagation.**

The shell owns a single source of truth for authentication:

* **Shell boots first:** On startup, the shell validates the JWT (from an `httpOnly` cookie — never `localStorage`), fetches the user profile, and stores it in a React Context it provides.
* **Context injection via Custom Events:** The shell fires `mfe:auth:ready` with the decoded user object when authentication resolves. Remotes listen for this event to hydrate their local user state.
* **Token refresh:** Only the shell's background timer calls the token refresh endpoint. It fires `mfe:auth:refreshed` with the new token.
* **Key Security Rule:** JWTs must live in `httpOnly` cookies, not `localStorage`. Any remote that can run JavaScript can read `localStorage` — in a micro-frontend context, a compromised third-party remote script has access to all teams' auth tokens at once.
* **Late-subscriber protection:** The auth event must also use the last-state cache pattern from Chapter 5. A remote that mounts after `mfe:auth:ready` fires must be able to read the cached user — otherwise it renders in an unauthenticated state.

### 🛠️ Hitting the Code: Lab 7
**Goal:** Implement shell-driven auth propagation with late-subscriber protection.
1. Save as `auth-propagation.js` and run it:
   ```javascript
   const EventEmitter = require('events');
   const mfeBus = new EventEmitter();

   // ── LAST-STATE CACHE (from Ch.5) ──────────────────────────────────────
   const lastState = {};
   function mfeEmit(event, detail) { lastState[event] = detail; mfeBus.emit(event, detail); }
   function mfeOn(event, handler) {
     mfeBus.on(event, handler);
     if (lastState[event]) handler(lastState[event]); // Late-subscriber replay
   }

   // ── SHELL: owns auth — fires AFTER async token validation ─────────────
   async function Shell() {
     console.log("🏛️ [Shell] Booting... Validating httpOnly session cookie...");
     await new Promise(r => setTimeout(r, 200)); // Simulate async token validation

     const user = { id: 'usr_99', name: 'Alice', roles: ['customer'] };
     console.log("🏛️ [Shell] ✅ Auth resolved. Broadcasting user identity...");
     mfeEmit('mfe:auth:ready', user); // Cached + broadcast simultaneously
   }

   // ── CHECKOUT MFE: may mount BEFORE or AFTER auth resolves ─────────────
   function CheckoutMFE() {
     // mfeOn checks cache immediately — if auth already fired, gets it now
     mfeOn('mfe:auth:ready', (user) => {
       console.log(`🛒 [CheckoutMFE] Auth received (on-time or late). Hello, ${user.name}!`);
       console.log(`🛒 [CheckoutMFE] Pre-filling billing address for ${user.id}...`);
     });
   }

   // ── CATALOG MFE: mounts 350ms AFTER shell — simulating lazy load ──────
   function CatalogMFE() {
     setTimeout(() => {
       console.log("\n📦 [CatalogMFE] Mounted 350ms after boot (lazy-loaded).");
       // Without mfeOn's cache replay, this would silently miss the auth event
       mfeOn('mfe:auth:ready', (user) => {
         const isVip = user.roles.includes('vip');
         console.log(`📦 [CatalogMFE] Auth received from CACHE. ${isVip ? 'VIP' : 'Standard'} pricing for ${user.name}`);
       });
     }, 350);
   }

   CheckoutMFE();
   Shell();    // async — fires mfe:auth:ready after 200ms
   CatalogMFE(); // Mounts at 350ms, well after auth:ready — still gets user ✅
   ```

---

## 📖 Chapter 8: Routing Ownership & Deep Linking (The District Street Map)
### 🗺️ Progressive Importance: 🔥 Senior Architect (Routing)

*"Every district in the city owns the streets within its boundaries. The City Planning Office only knows which district a given block belongs to — the internal streets are the district's problem. But every street must still have a globally unique address that anyone can bookmark and share."*

**The Problem:** In a micro-frontend architecture, routing ownership is ambiguous. If the shell controls all routes, remotes can't add new pages without touching the shell. If remotes control all routes, deep linking breaks and the back button becomes unpredictable.

**The Anti-Pattern: Shell-Controlled Nested Routes.**
The shell defines `/checkout/step-1`, `/checkout/step-2`, `/checkout/confirm` in its own React Router config. The Checkout team cannot add a new `/checkout/gift-wrap` step without filing a PR against the shell repo, waiting for a code review from a different team, and coordinating a synchronized deploy. Independence: zero.

**The Solution: Route Delegation (Nested Router Pattern).**

* **Shell routes:** `/catalog/*`, `/checkout/*`, `/account/*` — the asterisk is the delegation signal.
* **Checkout MFE internal routes:** `/checkout/cart`, `/checkout/shipping`, `/checkout/payment` — fully managed within the Checkout team's codebase using `useRoutes()` relative to their mount point.
* **Deep Link Guarantee:** A user who bookmarks `https://myapp.com/checkout/shipping` lands precisely on the Checkout MFE at its `/shipping` route — no shell changes needed.
* **The History Contract:** All micro-frontends must use the *same* history instance created by the shell. Remotes must *not* create their own `createBrowserHistory()` instances, or the back button produces split-brain routing behavior.

### 🛠️ Hitting the Code: Lab 8
**Goal:** Show how the CheckoutApp handles its own internal routing, plus trace the full URL-to-component pipeline.

**The CheckoutApp's internal router** (owns all `/checkout/*` sub-paths independently):
```tsx
// checkout-remote/src/CheckoutRoot.tsx
import { Routes, Route, useNavigate } from 'react-router-dom';

// These routes are INTERNAL to the Checkout team.
// Adding /checkout/gift-wrap here requires zero shell involvement.
export default function CheckoutRoot() {
  const navigate = useNavigate();
  return (
    <Routes>
      {/* React Router resolves these relative to the shell's /checkout/* match */}
      <Route path="cart"     element={<CartPage />} />
      <Route path="shipping" element={<ShippingForm onNext={() => navigate('/checkout/payment')} />} />
      <Route path="payment"  element={<PaymentForm />} />
      <Route path="confirm"  element={<ConfirmPage />} />
      {/* Checkout team adds this without touching the shell: */}
      <Route path="gift-wrap" element={<GiftWrapPage />} />
    </Routes>
  );
}
```

**Trace the full pipeline** for URL `https://myapp.com/checkout/shipping`:
1. **Shell's `<BrowserRouter>`** intercepts the full URL.
2. **Shell's `<Routes>`** matches `/checkout/*` → mounts `<CheckoutApp />` via `React.lazy`.
3. **Module Federation** fetches `https://checkout.myapp.com/remoteEntry.js` if not cached.
4. **CheckoutRoot mounts** — React Router passes the remainder path `/shipping` into its nested ``<Routes>``.
5. **CheckoutRoot's ``<Routes>``** matches `shipping` → renders ``<ShippingForm />``.
6. **User clicks "Next"** → `navigate('/checkout/payment')` — full URL updates, shell stays mounted. Only the CheckoutRoot's internal route re-renders.
7. **User hits Back** → history pops → CheckoutRoot re-routes to `/shipping`. Shell never re-mounts.

---

## 📖 Chapter 9: Federated Design System & Styling Governance (The City Zoning Code)
### 🗺️ Progressive Importance: 🔥 Senior Architect (UI Consistency)

*"Every building in a well-planned city follows the same zoning code: minimum window heights, fire exit widths, elevator specifications. Citizens don't notice the code — they just notice that the city looks and feels coherent. The moment one district ignores the code, a neon-green skyscraper appears next to a Georgian townhouse."*

**The Problem:** Five teams ship five micro-frontends. Each team chose a slightly different shade of `#0066cc` for their primary button. The Catalog team uses `font-size: 14px` for body text; the Checkout team uses `16px`. The Account team imported `styled-components` version 5; the shell uses version 6.

**The Anti-Pattern: Each MFE Importing Its Own Copy of a UI Component Library.**
Six remotes each import `@mui/material` into their bundle. The user downloads Material UI **six times** — once per micro-frontend. Total CSS-in-JS runtime overhead: 6× injection, 6× theme re-computation, and a catastrophic stylesheet ordering problem where the last MFE to mount wins the CSS specificity war.

**The Solution: Federated Design System.**

Structure the design system as its own dedicated micro-frontend remote:

* **`design-system` remote** exposes: `Button`, `Input`, `Modal`, `Typography`, `theme`, and `GlobalStyles`.
* **Every MFE consumes** the design system remote via Module Federation's `shared` config — loaded *once* and cached by the browser for all remotes.
* **CSS Custom Properties (Design Tokens):** Use CSS variables for all design decisions. The shell injects these into `:root` once. Any remote — regardless of framework — reads and respects them.

**The Design System Breaking-Change Problem.**

When the Design System team renames `<Button variant="primary">` to `<Button intent="primary">` in their v2, every MFE that consumes the federated remote on `latest` breaks simultaneously. This is the most dangerous failure mode of a federated design system — a single deploy turns 6 remotes white.

**The Solution: Version-Pinned Remote Entry Points for the Design System.**

```javascript
// shell/webpack.config.js — remotes section
remotes: {
  // MFEs pin to a major version, not 'latest'. The DS team maintains
  // v1 and v2 simultaneously during the migration window.
  designSystem: 'ds@https://cdn.myapp.com/design-system/v1/remoteEntry.js',
}
```

Non-breaking change classification:
* ✅ **Non-breaking:** Adding a new prop with a default value, adding a new component, adding CSS token aliases
* ❌ **Breaking:** Renaming a prop, removing a component, changing a CSS token's meaning (not just value)

Breaking changes get a new version URL. Teams migrate on their own schedule. The Design System team maintains the previous major version for 90 days minimum.

### 🛠️ Hitting the Code: Lab 9
**Goal:** Map the design system federation pipeline — from token definition to cross-MFE consistency — and see a version-pinned remote URL in action.

**Design token definition** in `design-system/src/tokens.css`:
```css
:root {
  --color-primary: hsl(221, 100%, 50%);
  --color-danger:  hsl(0, 90%, 55%);
  --radius-md:     8px;
  --font-body:     'Inter', system-ui, sans-serif;
}
```

**Full data flow:**
1. **Design System team** ships CSS tokens and React components to `https://cdn.myapp.com/design-system/v1/remoteEntry.js`
2. **Shell mounts `<GlobalStyles />`** from the design system remote → tokens injected into `:root` once.
3. **Checkout MFE's `<Button>`** is imported from the federated design system. Reads `var(--color-primary)`. No local copy.
4. **Catalog MFE's `<Button>`** — same federated import, same token values. Pixel-perfect consistency.
5. **DS team ships v2** with a renamed prop. They update the remote URL to `/v2/remoteEntry.js`. All MFEs stay on `/v1` until they individually migrate. No mass breakage.
6. **DS team sunsets v1** after 90-day migration window. Any MFE still on v1 gets a deprecation warning in CI.

---

## 📖 Chapter 10: Testing Micro-Frontends (The City Quality Inspectors)
### 🗺️ Progressive Importance: 🔥 Senior Architect (Testing Strategy)

*"A city with 20 independently constructed buildings still needs a building inspection service. No building is certified until its wiring is checked — in isolation. And the street connections between buildings are checked separately by the city inspector, not by each contractor."*

**The Problem:** In a monolith, Jest + React Testing Library covers units and Playwright covers E2E — one test suite, one configuration, one CI step. In a micro-frontend system, the test strategy must answer: how do you test the *boundary* between the shell and a remote when you can't run both locally simultaneously? And how do you prevent a remote team's internal refactor from silently breaking the shell's interface contract?

**The Anti-Pattern: Testing Remotes Only in the Shell Context.**
Teams write E2E tests that boot the full shell + all remotes simultaneously. Every CI run requires all 6 services to be available and running. One remote's flaky dev server fails → the entire E2E suite turns red → no team can merge. The pipeline becomes a shared bottleneck, rebuilding the very coordination problem MFEs were meant to solve.

**The Solution: The MFE Testing Pyramid (4 Layers).**

**Layer 1 — Unit Tests (Per-MFE, Fully Isolated):**

Each MFE runs its own Jest/Vitest suite against its own components in isolation. No shell required, no remotes required. Identical to monolith unit testing — the MFE boundary adds nothing here.

**Layer 2 — Integration Boundary Tests (Shell + Mocked Remotes):**

Test the shell's `RemoteMount` component with a dynamically mocked remote. The remote is never actually loaded — its `import()` is intercepted:
```javascript
// In Jest setup: mock the entire federated remote
jest.mock('checkoutApp/CheckoutRoot', () => ({
  default: () => <div data-testid="checkout-stub">Checkout Loaded</div>,
}));

// Now test that the shell correctly mounts, suspends, and error-boundaries it
test('shell shows fallback when remote fails', async () => {
  jest.mock('checkoutApp/CheckoutRoot', () => { throw new Error('Module not found'); });
  render(<Shell />);
  expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();
});
```

**Layer 3 — Contract Tests (Cross-Team Interface Verification):**

Contract testing with **Pact** verifies that the interface a remote *exposes* matches what the shell *consumes* — without both needing to run simultaneously.

```javascript
// Shell is the CONSUMER — defines what it expects from checkoutApp
// pact-tests/checkout.consumer.spec.js
const { Pact } = require('@pact-foundation/pact');

// The shell expects checkoutApp to expose a module with these props
const consumerContract = {
  exposedModule: 'checkoutApp/CheckoutRoot',
  rootPropsShape: {
    // CheckoutRoot must be mountable with no required props
    requiredProps: [],
  },
};

// On every shell CI run, Pact publishes this contract to a Pact Broker.
// On every checkout CI run, the checkout team runs Pact provider verification:
// if their new deploy violates the shell's contract, the deploy is blocked.
console.log("📋 Consumer contract published to Pact Broker:", JSON.stringify(consumerContract, null, 2));
```

**Layer 4 — E2E Tests (Per-MFE, Not Global):**

Each team writes Playwright tests that run against their *own* remote in isolation. The shell is mocked using `page.route()` to intercept `remoteEntry.js`:
```javascript
// checkout-remote/e2e/checkout.spec.ts (Playwright)
test('checkout shipping form', async ({ page }) => {
  // Mock the shell — don't boot it. Test the checkout remote standalone.
  await page.route('**/shell/remoteEntry.js', route => route.abort());

  // Boot only the checkout remote's own dev server
  await page.goto('http://localhost:3001/checkout/shipping');
  await page.fill('[data-testid="street-input"]', '123 Main St');
  await page.click('[data-testid="next-button"]');
  await expect(page).toHaveURL(/\/checkout\/payment/);
});
```

**Visual Regression (Chromatic/Percy at MFE boundaries):**

Run Chromatic against each remote's Storybook independently. This catches the CSS isolation failures from Chapter 6 automatically — if a remote's styles leak and break a neighbor's Storybook stories, the visual diff alerts before production.

### 🛠️ Hitting the Code: Lab 10
**Goal:** Write a self-contained contract test simulation and a Playwright route-intercept pattern.
1. Save as `mfe-contract-test.js` and run it:
   ```javascript
   // Simulates Pact contract verification between shell (consumer) and checkout (provider)

   // ── CONSUMER (Shell): defines what it expects ─────────────────────────
   const shellConsumerContract = {
     consumer: 'shell',
     provider: 'checkoutApp',
     interactions: [
       {
         exposedModule: './CheckoutRoot',           // Shell imports this path
         expectedExport: 'default',                 // Must be a default export
         mountableWithNoProps: true,                // Shell passes no required props
         firesEvent: 'mfe:checkout:complete',       // Event the shell listens for
       },
     ],
   };
   console.log("📤 Shell publishes consumer contract to Pact Broker...");
   console.log(JSON.stringify(shellConsumerContract, null, 2));

   // ── PROVIDER (Checkout team): verifies on their CI ────────────────────
   function verifyCheckoutAgainstContract(contract, actualCheckoutAPI) {
     const interaction = contract.interactions[0];
     const errors = [];

     if (!actualCheckoutAPI.exposedModules.includes(interaction.exposedModule))
       errors.push(`❌ Missing exposed module: ${interaction.exposedModule}`);

     if (actualCheckoutAPI.defaultExport !== 'function')
       errors.push(`❌ Default export must be a React component (function), got: ${actualCheckoutAPI.defaultExport}`);

     if (!actualCheckoutAPI.firedEvents.includes(interaction.firesEvent))
       errors.push(`❌ Checkout does not fire expected event: ${interaction.firesEvent}`);

     return errors;
   }

   // Simulate checkout team's CURRENT API (passes verification)
   const checkoutAPIv1 = {
     exposedModules: ['./CheckoutRoot'],
     defaultExport: 'function',
     firedEvents: ['mfe:checkout:complete', 'mfe:checkout:abandoned'],
   };
   const v1Errors = verifyCheckoutAgainstContract(shellConsumerContract, checkoutAPIv1);
   console.log("\n🔍 Verifying checkout v1 against contract...");
   console.log(v1Errors.length === 0 ? "✅ v1 passes. Deploy allowed." : v1Errors);

   // Simulate checkout team's BREAKING CHANGE (renames exposed module)
   const checkoutAPIv2Breaking = {
     exposedModules: ['./CheckoutRoot_v2'],  // ← Renamed! Shell expects './CheckoutRoot'
     defaultExport: 'function',
     firedEvents: ['mfe:checkout:complete'],
   };
   const v2Errors = verifyCheckoutAgainstContract(shellConsumerContract, checkoutAPIv2Breaking);
   console.log("\n🔍 Verifying checkout v2 (breaking rename) against contract...");
   console.log(v2Errors.length > 0 ? `🚨 Contract violation! Deploy BLOCKED:\n${v2Errors.join('\n')}` : "✅ Passes.");
   ```

---

## 📖 Chapter 11: Deployment, Versioning & Observability (The City Operations Center)
### 🗺️ Progressive Importance: 🔥 Senior Architect (Deployment)

*"A building can be renovated floor by floor while residents still occupy the other floors. But the renovation team must file permits, label every pipe they touch, and leave the fire alarm system intact. Independent deployability is only safe when the operations center can see exactly what changed and roll it back in seconds."*

**The Problem:** The Checkout team deploys a new version of their remote. They renamed the exposed module from `./CheckoutPanel` to `./CheckoutRoot`. The shell is still configured with `checkoutApp/CheckoutPanel`. At 2 PM on a Tuesday, every user who lands on `/checkout` gets a blank white screen. The shell team is not even aware a deploy happened.

**The Anti-Pattern: Implicit Interface Contracts Between Remotes.**
Teams change exposed module names, rename props on their root component, or restructure the events they fire on `mfe:checkout:complete` — without versioning or announcing the breaking change. Because the coupling is implicit (a string in a webpack config, not a TypeScript type), the error only surfaces at runtime on production user traffic.

**The Solution: The 3-Layer Deployment Safety Net.**

1. **Versioned Remote Entry Points:** Serve versioned manifests: `remoteEntry.v1.js`, `remoteEntry.v2.js`. The shell pins to a specific major version URL. The Checkout team deploys their v2 in parallel — the shell continues using v1 until explicitly migrated.

2. **Contract Testing with Pact (CI gate):** Every micro-frontend's CI pipeline runs Pact provider verification. If the Checkout team's new deploy violates the shell's consumer contract, the deploy is blocked before it reaches production. (See Chapter 10 for the implementation.)

3. **Feature-Flagged Rollouts:** New remote versions sit behind a feature flag. Traffic shifts progressively — 1% → 5% → 25% → 100% — while monitoring Core Web Vitals and JavaScript error rates.

**Observability: Source Maps, Error Attribution, and Monitoring.**

In a monolith, one Sentry project catches everything. In a micro-frontend system, an error in the Checkout remote lacks the shell's breadcrumbs. Stack traces from federated chunks are unreadable without per-remote source map uploads.

* **Per-remote source maps:** Each MFE team runs `sentry-webpack-plugin` in their own CI pipeline to upload source maps tagged with their remote's version. Without this, production stack traces from federated remotes show minified code — undebuggable.
* **`mfe.name` and `mfe.version` tags:** Every error event must include custom context identifying the owning remote and its version:
  ```javascript
  Sentry.setTag('mfe.name', 'checkoutApp');
  Sentry.setTag('mfe.version', process.env.MFE_VERSION); // Set at build time
  ```
* **Error boundary + Sentry integration:** The shell's `RemoteErrorBoundary` (from Ch.4) should call `Sentry.captureException(error, { tags: { 'mfe.name': name } })` in its `componentDidCatch` — attributing the error to the correct team automatically.
* **`remoteEntry.js` version in error context:** Embed the remote's CDN URL (including version) in every error. When an incident spikes, on-call engineers can immediately correlate the error rate with the deploy timestamp.

### 🛠️ Hitting the Code: Lab 11
**Goal:** Simulate versioned remote entry resolution, rollback, and Sentry tag injection.
1. Save as `deployment-ops.js` and run it:
   ```javascript
   // ── VERSIONED REMOTE RESOLUTION + FEATURE FLAGS ──────────────────────
   const featureFlags = { checkout_v2_rollout: 0.05 }; // 5% on new version

   function resolveRemoteUrl(remoteName, userId) {
     const flag = featureFlags[`${remoteName}_v2_rollout`];
     const userBucket = (parseInt(userId, 36) % 100) / 100;
     if (flag && userBucket < flag) {
       return { url: `https://cdn.myapp.com/${remoteName}/v2/remoteEntry.js`, version: 'v2' };
     }
     return { url: `https://cdn.myapp.com/${remoteName}/v1/remoteEntry.js`, version: 'v1' };
   }

   console.log("── Versioned remote resolution ──");
   ['usr_alpha', 'usr_beta', 'usr_gamma', 'usr_delta'].forEach(id => {
     const { url, version } = resolveRemoteUrl('checkout', id);
     console.log(`👤 ${id.padEnd(12)} → ${version}  ${url}`);
   });

   // ── ROLLBACK ─────────────────────────────────────────────────────────
   console.log("\n🚨 Error rate spiked at 5% rollout! Rolling back...");
   featureFlags.checkout_v2_rollout = 0;
   const { url } = resolveRemoteUrl('checkout', 'usr_alpha');
   console.log(`✅ All traffic back to: ${url}`);

   // ── SENTRY ERROR TAGGING ──────────────────────────────────────────────
   function simulateSentryCapture(error, mfeName, mfeVersion) {
     const sentryEvent = {
       message: error.message,
       tags: {
         'mfe.name': mfeName,
         'mfe.version': mfeVersion,
         'mfe.remote_url': `https://cdn.myapp.com/${mfeName}/${mfeVersion}/remoteEntry.js`,
       },
       timestamp: new Date().toISOString(),
     };
     console.log("\n📡 Sentry event captured:");
     console.log(JSON.stringify(sentryEvent, null, 2));
     console.log("→ On-call engineer sees: 'checkoutApp v2 errored. Rollback v2.'");
   }

   simulateSentryCapture(
     new Error("Cannot read properties of undefined (reading 'lineItems')"),
     'checkoutApp',
     'v2'
   );
   ```

---

## 📖 Chapter 12: Performance — Core Web Vitals in a Micro-Frontend World
### 🗺️ Progressive Importance: 🔥 Senior Architect (Performance & Infrastructure)

*"A city with 20 independently constructed buildings still needs a shared road network. If every building installs its own private road that only connects to its own parking lot, the city doesn't function — it just looks like a collection of buildings with no streets between them."*

**The Problem:** Google Lighthouse scores your micro-frontend shell at 45 on mobile. LCP is 6.2 seconds. The culprit: five `remoteEntry.js` files are being fetched sequentially, each blocking the next. Total Blocking Time is 1.8 seconds because three MFEs each bundle their own copy of `lodash` and `date-fns`. The user sits at a blank white screen while webpack negotiates module federation contracts.

**The Anti-Pattern: Loading All Remotes Eagerly on Shell Bootstrap.**
Teams configure the shell to pre-fetch all `remoteEntry.js` manifests at boot time "for better UX." Instead, the user downloads 800KB of JavaScript for the `Admin Panel` MFE even when they landed on `/catalog` and will never visit Admin. The shell's bundle analysis shows 6 separate copies of `moment.js` — one per MFE team who forgot to add it to `shared`.

**The Solution: 5 Performance Contracts for Micro-Frontend Systems.**

1. **Lazy-load all remotes** with `React.lazy()` — only fetch a remote's chunks when the route is actually matched. The shell's initial load should include zero remote code.

2. **Mandatory `shared` config audit:** Every dependency used by more than one MFE must appear in the `shared` config. Run `webpack-bundle-analyzer` on each remote before every deploy.

3. **`<link rel="preload">` for the next route:** When the user is on `/catalog` and hovers over "Add to Cart," prefetch `https://checkout.myapp.com/remoteEntry.js` speculatively. The actual load will be instant.

4. **HTTP/2 for `remoteEntry` delivery:** All `remoteEntry.js` files must be served over HTTP/2 from a CDN. This allows parallel fetching of all manifests — the HTTP/1.1 6-connection-per-host limit makes sequential chunk loading catastrophic on mobile.

5. **Per-MFE Lighthouse budgets in CI:** Each remote's Lighthouse performance score is measured independently. A PR that drops the Checkout MFE's LCP below a defined budget is blocked. Teams own their own performance regressions.

### 🛠️ Hitting the Code: Lab 12
**Goal:** Use `webpack-bundle-analyzer` to audit a remote bundle for duplicate dependencies.
1. Install: `npm install --save-dev webpack-bundle-analyzer`
2. Add to your remote's `webpack.config.js`:
   ```javascript
   const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

   module.exports = {
     // ... your existing config
     plugins: [
       new BundleAnalyzerPlugin({
         analyzerMode: 'static',          // Generates report.html — no server needed
         reportFilename: 'bundle-report.html',
         openAnalyzer: false,
         generateStatsFile: true,
       }),
     ],
   };
   ```
3. Run `npx webpack --config webpack.config.js`. Open `bundle-report.html`.
4. **What to look for:**
   - Any block labeled `react` or `react-dom` inside a remote's bundle (should be absent — shared)
   - Duplicate utility libraries (`lodash`, `date-fns`, `axios`) appearing in multiple remotes
   - A `checkoutApp` remote weighing more than ~150KB gzipped suggests missing `shared` entries
   - `moment.js` anywhere — replace with `date-fns` and add to `shared`
5. **Fix:** Add the offending library to the `shared` section in `ModuleFederationPlugin`. Re-run. Watch the bundle size collapse.

---

### 🙋‍♂️ Student Q&A

**Student (Priya):** *"This all sounds great for big companies, but what if our team is only 8 engineers? Doesn't adopting micro-frontends mean we're paying all this complexity cost — module federation, versioned remotes, contract testing, separate CI pipelines — without the scale to justify it?"*

**Teacher:** *"Priya, that's the most important question in this entire course, and I want to credit you for asking it — most engineers learn this lesson by shipping the complexity and regretting it. The honest answer is: you're right. Micro-frontends are an organizational scaling solution masquerading as a technical one. If your 8 engineers share one codebase, your deploy coordination cost is zero. The payoff only arrives when independent deployability saves you more time than the infrastructure complexity costs you — and for most companies, that crossover point is closer to 4–5 separate product teams than most blog posts admit. My recommendation: start with a modular monorepo using Nx or Turborepo. Share code via internal packages. `nx affected` alone solves the 8-minute build problem — you only rebuild what changed. When two teams genuinely start blocking each other's deploys more than once a week, then reach for Module Federation — and only for those two teams. You don't need to federate everything at once."*

---

## 📖 Chapter 13: Summary & The Final Quiz
### 🗺️ Progressive Importance: 🟢 Review (Self Assessment)

### The Quiz

1. **Multiple Choice:** Your shell's `ModuleFederationPlugin` config has `react` listed in `shared` but is missing the `singleton: true` flag. Your checkout remote declares `react: "^18.0.0"`. What is the most likely production failure?
   * A) The shell fails to compile because React is detected twice at build time
   * B) Two copies of React run simultaneously in the same browser tab, causing a Hooks runtime error
   * C) The remote MFE silently falls back to the shell's React version with no error

2. **Architecture Scenario:** The Catalog MFE fires `mfe:cart:updated` when a user adds an item to their cart. The Checkout MFE — which displays the cart total — loads 400ms later due to lazy loading. The user's cart total shows zero. What is the root cause and what is the fix?

3. **CSS Isolation:** The Checkout team's stylesheet contains `* { box-sizing: border-box; margin: 0; }` as a CSS reset. When their remote mounts, every `<input>` in the Catalog MFE loses its margin. Name two strategies that would have prevented this leakage.

4. **Pattern Differentiation:** What is the difference between **contract testing (Pact)** and **E2E testing** in a micro-frontend context? Why can't E2E tests alone catch the class of bugs that contract tests are designed for?

5. **Trade-off:** Your CPO asks why the Checkout MFE can't be published as an npm package for the shell to install — it seems simpler than Module Federation. When does that approach break down, and what is the precise signal that Module Federation becomes justified?

6. **Anti-Pattern Identification:** A senior engineer proposes: *"We'll put global cart state in a Zustand store inside the shell and pass it as props to every micro-frontend root: `<CheckoutApp cart={shellCart} />`."* What is wrong with this at scale, and what is the correct pattern?

---

### Quiz Answers

1. *B) Two copies of React run simultaneously in the same browser tab, causing a Hooks runtime error. Without `singleton: true`, Module Federation loads the highest compatible version for the shell and a separate instance for the remote. React enforces one instance per page and throws: "Invalid hook call." This never appears on localhost because both apps happen to negotiate the same instance in development. (Chapter 3)*

2. *Root cause: The `mfe:cart:updated` event was fired before the Checkout MFE mounted and registered its listener — a fire-and-forget race condition. The fix: implement a last-state cache alongside the event bus. Every emitter stores `lastState[event] = detail` before dispatching. Every subscriber calls the cache immediately after registering its listener to replay any missed state. (Chapter 5)*

3. *Any two of: (1) **CSS Modules** — class names are hashed per-component at build time, preventing global selector collisions. (2) **`postcss-prefix-selector`** — prefixes every selector with a root class (`.checkout-app button`) so rules only apply inside the remote's root element. (3) **CSS `@layer`** — the shell defines layer order, guaranteeing which remote's styles take precedence. (4) **Shadow DOM** — hard style boundary across the web component boundary. (Chapter 6)*

4. *E2E tests require all remotes to be running simultaneously, test user-visible behavior, and run slowly. They cannot catch the specific class of failure where a remote team renames an exposed module (`./CheckoutPanel` → `./CheckoutRoot`) because the E2E test suite also needs to be updated — and if teams don't coordinate, neither catches the break before production. Contract testing (Pact) verifies the interface contract independently: the shell publishes what it consumes, the checkout team verifies their deploy satisfies it — no simultaneous boot required, runs in seconds, and blocks the deploy before any user is affected. (Chapter 10)*

5. *npm package (build-time) integration breaks down the moment any remote team's release requires the shell to bump a version and redeploy in lockstep. The precise signal: if a remote team's deploy requires another team to act before users see the change, you have tight coupling and Module Federation is justified. If all teams can deploy independently today with no coordination, stay with npm packages — the complexity is not yet worth it. (Chapter 2)*

6. *The problem is tight prop-API coupling across team boundaries. When the Checkout team refactors their root component's props — renaming `cart` to `lineItems` — the shell must be updated and redeployed in lockstep. At 5+ remotes, the shell becomes a merge conflict hotspot where every team files simultaneous PRs. The correct pattern: use the Custom Event bus (`mfe:cart:updated`) with a last-state cache (Chapter 5). The Checkout MFE subscribes to cart changes independently, decoupled from the shell's internal state shape and deployment cycle. (Chapters 4 & 5)*

---

*"Class dismissed! Remember: a micro-frontend is not a technical decision — it's an organizational one. When Conway's Law forces your monolith to reflect five teams' boundaries in five hundred merge conflicts, that's the architecture telling you to federate. Until then, stay monolithic and stay sane. Ship the complexity only when the alternative — coordination overhead — is already costing you more than the infrastructure is worth."*
