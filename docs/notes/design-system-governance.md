# Design System Token Governance & CI Linting

To ensure visual consistency and design integrity across all micro-frontends, style governance must be enforced automatically. Teams should be blocked from hardcoding arbitrary color or spacing values, and forced to consume CSS variables served by the `<GlobalStyles />` remote.

This document details how we configure linting rules and how to enforce them across decoupled CI/CD pipelines.

---

## 1. Stylelint Rule Configuration

We created a central `.stylelintrc.json` configuration to govern style definitions:
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

### Purpose of Rules
1. **`color-no-hex`**: Flags any raw hex color definitions (like `#ffffff` or `#ff3366`) as styling violations.
2. **`declaration-property-value-disallowed-list`**: Forbids assigning raw hex strings or RGB/RGBA values directly to the `color` and `background-color` properties. This forces developers to use `var(--color-...)` tokens.

---

## 2. Decoupled CI/CD Pipeline Enforcement Strategies

In a micro-frontend architecture, each MFE is owned by a separate team with its own git repository and independent CI/CD pipeline (e.g. GitHub Actions). Having a local configuration inside `design-system` does not automatically lint other repositories during their commits.

Here are the three industrial approaches to scaling and enforcing this central rule:

### Strategy A: Config Publishing via Private NPM Registry (Recommended)
1. The design system team packages the lint config and publishes it as a scoped package: `@dockermart/stylelint-config`.
2. Each consumer remote MFE adds this package to their `devDependencies` in `package.json`.
3. In their local `.stylelintrc.json`, they inherit the rules:
   ```json
   {
     "extends": "@dockermart/stylelint-config"
   }
   ```
4. Each remote MFE's CI pipeline runs the standard linter command:
   ```bash
   npm run lint:css # Executes stylelint "**/*.css"
   ```
*   **Pros**: Versioned, predictable updates. A design system config update won't unexpectedly break a consumer's build until they choose to update their package version.
*   **Cons**: Requires a private npm registry (Artifactory, npm Enterprise, or GitHub Packages).

---

### Strategy B: Dynamic Script Fetching during CI
If publishing npm packages is not supported by the infrastructure, the CI pipelines can fetch the central configuration file directly from the main branch of the Design System repository before running checks:
1. In the GitHub Actions workflow file of the consumer MFE (e.g. `catalog-mfe` CI):
   ```yaml
   - name: Pull Shared Stylelint Configuration
     run: curl -sSf https://raw.githubusercontent.com/siddhantdeval/dockermart-micro-frontend/main/design-system/.stylelintrc.json -o .stylelintrc-governed.json

   - name: Run Stylelint against central config
     run: npx stylelint "**/*.css" --config .stylelintrc-governed.json
   ```
*   **Pros**: Real-time enforcement. The moment the design system team pushes a new token governance rule, all remote builds instantly check against it.
*   **Cons**: Network dependent; can cause build failures in unrelated teams if a breaking lint rule is pushed to `main` without warning.

---

### Strategy C: Centralized Orchestration Workspace (Monorepo)
If all micro-frontends reside in a single git repository (monorepo with yarn/pnpm workspaces):
1. The root directory contains the master `.stylelintrc.json`.
2. Each subdirectory (e.g., `checkout-mfe`, `catalog-mfe`) extends it relatively:
   ```json
   {
     "extends": "../design-system/.stylelintrc.json"
   }
   ```
3. A root lint runner checks all projects in a single command.
*   **Pros**: Simple, zero networking overhead, single source of truth.
*   **Cons**: Couples codebase commits (to be revisited in Phase 13).
