export interface User {
  id: string;
  name: string;
  roles: string[];
}

let cachedUser: User | null = null;

// Channel for synchronizing auth state across browser tabs (same origin)
const authChannel = new BroadcastChannel('mfe:auth');

export async function initAuth(): Promise<User | null> {
  // Simulate 200ms async API session check
  await new Promise((resolve) => setTimeout(resolve, 200));
  const user: User = { id: 'usr_01', name: 'Alice', roles: ['customer'] };
  cachedUser = user;
  return user;
}

export function getToken(): string | null {
  // Production practice: JWT lives in httpOnly secure cookie, inaccessible to client JS.
  return null;
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
  console.log('[Auth] Local logout executed. Clearing session and redirecting...');
  // Force clean state reload by redirecting to root
  window.location.href = '/';
}
