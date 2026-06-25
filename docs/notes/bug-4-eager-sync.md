# Bug #4: Eager Sync Import (Shared Module Resolution)

This document analyzes the React compilation error that occurs when shared modules are imported synchronously in the entry file of a federated application.

---

## 1. Exact Error Message in the Browser
When loading `http://localhost:3001` or mounting the MFE inside the Shell:
> *Uncaught Error: Shared module is not available for eager consumption: webpack/sharing/consume/default/react/react*

---

## 2. Why the Async Tick Matters
Webpack Module Federation relies on **asynchronous version negotiation** at startup:
1. When the browser loads the page, the Webpack container runtime must consult all active `remoteEntry.js` files.
2. It lists all shared dependencies, inspects their semantic version ranges (`requiredVersion`), and decides which single source version to download.
3. Because fetching remote entry files and resolving these ranges requires network roundtrips, this negotiation process is inherently **asynchronous**.

If `src/index.js` imports React synchronously (`import React from 'react'`):
* Webpack attempts to execute the React bundle immediately.
* Since the shared dependency registration and selection process has not yet completed, the React singleton is still uninitialized in the shared scope.
* Webpack throws the fatal "eager consumption" runtime error.

### How `import('./bootstrap')` Resolves This
By moving the actual entry code to `src/bootstrap.tsx` and making `src/index.js` a dynamic `import('./bootstrap')` call, we create an **asynchronous boundary**. Webpack loads `index.js`, pauses execution to run the version negotiation asynchronously during that tick, and only runs the code inside `bootstrap.tsx` once all shared modules are safely resolved.

---

## 3. The `eager: true` Anti-Pattern
Stack Overflow solutions often recommend setting `eager: true` in the shared Webpack config:
```javascript
shared: {
  react: { singleton: true, eager: true }
}
```

### Why This is an Anti-Pattern
Setting `eager: true` tells Webpack to bundle the React package directly inside the initial entry file. While this bypasses the asynchronous negotiation tick (solving the immediate crash), it has a severe consequence:
* It forces the consumer to download this MFE's local React bundle immediately.
* It completely defeats lazy loading, as the shared library can no longer be loaded dynamically on-demand.
* It bloats the initial bundle size of the MFE, turning a runtime shared module back into a statically compiled dependency.
