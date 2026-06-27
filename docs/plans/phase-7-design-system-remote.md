# Implementation Plan: DockerMart Micro-Frontend (Phase 7)

This plan outlines the implementation of **Phase 7: The Design System Remote**. We will bootstrap a dedicated design system remote MFE that hosts and serves shared design tokens, a base GlobalStyles reset component, and a highly customizable federated Button component.

---

## Senior Dev Context: Why Phase 7 Matters
A micro-frontend architecture requires a unified styling language to feel premium and consistent.
1. **The Specificity War**: Global css files conflict. A shared tokens registry prevents arbitrary styling choices.
2. **Runtime Propagation**: Exposing components and tokens via Module Federation allows us to deploy design updates to all apps instantly without individual consumer MFE builds.
3. **Governance and Guardrails**: Linting rules must block hardcoded values to preserve design consistency across independent CI builds.

---

## Proposed Phase 7 Steps

### Task 7.1 — Build the Design System Remote
*   Create project directory structure for `design-system` running on port `3005`.
*   Establish Webpack Module Federation config exposing `./Button` and `./GlobalStyles`.
*   Create tokens module `tokens.ts` (colors, spacing, radii, font variables).
*   Create `<Button>` component and `<GlobalStyles>` reset injector.

### Task 7.2 — Consume the Design System in Remotes
*   Update `catalog-mfe`, `checkout-mfe`, and `shell` Webpack remotes configs to declare `designSystem`.
*   Replace local button markup in Catalog and Checkout with the federated design system `<Button>`.
*   Mount `<GlobalStyles />` in the Shell's `App.tsx` root.
*   Update type declaration `declarations.d.ts` definitions in all consumer apps.

### Task 7.3 — The Breaking Change Experiment
*   Simulate API interface contract breaking changes inside federated components.
*   Write analysis and mitigation documentation inside `docs/notes/design-system-breaking-changes.md`.

### Task 7.4 — CSS Token Governance
*   Audit all CSS files and refactor hardcoded color rules to use design tokens.
*   Configure `.stylelintrc.json` rules to warn against hex/rgb colors and enforce token variables.
*   Document style linting scalability in `docs/notes/design-system-governance.md`.

---

## Proposed Changes

### [NEW] Design System Remote MFE

#### [NEW] [package.json](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/design-system/package.json)
Configure build scripts and standard tooling.

#### [NEW] [webpack.config.js](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/design-system/webpack.config.js)
Export `./Button` and `./GlobalStyles` federated endpoints.

#### [NEW] [tokens.ts](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/design-system/src/tokens.ts)
Core token configuration object.

#### [NEW] [Button.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/design-system/src/Button.tsx)
Federated component utilizing stateful hover and token references.

#### [NEW] [GlobalStyles.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/design-system/src/GlobalStyles.tsx)
Inject CSS custom variables into `:root` and reset standard body properties.

### Consumer Remotes Integration

#### [MODIFY] [webpack.config.js](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/catalog-mfe/webpack.config.js)
#### [MODIFY] [webpack.config.js](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/checkout-mfe/webpack.config.js)
Define remote entry endpoint mapping.

#### [MODIFY] [CatalogRoot.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/catalog-mfe/src/CatalogRoot.tsx)
#### [MODIFY] [CheckoutRoot.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/checkout-mfe/src/CheckoutRoot.tsx)
Import and mount federated `<Button>` with corresponding layouts.

---

## Verification Plan
*   Run the workspace servers, load the shell homepage, and confirm buttons render with shared style configurations.
*   Edit a color inside `tokens.ts` and verify it updates across all MFEs in the browser automatically.
