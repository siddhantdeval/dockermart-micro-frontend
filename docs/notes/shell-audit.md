# The Fat Shell Audit

This document audits the Shell implementation to ensure it remains a thin orchestrator and does not become a coupled monolithic bottleneck.

---

## 1. Does the Shell contain any business logic that belongs to a specific MFE?
**No.** 
The Shell only manages two platform-level concerns: generic navigation links (`GlobalNav.tsx`) and application bootstrapping via an initial session check (`initAuth` inside `auth.ts`). No product logic, such as price calculations, catalog item filtering, checkout validation rules, or account updates, lives inside the Shell folder.

---

## 2. Does the Shell import anything from a remote other than via `React.lazy` or the event bus?
**No.** 
The Shell imports remote entry components using strictly dynamic, asynchronous loaders:
*   `const CatalogApp = React.lazy(() => import('catalogApp/CatalogRoot'));`
*   `const CheckoutApp = React.lazy(() => import('checkoutApp/CheckoutRoot'));`
*   `const AccountApp = React.lazy(() => import('accountApp/AccountRoot'));`

There are no synchronous `import` statements loading files directly from the remote origins. This guarantees compiled-bundle decoupling.

---

## 3. Does the Shell own any product state (cart count, selected variant, user preferences)?
**No.** 
The Shell only maintains a single boolean state `authReady` to control the loading splash screen during the startup authentication validation process. All product-related data, such as cart quantities, product variant configurations, and account details, are completely absent from the Shell and delegated to the respective MFE boundaries.

---

## 4. Would the Shell need to be redeployed if the Checkout team adds a new route internally?
**No.** 
The Shell delegates routing using the wildcard route:
```tsx
<Route path="/checkout/*" element={<RemoteMount name="Checkout"><CheckoutApp /></RemoteMount>} />
```
Because of the `/*` wildcard, React Router passes the remaining path details to the Checkout remote. When the Checkout MFE mounts, it maps relative sub-paths (like `cart`, `shipping`, `payment`, `confirm`) inside its own independent router. 

If the Checkout team adds a new step like `/checkout/gift-wrap`, the change is implemented solely within `checkout-mfe/src/CheckoutRoot.tsx` and deployed. The Shell remains unchanged and does not need to be redeployed.
