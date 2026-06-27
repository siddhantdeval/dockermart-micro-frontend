interface GlobalsWithEventCache extends Window {
  __MFE_EVENT_BUS_CACHE__?: Record<string, unknown>;
}

// Bind cache to window object so that independently compiled instances of this file
// across different remote MFE bundles share the same state cache in the browser DOM.
const getCache = (): Record<string, unknown> => {
  const g = window as unknown as GlobalsWithEventCache;
  if (!g.__MFE_EVENT_BUS_CACHE__) {
    g.__MFE_EVENT_BUS_CACHE__ = {};
  }
  return g.__MFE_EVENT_BUS_CACHE__;
};

// Base generic MfeEventBus class that handles raw events and the global window cache
export class MfeEventBus {
  public static emit<T>(event: string, detail: T): void {
    const cache = getCache();
    cache[event] = detail;
    window.dispatchEvent(new CustomEvent(event, { detail }));
  }

  public static on<T>(event: string, handler: (detail: T) => void): () => void {
    const listener = (e: Event) => handler((e as CustomEvent<T>).detail);
    window.addEventListener(event, listener);

    const cache = getCache();
    if (event in cache) {
      handler(cache[event] as T);
    }

    return () => window.removeEventListener(event, listener);
  }
}

// User interface needed for AuthEventBus type references
export interface User {
  id: string;
  name: string;
  roles: string[];
}

// Concern-specific Event Bus for Authentication events
export class AuthEventBus {
  /**
   * Emits the authentication status to all subscribers.
   * @param user - The user object or null if the user is not authenticated.
   * Event Type: 'mfe:auth:ready'
   */
  public static emitReady(user: User | null): void {
    MfeEventBus.emit<User | null>('mfe:auth:ready', user);
  }

  /**
   * Subscribes to authentication status updates.
   * @param handler - The callback function that will be invoked with the user object.
   * Returns a cleanup function that removes the event listener.
   * Event Type: 'mfe:auth:ready'
   */
  public static onReady(handler: (user: User | null) => void): () => void {
    return MfeEventBus.on<User | null>('mfe:auth:ready', handler);
  }

  /**
   * Emits the authentication token refresh status to all subscribers.
   * @param timestamp - The timestamp of when the token was refreshed.
   * Event Type: 'mfe:auth:refreshed'
   */
  public static emitRefreshed(timestamp: number): void {
    MfeEventBus.emit<{ timestamp: number }>('mfe:auth:refreshed', { timestamp });
  }

  /**
   * Subscribes to authentication token refresh status updates.
   * @param handler - The callback function that will be invoked with the timestamp of when the token was refreshed.
   * Returns a cleanup function that removes the event listener.
   * Event Type: 'mfe:auth:refreshed'
   */
  public static onRefreshed(handler: (detail: { timestamp: number }) => void): () => void {
    return MfeEventBus.on<{ timestamp: number }>('mfe:auth:refreshed', handler);
  }
}

// Concern-specific Event Bus for Cart events
export class CartEventBus {
  /**
   * Emits the cart count to all subscribers.
   * @param count - The number of items in the cart.
   * Event Type: 'mfe:cart:updated'
   */
  public static emitUpdated(count: number): void {
    MfeEventBus.emit<{ count: number }>('mfe:cart:updated', { count });
  }

  /**
   * Subscribes to cart count updates.
   * @param handler - The callback function that will be invoked with the cart count.
   * Returns a cleanup function that removes the event listener.
   * Event Type: 'mfe:cart:updated'
   */
  public static onUpdated(handler: (detail: { count: number }) => void): () => void {
    return MfeEventBus.on<{ count: number }>('mfe:cart:updated', handler);
  }
}

// Legacy backward-compatible functional wrappers (for requirement compliance & test specs)
export function mfeEmit<T>(event: string, detail: T): void {
    /**
     * Emits an event to all subscribers.
     * @param event - The event to emit.
     * @param detail - The data to emit.
     */
  MfeEventBus.emit<T>(event, detail);
}

export function mfeOn<T>(event: string, handler: (detail: T) => void): () => void {
  /**
   * Subscribes to an event.
   * @param event - The event to subscribe to.
   * @param handler - The callback function that will be invoked with the event data.
   * Returns a cleanup function that removes the event listener.
   */
  return MfeEventBus.on<T>(event, handler);
}
