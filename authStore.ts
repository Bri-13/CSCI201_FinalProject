// ============================================================
// authStore.ts — minimal in-memory auth store
//
// Login / signup flow:
//   1. user submits form on login.js -> POST AuthServlet
//   2. on success, call setUser({ username })
//   3. home/profile/recipe-detail read getUser() to display avatar
//
// Note: this is in-memory only. Refreshing the app clears it.
// Persistence across restarts would need AsyncStorage — out of scope
// for now, but easy to add later.
// ============================================================

type User = {
  username: string;
  email: string;
  user_id: number;
} | null;

let currentUser: User = null;
const listeners: Array<(u: User) => void> = [];

export function getUser(): User {
  return currentUser;
}

export function setUser(user: User) {
  currentUser = user;
  listeners.forEach((fn) => fn(user));
}

export function clearUser() {
  setUser(null);
}

export function subscribe(fn: (u: User) => void): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function isLoggedIn(): boolean {
  return currentUser !== null;
}
