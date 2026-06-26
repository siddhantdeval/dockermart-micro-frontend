# BroadcastChannel: Cross-Tab Sync & Memory Management

This document details the mechanics of tab synchronization using the `BroadcastChannel` API, focusing on memory leak prevention and iframe boundary interactions.

---

## 1. Memory Leak Prevention with `BroadcastChannel`

### What happens when components unmount?
If a `BroadcastChannel` is instantiated globally at the module level (e.g. `const authChannel = new BroadcastChannel('mfe:auth')` in `auth.ts`), the channel and its listener remain allocated for the entire lifetime of the browser tab's Javascript context. Since this context runs for the duration of the user's session, it is cleaned up automatically when the tab is closed or reloaded.

However, if a `BroadcastChannel` listener is registered **inside a React component**:
```typescript
// IN A COMPONENT — Potential Memory Leak
useEffect(() => {
  const channel = new BroadcastChannel('mfe:auth');
  channel.onmessage = (e) => handleStateChange(e.data);
}, []);
```
When the user navigates (e.g. to `/login`) and the component unmounts:
*   The garbage collector **cannot** clean up the component or the `handleStateChange` function because the browser's global `BroadcastChannel` event dispatcher still holds a reference to the event handler callback.
*   Every time the user visits and leaves that page, a new channel and listener are created, causing a progressive memory leak.

### How to prevent the leak
You must explicitly close the channel or detach the message listener inside the React `useEffect` cleanup callback:
```typescript
// IN A COMPONENT — Correct Cleanup
useEffect(() => {
  const channel = new BroadcastChannel('mfe:auth');
  channel.onmessage = (e) => handleStateChange(e.data);
  
  return () => {
    channel.close(); // Detaches all listeners and closes the channel socket
  };
}, []);
```

---

## 2. Iframe Boundaries & Origin Constraints

Does the `BroadcastChannel` cross the iframe boundary?

*   **Same-Origin Iframes (YES):** If the iframe is hosted on the **same origin** (same protocol, host domain, and port, e.g. `<iframe src="/legacy-account" />`), the `BroadcastChannel` will cross the iframe boundary natively. Both the parent Shell and the iframe component will receive and broadcast messages on the same channel.
*   **Cross-Origin Iframes (NO):** If the iframe is hosted on a different domain or port (e.g. the Shell is on `localhost:3000` and the iframe is on `localhost:3005`), the `BroadcastChannel` **cannot** cross the boundary due to the browser's Same-Origin Policy.
    *   *Workaround:* To communicate with a cross-origin iframe, you must use the standard `window.postMessage` API, specifying the target origin explicitly for security: `iframeWindow.postMessage(message, 'http://localhost:3005')`.
