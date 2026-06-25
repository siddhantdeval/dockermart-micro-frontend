# Bug #1: Duplicate React Instance (React Hooks Error)

This document analyzes the Duplicate React error that occurs when a remote MFE and the Shell load separate copies of React in the same browser session.

---

## 1. Exact Error Message in the Browser
When loading `http://localhost:3000` with the duplicate configuration:
> *Uncaught Error: Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:*
> *1. You might have mismatching versions of React and the renderer (such as React DOM)*
> *2. You might be breaking the Rules of Hooks*
> *3. You might have more than one copy of React in the same app*

---

## 2. Why It Happened (Under the Hood)
React maintains a single global execution context at runtime. This context stores the **dispatcher** (the internal engine that resolves hooks like `useState` and `useEffect`). 

When `singleton: true` is omitted from React's configuration in the Catalog remote:
1. Webpack resolves the Shell's React instance and runs the Shell's React code.
2. The browser then requests and executes the Catalog MFE chunk.
3. Because Catalog does not specify that React must be a singleton, Webpack does not reuse the Shell's React context. It downloads and executes a **second independent React script** from Port 3001.
4. When a component inside the Catalog remote executes and invokes a hook (e.g. inside `CatalogRoot`), it calls the dispatcher of the *Catalog React script*, but the active component rendering cycle was initialized by the *Shell's React script*.
5. The dispatcher is resolved as `null`, causing React to throw the "Invalid hook call" runtime exception.

---

## 3. Why `singleton: true` Prevents It
The `singleton: true` option inside the `ModuleFederationPlugin` shared dependencies configuration forces Webpack to negotiate a single version of the package across the host and all loaded remotes.
Instead of downloading and instantiating multiple script copies in the DOM, Webpack resolves a single instance (usually matching the highest compatible version declared) and injects it into all consuming federated scopes.

---

## 4. Why It Doesn't Appear on Localhost (With Identical Versions)
In local development, if both the Shell and Catalog MFE declare identical versions of React (e.g. `^18.2.0`) in their `package.json` files and share the same node_modules parent folder, or have exact matching versions on localhost, Webpack may resolve the same directory or identical dependency files, masking the issue.

However, in **production**:
* The Shell is built and deployed to `shell.company.com`.
* The Catalog MFE is built and deployed to `catalog.company.com`.
* At runtime, they are served from different domains. Webpack has no way of statically sharing files across builds, and the absence of a runtime singleton contract forces each app to fetch its own bundle, exposing the double React error.
