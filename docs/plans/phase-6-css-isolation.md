# Implementation Plan: DockerMart Micro-Frontend (Phase 6)

This plan outlines the implementation of **Phase 6: CSS Isolation**. We will reproduce a style leakage incident where global stylesheets collision breaks layout stability, and then implement and compare two different industrial remediation strategies: CSS Modules and build-time PostCSS prefixing.

---

## Senior Dev Context: Why Phase 6 Matters
In a monolithic frontend, global CSS selectors load into a single page and are kept consistent. In a micro-frontend architecture (MFE), multiple independently compiled CSS bundles load dynamically into the same browser DOM.
*   **The Specificity War**: If MFE A and MFE B define conflicting global selectors, the browser cascading engine resolves them based on loading order. The MFE stylesheet loaded last overrides the other. This makes CSS leakage bugs non-deterministic and highly timing-dependent.
*   **Scoped Styling vs Global Bleeding**: We must ensure that each team's styles are scoped exclusively to their own namespace, either at write time (CSS Modules) or at compile time (PostCSS prefix selectors).

---

## Proposed Phase 6 Steps

### Task 6.1 — Trigger the Style Leakage Incident
*   Inject a global CSS reset containing broad selectors (`*`, `button`) inside `checkout-mfe/src/checkout.css` and import it.
*   Mount both the Catalog MFE and the Checkout MFE simultaneously on the page.
*   Observe the Catalog MFE's layout and buttons breaking under the Checkout MFE's styles.
*   Document the failure analysis, timing variables, and localhost vs production gaps in `docs/notes/css-leakage-incident.md`.

### Task 6.2 — Fix with CSS Modules
*   Refactor the `checkout-mfe` component styles:
*   Rename `checkout.css` to `CheckoutPanel.module.css`.
*   Scope styles to local class selectors (e.g. `.btn`, `.panel`) and import them via `import styles from './CheckoutPanel.module.css'`.
*   Remove the global resets, verifying that Catalog's styling is restored.

### Task 6.3 — Fix with `postcss-prefix-selector`
*   Reintroduce a global reset leak in `catalog-mfe`, but resolve it at compile time using PostCSS:
*   **Configuration**: Configure `postcss-loader` and `postcss-prefix-selector` inside `catalog-mfe/webpack.config.js`.
*   **Scoping**: Configure the post-processor to automatically prefix every selector with `.catalog-app`.
*   **Mount wrap**: Wrap the Catalog root component in `<div className="catalog-app">`.
*   Verify that styles are scoped correctly without modifying the source CSS files.
*   Compare these options with Shadow DOM Web Components and Cascade Layers (`@layer`) in `docs/notes/css-strategies-comparison.md`.

---

## Proposed Changes

### Configuration Updates

#### [MODIFY] [webpack.config.js](file:///file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/catalog-mfe/webpack.config.js)
Integrate `postcss-loader` in the CSS module processing rules.

### Styling & Source Files

#### [NEW] [checkout.css](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/checkout-mfe/src/checkout.css)
Inject global selectors and resets to reproduce style bleed.

#### [NEW] [CheckoutPanel.module.css](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/checkout-mfe/src/CheckoutPanel.module.css)
Refactored, module-scoped styling file for Checkout.

#### [NEW] [postcss.config.js](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/catalog-mfe/postcss.config.js)
Configure PostCSS loader rules and selector prefixes.

### Documentation Files

#### [NEW] [css-leakage-incident.md](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/docs/notes/css-leakage-incident.md)
#### [NEW] [css-strategies-comparison.md](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/docs/notes/css-strategies-comparison.md)

---

## Verification Plan

### Automated Verification
*   Compile Webpack build in Catalog MFE and Checkout MFE to verify syntax stability.

### Manual Verification
1.  **Bleed validation**: Verify Catalog elements (like buttons and list layout) are modified by the global Checkout stylesheet during Task 6.1.
2.  **Modules verification**: Inspect DOM elements for the hashed class suffixes and confirm Catalog is no longer impacted during Task 6.2.
3.  **PostCSS verification**: Check the output css chunk in Catalog and confirm all selectors are nested under `.catalog-app` during Task 6.3.
