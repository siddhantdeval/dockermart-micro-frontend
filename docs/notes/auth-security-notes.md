# Micro-Frontend Shared Authentication Security Self-Assessment

This document outlines the security architecture of the DockerMart Micro-Frontend shared authentication model, addressing the critical questions that arise during a system security review.

---

## 1. LocalStorage vs. HttpOnly Secure Cookies

### Question: Why must the JWT live in an `httpOnly` secure cookie and NOT `localStorage`?
*   **LocalStorage Vulnerability**: `localStorage` is completely readable by any client-side JavaScript executing in the same tab (via `window.localStorage.getItem(...)`). If the application suffers from a Cross-Site Scripting (XSS) vulnerability, an attacker can execute a script that instantly exfiltrates the JWT to an external server.
*   **HttpOnly Isolation**: When a cookie is marked `httpOnly`, the browser explicitly prevents any client-side script from accessing it via `document.cookie`. Even in the event of a severe XSS compromise, the raw JWT cannot be read or stolen by JavaScript.
*   **Transport & Origin Security**: By adding the `Secure` flag (cookie only sent over HTTPS) and the `SameSite=Strict` or `SameSite=Lax` flag, we mitigate eavesdropping and Cross-Site Request Forgery (CSRF) vectors.

---

## 2. Shared Origin Attack Surfaces and Blast Radius

### Question: In a federated system where any remote's code executes in the same browser origin, how many attack surfaces does `localStorage` token storage create? What is the blast radius of a single compromised remote?
*   **Shared Origin Context**: Micro-frontends loaded via Webpack Module Federation share the host origin (e.g. `https://shop.dockermart.com`). They execute under the exact same global `window` and DOM space.
*   **Attack Surfaces**: The attack surface is equal to the **total sum of all remotes and their entire third-party dependency trees** loaded on the page. If Team A builds a checkout panel, but Team B's product-reviews footer widget gets compromised (via XSS or a supply-chain attack on a minor npm package), the reviews widget can execute arbitrary script in the context of the entire store.
*   **Blast Radius**: **Total compromise**. Because the origin is shared, a compromised footer MFE has equal access to `localStorage` as the checkout MFE. It can read the checkout MFE's `localStorage` tokens. The blast radius of a single compromised remote is the entire user session, regardless of which MFE owns the token.

---

## 3. Privilege Escalation via Fake Event Bus Emissions

### Question: What prevents a malicious third-party MFE from calling `mfeEmit('mfe:auth:ready', { id: 'admin', roles: ['superadmin'] })` and escalating privilege?
*   **Event Bus as UI State Only**: The event bus is a **presentation-layer convenience**, not an authentication or authorization authority.
*   **Client-Side Fake**: A malicious or hijacked script can easily construct a fake user payload and dispatch it to the event bus. This will trigger components to render "Admin Mode" UI views (e.g., displaying the admin control panel tabs or buttons).
*   **Server-Side Verification (The Real Guardrail)**: Even if the client UI renders the administration controls, the MFE must fetch data from the server API gateway (e.g., `/api/admin/metrics`). When this request is dispatched, the browser sends the actual `httpOnly` secure session cookie.
*   The backend gateway validates the cookie signature. Because the backend session is still a standard `customer` session, it rejects the request with a `403 Forbidden` status. The UI will fail to load any admin data, and the privilege escalation attempt is thwarted. Client-side authentication states only manage visibility, never permission.

---

## 4. Late-Subscriber Replay Cache Security Risks

### Question: How does the last-state cache prevent the late-subscriber problem — and what is the cache's own security risk if an attacker can write to it?
*   **Replay Mechanics**: Since remotes are loaded dynamically (e.g., Account MFE is downloaded with a 600ms chunk delay), they mount long after the Shell has authenticated. The `AuthEventBus.onReady` wrapper queries the window-scoped cache `window.__MFE_EVENT_BUS_CACHE__` synchronously during subscription. If a session is already cached, it invokes the listener instantly, preventing blank or unauthenticated flashes of UI.
*   **Cache Poisoning Risk**: Because the cache lives in a global object (`window.__MFE_EVENT_BUS_CACHE__`), it is fully writable by any script executing in the same origin. An XSS attacker can write fake user states directly to the cache before the remote components load:
    ```javascript
    window.__MFE_EVENT_BUS_CACHE__['mfe:auth:ready'] = { id: 'usr_02', name: 'Malicious', roles: ['admin'] };
    ```
*   **Mitigation**:
    1.  The client-side cache must be treated as **entirely untrusted**. Never use cached user data for any secure local calculation.
    2.  For critical authorization flows (e.g., rendering credit card details), the consuming MFE should query the server gateway directly.
    3.  We can secure the global cache object at startup by freezing the property configurations using `Object.defineProperty` once the host Shell initializes, preventing override or prototype pollution attacks by external scripts.
