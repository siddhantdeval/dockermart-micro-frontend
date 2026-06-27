# Micro-Frontend CSS Isolation Strategies Comparison

To ensure style encapsulation in a micro-frontend architecture, several strategies can be used. Below is a comparative analysis of the four primary approaches:

---

## 1. CSS Modules
* **How it works:** Renames CSS class names at build time to append a unique hash (e.g., `.btn` becomes `.CheckoutPanel__btn__[hash]`).
* **Pros:**
  * Native support in Webpack/Babel/Vite via `css-loader`.
  * Clean developer experience (importing styles as JS objects).
  * Highly effective at preventing accidental classname collisions.
* **Cons:**
  * Requires refactoring source code to map all class names through the `styles` object.
  * Does not prevent broad element resets (e.g., `*` or `button` styles) from leaking unless written as local classes.
  * Cannot easily scope third-party CSS.

---

## 2. PostCSS Prefixing (`postcss-prefix-selector`)
* **How it works:** A build-time post-processor scans all CSS selectors and automatically prepends a namespace class (e.g., `button` becomes `.catalog-app button`).
* **Pros:**
  * Zero changes required inside the CSS source files.
  * Scopes legacy or third-party CSS files automatically.
  * Allows global tags (`body`, `html`) to be re-mapped to the prefix class.
* **Cons:**
  * Requires wrapping the micro-frontend root element in a DOM container matching the prefix (e.g. `<div className="catalog-app">`).
  * Increases CSS selector size slightly in bundle output.

---

## 3. Shadow DOM (Web Components)
* **How it works:** Encapsulates the entire micro-frontend inside a Shadow Root, isolating its DOM sub-tree from the main document styles.
* **Pros:**
  * Genuine, browser-native 100% encapsulation.
  * Absolute security: global page styles cannot leak in, and MFE styles cannot leak out.
* **Cons:**
  * Breaks shared styles and design system variables unless explicitly duplicated inside the shadow root.
  * Breaks event bubbling and React event delegation in older versions.
  * Complex server-side rendering (SSR) setup (requires Declarative Shadow DOM).

---

## 4. CSS Cascade Layers (`@layer`)
* **How it works:** Organizes styles into priority-based layers. Styles in higher-priority layers override styles in lower-priority layers, regardless of selector specificity.
* **Pros:**
  * Native CSS standard with wide browser support.
  * Resolves CSS specificity battles cleanly.
* **Cons:**
  * Does not prevent naming collisions; if MFE A and MFE B define `.card` in the same layer, they will still collide based on loading order.
  * Requires micro-frontends to coordinate layer names globally.

---

## Summary Matrix

| Strategy | Encapsulation | Refactoring Effort | Third-party Support | Setup Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **CSS Modules** | Class-level only | High (JS integration) | Poor | Low |
| **PostCSS Prefixing** | App-level namespace | None (Build-time) | Excellent | Medium |
| **Shadow DOM** | Absolute browser-level | Low | Medium | High |
| **Cascade Layers** | Specificity control only | Medium | Good | Low |
