# Architectural Note: Per-MFE Standalone E2E Testing

Testing micro-frontends in complete isolation is an extremely powerful pattern that dramatically speeds up CI verification pipelines and decouples deployment boundaries.

---

### 1. Why is standalone testing faster and more reliable than booting the full system?
*   **Minimal Orchestration overhead**: Booting the full federated ecosystem requires starting the Shell plus all remote servers (Catalog, Cart, Checkout, Account, Design System). Standalone testing only boots the single remote MFE under test.
*   **Reduced Flakiness**: Network timing, inter-MFE dependencies, and race conditions are removed. If another remote MFE team breaks their development server, it will not fail this MFE's test run.
*   **Fast Boot & Load Time**: Standalone servers start in milliseconds. Page loads are near-instantaneous as there are no loading waterfalls across multiple federated endpoints.

---

### 2. What class of bugs can this test catch that unit tests cannot?
*   **Routing Integration**: Verifies that standard React Router path updates function correctly under native browser history states (`pushState`/`popstate`).
*   **Browser API Sync**: Verifies integration with real browser mechanisms (form validation, autofill, cookie states, console reporting, local storage, history API).
*   **DOM Layout Interactions**: Asserts visual flow, keyboard tab focus, element visibility, and button clicking that JSDOM cannot replicate perfectly due to lack of a real rendering layout engine.

---

### 3. What class of bugs can this test NOT catch that full-system E2E can?
*   **Module Federation Load Failures**: Cannot catch version mismatch errors (e.g. `requiredVersion` conflict) or missing scripts (`remoteEntry.js` offline) as the shell is aborted/mocked.
*   **Event Bus Payload Drifts**: Cannot catch payload changes (e.g. if Catalog changes detail keys on `mfe:catalog:item-added` but Cart still listens for the old key).
*   **Origin / CORS / Network Issues**: Cannot check whether remote entry files fetch correctly across different CDN domains and origin configurations in production.
