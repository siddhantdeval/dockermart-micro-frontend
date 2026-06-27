# Implementation Plan: DockerMart Micro-Frontend (Phase 8)

This plan outlines the implementation of **Phase 8: Shared Authentication**. We will build a secure, shell-owned authentication state machine, synchronize login/logout states across browser tabs using the `BroadcastChannel` API, consume auth states in remotes via the namespaced event bus, and implement a shell-governed token refresh cycle. We will verify the late-subscriber replay caching using the **Account MFE**.

---

## Senior Dev Context: Why Phase 8 Matters
In a monolithic frontend, authentication state is maintained globally (e.g., inside a React Context). In a micro-frontend architecture (MFE):
1. **Security Isolation:** Individual remotes must **never** have direct access to credentials or raw JWT tokens. Storing tokens in `localStorage` opens an XSS attack vector where a compromised remote can steal credentials.
2. **Single Source of Truth:** Only the parent **Shell** should own the authentication lifecycle and validate sessions. Remotes must never call their own `/api/me` sessions.
3. **Late Subscriber Problem:** Remotes load lazily. If the Shell completes authentication at `200ms` but the Account remote doesn't load until `800ms`, the Account MFE will miss the original login event. We must use our event bus's **last-state replay cache** to hydrate late-mounting remotes instantly, preventing user interface flashes or authentication bypasses.

---

## Proposed Phase 8 Steps

### Task 8.1 — Shell-Owned Auth Flow
We will update `shell/src/auth.ts`:
*   **Ready Broadcast**: Call `mfeEmit('mfe:auth:ready', user)` inside the `initAuth()` validation function.
*   **Token Isolation**: Enforce the `getToken()` API returning `null`, reflecting httpOnly cookie management.
*   **Token Refresh Cycle**: Implement a background `setInterval` in the Shell that triggers a token refresh event `mfe:auth:refreshed` every 15 minutes.

---

### Task 8.2 — Auth Consumption in Remotes
We will consume the auth state in the Account MFE and Catalog MFE:
*   **Account MFE consumption**: Update `AccountRoot.tsx` to subscribe to `mfe:auth:ready` and `mfe:auth:refreshed` via the event bus:
    ```typescript
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
      const unsubscribeReady = AuthEventBus.onReady((u) => setUser(u));
      const unsubscribeRefreshed = AuthEventBus.onRefreshed((detail) => {
        console.log('[Account] Auth token refreshed at:', detail.timestamp);
      });
      return () => {
        unsubscribeReady();
        unsubscribeRefreshed();
      };
    }, []);
    ```
*   **Catalog consumption**: Similarly subscribe Catalog MFE to the auth state.
*   **MFE Mounting Delay Simulation**: Update the lazy loader for Account MFE in Shell's `App.tsx` to inject a `600ms` artificial delay:
    ```typescript
    const AccountApp = React.lazy(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return import('accountApp/AccountRoot');
    });
    ```
    This simulates a late-subscriber scenario where Account MFE mounts long after the Shell has authenticated. We will verify that Account MFE gets the authenticated user instantly without flashing a "guest" or "null" state.

---

### Task 8.3 — Security Self-Assessment
We will create [auth-security-notes.md](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/docs/notes/auth-security-notes.md) and answer the security questions:
1. Why JWTs must live in httpOnly cookies instead of localStorage.
2. Attack surface and blast radius of localStorage storage in a shared-origin federated app.
3. Preventing privilege escalation from a hijacked MFE.
4. Cache replay mechanics and risks of event bus cache poisoning.

---

## Proposed Changes

### [MODIFY] [auth.ts](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/shell/src/auth.ts)
Emit auth events and set up background token refresh loops.

### [MODIFY] [App.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/shell/src/App.tsx)
Add mounting delay for Account MFE to test late subscriber hydration.

### [MODIFY] [AccountRoot.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/account-mfe/src/AccountRoot.tsx)
### [MODIFY] [CatalogRoot.tsx](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/catalog-mfe/src/CatalogRoot.tsx)
Subscribe to namespaced event notifications for user authentication.

### [NEW] [auth-security-notes.md](file:///Users/sid/Siddhant/Dockyard/microservices/micro-frontend/docs/notes/auth-security-notes.md)
Security self-assessment answers.

---

## Verification Plan

### Automated Verification
*   Verify successful compilation via `npx tsc --noEmit`.

### Manual Verification
1.  **Late-Subscriber Verification**: Verify in the browser console that when mounting Account MFE, the user object is immediately populated from the replay cache without any null-user intermediate state during the 600ms mounting chunk delay.
2.  **Token Refresh Propagation**: Adjust the refresh interval to 5 seconds temporarily, and check the console logs to confirm that all loaded remotes receive the `mfe:auth:refreshed` ticks.
