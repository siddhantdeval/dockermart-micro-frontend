# Bug #3: The `publicPath` Trap

This document details the common production pitfall where lazy-loaded remote chunks fail to load due to misconfigured static asset paths.

---

## 1. What Happens to `remoteEntry.js` vs. Lazy Chunks

When loading a remote MFE, the process occurs in two separate network steps:

1. **`remoteEntry.js` Loading (Success):** The Shell successfully fetches `remoteEntry.js` from the location defined in its own `webpack.config.js` (`http://localhost:3001/remoteEntry.js`). This step passes.
2. **Lazy-loaded Chunks (Fail / 404):** When the user triggers an action that mounts `CatalogRoot` (which is lazy-loaded), Webpack needs to fetch the actual component file (e.g. `src_CatalogRoot_tsx.js`). 
   * To build this request, Webpack looks inside the loaded `remoteEntry.js` for the remote's compiled `output.publicPath`.
   * Because `publicPath` was configured as `https://cdn.dockermart.io/catalog/`, Webpack bypasses the localhost origin and requests the chunk from `https://cdn.dockermart.io/catalog/src_CatalogRoot_tsx.js`.
   * Since this CDN host does not exist or does not serve the development build, the browser network request fails with a **404 (Not Found)** or a **CORS error**.

---

## 2. Why the Shell Renders a Blank Screen Without Errors

When Webpack fails to download a chunk, it throws a JS error inside its runtime bundler loader (e.g. `ScriptExternalLoadError: Loading script failed.`). 
However:
* If the Shell does not wrap the dynamically loaded remote MFE in a React **Error Boundary**, the promise rejection goes unhandled.
* In React 16+, unhandled errors during the render phase cause React to unmount the entire component tree, leaving the user with a completely blank white screen.
* The browser console will show a failed script load resource error, but the application UI provides no fallback or indicator of failure.

---

## 3. The Resolution

### The Dev / Prod Split Configuration
To fix this, we use the `auto` property for production builds, which tells Webpack to dynamically compute the path relative to the script that is currently executing (`remoteEntry.js`):

```javascript
// catalog-mfe/webpack.config.js
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  output: {
    // 'auto' infers the path from the script src URL (ideal for CDNs)
    // Dev server requires the explicit localhost URL for routing fallbacks
    publicPath: isProd ? 'auto' : 'http://localhost:3001/',
  }
}
```

By setting `publicPath: 'auto'`, if `remoteEntry.js` is loaded from `https://cdn.company.com/catalog/remoteEntry.js`, all subsequent chunks will automatically be requested from `https://cdn.company.com/catalog/`.
