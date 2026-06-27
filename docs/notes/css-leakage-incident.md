# CSS Leakage Incident Report: DockerMart MFE

## 1. Incident Description
When navigating to the **Checkout MFE** and then back to the **Catalog MFE**, the entire application layout, typography, and button components become severely broken. The styling of the Catalog buttons changes dramatically: they display with monospace font, hot pink background, large padding, and dashed green borders. Additionally, the global font of the shell navigation and headers reverts to monospace.

---

## 2. Root Cause Analysis
In Webpack Module Federation, all micro-frontends share the same browser window, DOM structure, and JavaScript runtime.
* **Global Selectors:** `checkout-mfe` imports `checkout.css`, which contains global rules for `*` and `button` with `!important` flags.
* **Cascading Injection:** When the Checkout route (`/checkout/*`) mounts, the bundler's style loader dynamically inserts a `<style>` block containing the contents of `checkout.css` into the `<head>` of the DOM.
* **Persistent Stylesheet Lifecycle:** When the user navigates back to the Catalog page, the Checkout component unmounts from the React tree, but the browser's CSSOM does *not* automatically purge the injected `<style>` block. Consequently, the styles remain active in the document head and apply globally to the Catalog elements.

---

## 3. Timing and Loading Sequence Gaps
The visibility and reproduction of this leakage depend heavily on navigation history and network latency:
1. **Catalog first (Clean start):** If a user lands directly on `/catalog` and has not visited `/checkout`, the Catalog looks normal because `checkout.css` has not yet been fetched or injected.
2. **Post-Checkout Pollution:** As soon as the user visits `/checkout`, the stylesheet is loaded and injected into the `<head>`. From this point forward, every page is polluted.
3. **Local Dev vs. Production:**
   * In **local dev**, chunks are loaded dynamically via hot-reloading dev servers, meaning the leakage persists once any module is loaded.
   * In **production**, depending on whether assets are injected via standard `<link rel="stylesheet">` tags in index.html or injected dynamically by JavaScript chunks, style resolution can be non-deterministic, varying with CDNs and cache hit rates.

---

## 4. Visual Evidence of Failure
The global stylesheet overrides:
```css
* {
  font-family: 'Courier New', Courier, monospace !important;
  color: #ff3366 !important;
}

button {
  background-color: #ff3366 !important;
  color: #ffffff !important;
  border: 4px dashed #33ff66 !important;
  padding: 15px 30px !important;
  font-size: 20px !important;
  border-radius: 20px !important;
  font-weight: bold !important;
  box-shadow: 0 8px 16px rgba(255, 51, 102, 0.4) !important;
}
```
This forces all buttons, including those in Catalog MFE (which has inline green styling) and the Shell, to look identical to Checkout buttons, causing an unacceptable degradation of the user interface.
