# DockerMart: Compilation, Dependency Roles & Runtime Wiring

This document provides a comprehensive overview of how Webpack, Babel, TypeScript, and Module Federation are wired together. It explains the purpose of each development dependency and traces the flow of a remote module from compilation to execution in the browser.

---

## 1. The Big Picture: Code Compilation Flow

In a React + TypeScript micro-frontend project, code goes through two major phases: **Compile Time** (running on your machine or CI) and **Runtime** (running in the user's browser).

```
[TSX Source Code] (App.tsx)
        │
        ▼ (Compile Time: Babel + Webpack)
┌──────────────────────────────────────┐
│ 1. TS compiler type-checks (tsc)     │
│ 2. Babel transpile TSX -> ES5/ES6 JS │
│ 3. Webpack bundles & chunks files    │
└──────────────────────────────────────┘
        │
        ▼ (Deploys to Dev Server / CDN)
[Build Artifacts] (main.js, remoteEntry.js, [hash].chunk.js)
        │
        ▼ (Runtime: Browser)
┌──────────────────────────────────────┐
│ 1. Browser loads Shell index.html    │
│ 2. Shell reads remoteEntry.js        │
│ 3. Version negotiation (React)       │
│ 4. Dynamically mounts Catalog MFE    │
└──────────────────────────────────────┘
```

---

## 2. DevDependency Breakdown

Here is what each package in our `package.json` does and why it is required:

### The Bundler Stack
*   **`webpack` (v5.x)**: The core bundler. It traces the dependency graph (following `import` statements) starting from our entry point (`src/index.js`) and outputs optimized javascript files.
*   **`webpack-cli` (v4.x)**: The command line interface that allows us to invoke webpack from package scripts (e.g. running `webpack serve` or `webpack --mode production`).
*   **`webpack-dev-server` (v4.x)**: Spins up a local HTTP server with Live Reloading/HMR capabilities so we can preview the app on localhost.

### The Transpilation Stack (Babel)
Rather than using `ts-loader` (which uses the official TypeScript compiler `tsc` to emit code), we use **Babel** for code transformation:
*   **`babel-loader`**: A Webpack loader that passes code to Babel before bundling.
*   **`@babel/core`**: The core Babel compilation engine.
*   **`@babel/preset-env`**: Automatically transpiles modern JavaScript features (ES6+) down to a version compatible with older browsers.
*   **`@babel/preset-react`**: Transpiles JSX syntax (`<div />`) into standard React function calls (`React.createElement(...)`).
*   **`@babel/preset-typescript`**: Strips out TypeScript type annotations so that Babel is compiling pure JavaScript.
    *   *Why choose Babel over `ts-loader`?* Babel compiled code is faster because it does not block compilation on type errors. It strips types instantly. We run Type checking separately as a background task (`tsc --noEmit`), separating the concerns of type-validation and code-generation.

### The TypeScript Type Stack
*   **`typescript` (v5.x)**: Provides the static compiler `tsc` for type analysis.
*   **`@types/react` & `@types/react-dom`**: Standard type definitions for React APIs.

### Webpack Plugins
*   **`html-webpack-plugin`**: Creates the HTML landing page for each app. It automatically injects the compiled javascript script tags into the `<head>` or `<body>` so you do not have to write them manually.

---

## 3. Micro-Frontend Runtime Wiring

When using Webpack 5 Module Federation, the wiring of different apps occurs **dynamically in the browser** at runtime, not during compile time.

```
Browser               Shell (Port 3000)          Catalog MFE (Port 3001)
  │                           │                             │
  ├─────── Gets / ───────────>│                             │
  │<────── index.html ────────┤                             │
  │                           │                             │
  │─── Fetches Entry Bundle ─>│                             │
  │<───── main.js ────────────┤                             │
  │                           │                             │
  │─── Fetches Catalog Entry ──────────────────────────────>│
  │<─── remoteEntry.js (manifest of exposed modules) ───────│
  │                           │                             │
  │                           ├─ Checks react versions ─────┤
  │                           ├─ Resolves shared singleton ─┤
  │                           │                             │
  │─── Requests CatalogRoot chunk ─────────────────────────>│
  │<─── [hash].chunk.js ────────────────────────────────────│
  │                           │                             │
  ├─ Mounts Catalog into DOM ─┤                             │
```

### The Version Negotiation Step
When the Shell and the Catalog MFE both declare `react` in their `shared` configurations:
1.  The Shell boots and loads its copy of React.
2.  When it resolves Catalog MFE, the Shell checks the version requirement specified in Catalog's `remoteEntry.js`.
3.  Because `singleton: true` is configured, Webpack decides to load only **one** instance of React (the higher compatible version).
4.  Catalog MFE consumes the Shell's React instance, preventing hook state crashes and redundant package downloads.

### The Async Bootstrap Trick (`import('./bootstrap')`)
Why does `src/index.js` only contain `import('./bootstrap')`?

If we loaded React and booted our app synchronously in `index.js` like a standard React project, Webpack would run our app code *before* the Module Federation runtime has checked remote versions. The async `import('./bootstrap')` creates an asynchronous boundary. During this delay, Webpack:
1.  Fetches the remote entry files.
2.  Negotiates shared dependencies.
3.  Determines which singleton library instances to load.
4.  Only then executes the code inside `src/bootstrap.tsx` once the runtime environment is aligned.
