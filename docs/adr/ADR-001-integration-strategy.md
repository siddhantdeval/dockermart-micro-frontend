# ADR-001: Integration Strategy for DockerMart

## Status
Proposed

## Context
DockerMart is an e-commerce platform with five independent product teams (Shell, Catalog, Cart, Checkout, Account, and Design System). 

In a traditional frontend monolith, all these teams would commit to a single repository, share one build/deploy pipeline, and share a single `node_modules` folder. As the organization grows, this monolith creates severe developer friction:
1. **Deployment Coupling:** A bug introduced by the Catalog team blocks the Checkout team from shipping their changes because they share the same release branch.
2. **Build Pipeline Bottlenecks:** Rebuilding and testing the entire e-commerce app on every PR takes a long time, slowing down feedback loops.
3. **Technology Lock-in:** Upgrading React or shifting tooling requires a massive, coordinated effort across all 5 teams instead of allowing progressive adoption.

We need an integration strategy that allows each team to develop, test, and deploy their features independently without breaking other parts of the site.

## Options Considered

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Monorepo (Nx / Turborepo)** | Single git repository containing all projects. Shared components are imported locally using workspace aliases, but apps are built statically. | - Excellent compile-time type-safety.<br>- Single version of dependencies.<br>- Simplifies local refactoring. | - All deployments must still be coordinated.<br>- A broken commit in a deep dependency blocks all release pipelines.<br>- No runtime isolation. |
| **Build-time npm packages** | Each MFE is a separate git repo and publishes its build to a private npm registry. The Shell installs these packages and rebuilds. | - Clean, explicit version boundaries.<br>- Isolated source code repositories.<br>- Standard package installation tooling. | - Severe release coupling: Shell must be bumped, rebuilt, and redeployed for every minor remote update.<br>- Slow feedback loop. |
| **Module Federation (Webpack 5)** | Applications are deployed independently. The Shell dynamically fetches the compiled javascript entry point (`remoteEntry.js`) at runtime. | - True independent deployment (no Shell redeploy required).<br>- Automated runtime dependency sharing (singletons). | - No build-time type checking of remote modules.<br>- Potential style leakage.<br>- Debugging runtime errors (network, CORS) is more complex. |
| **iframe composition** | The Shell embeds each micro-frontend in a fully sandboxed `<iframe>` element. | - Hardest isolation (CSS, JS, and globals cannot leak).<br>- Safest for third-party components. | - Terrible UX (double scrollbars, sizing hacks, slow load times).<br>- Complex postMessage communication.<br>- Accessibility and SEO nightmare. |
| **single-spa** | Framework-agnostic client-side orchestrator that mounts/unmounts SPAs based on active routing. | - Excellent for multi-framework migrations (e.g., React + Angular). | - High orchestration boilerplate.<br>- Doesn't solve runtime dependency sharing elegantly out-of-the-box. |

## Decision
We choose **Webpack 5 Module Federation** as our integration strategy for DockerMart.

### Justification
Our primary constraint is organizational: 5 teams must deploy their code independently of each other. Build-time npm packages fail this constraint because they couple all releases back to the Shell's pipeline. Monorepos (without runtime federation) still lock teams into coordinated release cadences. 

Module Federation allows us to load remote modules dynamically at runtime while negotiating shared dependencies (like React) so that the user doesn't download multiple copies of the framework. This provides the best balance of deployment speed and runtime performance.

## Consequences

What trade-offs does this decision lock us into? What becomes harder because of this choice?

1. **Loss of Compile-time Type Safety across Boundaries:** Because remote modules are loaded dynamically in the browser at runtime, TypeScript cannot verify at build time if a remote team changed the API of their component. If the Checkout MFE renames a prop that the Shell uses, the build will pass but the app will crash at runtime. We must mitigate this with strict contract tests.
2. **Style and Global Namespace Pollution:** All micro-frontends execute in the same DOM and `window` context. A global CSS reset in the Checkout team's stylesheet or a collision in global variables can bleed and break the Catalog team's UI. We must establish CSS isolation rules (CSS Modules or prefixing) to prevent layout leakage.
3. **Observability and Diagnostic Complexity:** Identifying the source of a bug is harder. When a user experiences a blank screen, the issue could be a Shell routing error, a Checkout build error, a CDN delivery failure of a `remoteEntry.js` file, or a duplicate React version crash. Our logging and monitoring must attribute errors to specific remotes and build hashes at runtime.
