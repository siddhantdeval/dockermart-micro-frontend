export interface User {
  id: string;
  name: string;
  roles: string[];
}

let cachedUser: User | null = null;

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
