type EventCache = Record<string, unknown>;

const lastState: EventCache = {};

export function mfeEmit<T>(event: string, detail: T): void {
  lastState[event] = detail;
  window.dispatchEvent(new CustomEvent(event, { detail }));
}

export function mfeOn<T>(event: string, handler: (detail: T) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<T>).detail);
  window.addEventListener(event, listener);
  
  // Late-subscriber replay: Hydrate this remote MFE instantly if the event has already fired
  if (event in lastState) {
    handler(lastState[event] as T);
  }
  
  // Return cleanup function to easily unsubscribe inside React useEffect
  return () => window.removeEventListener(event, listener);
}
