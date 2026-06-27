import { AuthEventBus } from './mfe-event-bus';

export interface User {
  id: string;
  name: string;
  roles: string[];
}

let cachedUser: User | null = null;

// Channel for synchronizing auth state across browser tabs (same origin)
const authChannel = new BroadcastChannel('mfe:auth');

export async function initAuth(): Promise<User | null> {
  // Check if user manually logged out in this session
  if (sessionStorage.getItem('mfe_logged_out') === 'true') {
    cachedUser = null;
    return null;
  }

  // Simulate 200ms async API session check
  await new Promise((resolve) => setTimeout(resolve, 200));
  const user: User = { id: 'usr_01', name: 'Alice', roles: ['customer'] };
  cachedUser = user;
  
  // Broadcast login success to event bus
  AuthEventBus.emitReady(user);
  
  // Background interval that fires mfe:auth:refreshed every 15 minutes
  setInterval(() => {
    if (sessionStorage.getItem('mfe_logged_out') !== 'true') {
      console.log('[Auth] Token refresh loop triggered by Shell...');
      AuthEventBus.emitRefreshed(Date.now());
    }
  }, 15 * 60 * 1000);

  return user;
}

export function getToken(): string | null {
  // Production practice: JWT lives in httpOnly secure cookie, inaccessible to client JS.
  return null;
}

export function login(): void {
  sessionStorage.removeItem('mfe_logged_out');
  const user: User = { id: 'usr_01', name: 'Alice', roles: ['customer'] };
  cachedUser = user;
  
  console.log('[Auth] Login triggered. Broadcasting credentials client-side...');
  AuthEventBus.emitReady(user);
  
  // Client-side SPA navigation to root path without page reload
  window.history.pushState({}, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function broadcastLogout(): void {
  // Broadcast logout message to all other open tabs
  authChannel.postMessage({ type: 'LOGOUT' });
  performLocalLogout();
}

// Listen for logout events sent by other tabs
authChannel.onmessage = (event) => {
  if (event.data && event.data.type === 'LOGOUT') {
    performLocalLogout();
  }
};

function performLocalLogout() {
  cachedUser = null;
  sessionStorage.setItem('mfe_logged_out', 'true');
  console.log('[Auth] Local logout executed. Broadcasting clear state client-side...');
  
  AuthEventBus.emitReady(null);
  
  // Client-side SPA navigation to root path without page reload
  window.history.pushState({}, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
}
