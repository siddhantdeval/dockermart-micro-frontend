import { MfeEventBus, AuthEventBus, User } from './mfe-event-bus';
import { describe, test, expect, beforeEach, vi } from 'vitest';

describe('MfeEventBus Replay Cache (Task 9.1)', () => {
  beforeEach(() => {
    // Clear global window event bus cache object before each test run
    delete (window as any).__MFE_EVENT_BUS_CACHE__;
  });

  test('replays the cached state immediately for late subscribers', () => {
    const user: User = { id: 'usr_99', name: 'Bob', roles: ['admin'] };

    // Emit event before subscriber registers (simulating a late subscriber/lazy mount)
    AuthEventBus.emitReady(user);

    // Verify cache has captured the state
    const cache = (window as any).__MFE_EVENT_BUS_CACHE__;
    expect(cache).toBeDefined();
    expect(cache['mfe:auth:ready']).toEqual(user);

    // Setup subscription
    const handler = vi.fn();
    const unsubscribe = AuthEventBus.onReady(handler);

    // Assert that the handler is executed synchronously on subscription with cached state
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(user);

    unsubscribe();
  });

  test('calls the handler when new events are emitted after subscribing', () => {
    const handler = vi.fn();
    const unsubscribe = AuthEventBus.onReady(handler);

    // Initial state is not cached yet, so handler should not be called
    expect(handler).not.toHaveBeenCalled();

    const user: User = { id: 'usr_01', name: 'Alice', roles: ['customer'] };
    AuthEventBus.emitReady(user);

    // Verify handler receives the new emission
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(user);

    unsubscribe();
  });
});
