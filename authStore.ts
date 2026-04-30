// ============================================================
// authStore.ts — auth store with AsyncStorage persistence
//
// Login / signup flow:
//   1. user submits form on login.js -> POST AuthServlet
//   2. on success, call setUser({ username, email, user_id })
//   3. home/profile/recipe-detail read getUser() to display avatar
//   4. setUser also persists to AsyncStorage so refresh keeps the user
//
// Other parts of the app (e.g. profile.tsx) may read AsyncStorage
// directly via the same 'user_id' / 'user' keys.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  username: string;
  email: string;
  user_id: number;
} | null;

const STORAGE_USER_KEY = 'user';
const STORAGE_USER_ID_KEY = 'user_id';

let currentUser: User = null;
const listeners: Array<(u: User) => void> = [];

export function getUser(): User {
  return currentUser;
}

export function setUser(user: User) {
  currentUser = user;
  listeners.forEach((fn) => fn(user));

  // Persist to AsyncStorage so other parts of the app (e.g. profile.tsx)
  // can read it back after a refresh.
  if (user) {
    AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user)).catch(() => {});
    AsyncStorage.setItem(STORAGE_USER_ID_KEY, String(user.user_id)).catch(() => {});
  } else {
    AsyncStorage.removeItem(STORAGE_USER_KEY).catch(() => {});
    AsyncStorage.removeItem(STORAGE_USER_ID_KEY).catch(() => {});
  }
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

// Restore user from AsyncStorage on app start. Call this once from the
// root layout — _layout.tsx — before rendering anything that depends on
// the logged-in state.
export async function hydrateAuth(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.user_id) {
      currentUser = parsed;
      listeners.forEach((fn) => fn(parsed));
    }
  } catch {
    // ignore corrupt storage
  }
}
