# Widget vs. Page Micro-Frontends: Anti-Pattern Analysis

This document details the architectural difference between route-bound (page) micro-frontends and persistent navigation components (widgets), highlighting common composition anti-patterns.

---

## 1. What breaks if you load the `CartWidget` via `React.lazy` inside a route?

If the Shell loads the `CartWidget` inside a route-bound container (meaning it unmounts and mounts during navigation transitions) or lazy-loads it on every route switch:

1.  **Visual Flickering (UX Degradation):** As the user transitions between routes (e.g. from `/catalog` to `/checkout`), the Shell unmounts the previous page and mounts the next. If the navbar widget is tied to the page lifecycle, it will flash or temporarily show a loading fallback spinner on every click, making the header look slow and unpolished.
2.  **State Dissolution:** If the user opens the `MiniCart` dropdown widget and then clicks a navigation link, the widget will unmount, wiping its local state. By keeping the widget eagerly loaded and mounted inside the persistent `GlobalNav` wrapper, its rendering state remains preserved across routing transitions.
3.  **Timing Race Conditions:** If the widget unmounts and remounts, any global event handlers it relies on are torn down and re-registered. This increases the likelihood of missing events fired during page load transitions (the late-subscriber timing gap).

---

## 2. Why the Cart team's deploy does not require a Shell redeploy (and what would change that)

### The Autonomy Guarantee
Because Webpack Module Federation binds modules at **runtime**, the Shell contains no actual compiled code of `CartWidget.tsx`. The Shell's built assets only contain a link instruction pointing to the Cart remote's entry point (`cartApp@http://localhost:3002/remoteEntry.js`). 
If the Cart team changes their button styling, adds animations, or refactors their internal state, they build and push their bundle. The Shell dynamically fetches the new script on the next page load.

### What would force a Shell redeploy?
1.  **Interface API Contract Break:** If the Cart team changes the path key in their Webpack exposes configuration (e.g. renaming `./CartWidget` to `./CartWidgetV2`), or renames the exported component, or changes the required props (e.g., forcing the Shell to pass a new callback prop), the Shell will fail to render it. The Shell team must write code changes to match the new API and redeploy the Shell.
2.  **Shift to Build-Time Integration:** If the organization decides to package the Cart widget as a standard npm package, the version is pinned at build time. Any update to the Cart widget requires a Shell build update, version bump, and redeploy.

---

## 3. When is an iframe a better choice than Module Federation for a widget?

While Module Federation is ideal for first-party components, there are two scenarios where an **iframe** is a superior choice:

### Scenario A: Embedding Untrusted Third-Party Code (Security Sandbox)
*   **Example:** A payment form widget (e.g. Stripe Elements), customer support chat (e.g. Intercom), or social sharing widgets.
*   **The Trade-off:** 
    *   *iframe Benefit*: The iframe runs in a sandbox. The third-party code cannot inspect the Shell's DOM, hook keypresses (to steal card numbers/passwords), or access the Shell's cookies and `localStorage`.
    *   *The Cost*: Styling is completely isolated. You cannot style the third-party widget using your local CSS tokens unless they support an explicit styling API, and communication is limited to asynchronous string serialization via `postMessage`.

### Scenario B: Legacy System Integration (Style & Context Sandbox)
*   **Example:** Integrating a legacy customer feedback widget built in jQuery 1.x or AngularJS that cannot be refactored, but must be embedded.
*   **The Trade-off:**
    *   *iframe Benefit*: The legacy widget is sandboxed. Its global variables and global CSS styles (such as global resets) cannot bleed out and break the Shell or React layout.
    *   *The Cost*: You must handle dynamic height adjustment (using `ResizeObserver` postMessage hacks) to prevent cut-off pages or inner scrolls. Accessibility (`tabindex` navigation, screen readers) is also broken across the frame boundary.
