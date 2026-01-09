import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const REMEMBER_ME_KEY = 'maextria_remember_me';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

const resolveRememberPreference = () => {
  if (typeof window === 'undefined') {
    return true;
  }
  const stored = window.localStorage.getItem(REMEMBER_ME_KEY);
  return stored === null ? true : stored === '1';
};

const resolveAuthStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return resolveRememberPreference() ? window.localStorage : window.sessionStorage;
};

const clearSupabaseSession = (storage: Storage) => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key) {
      continue;
    }
    if ((key.startsWith('sb-') && key.endsWith('-auth-token')) || key === 'supabase.auth.token') {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => storage.removeItem(key));
};

export const setRememberMe = (remember: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(REMEMBER_ME_KEY, remember ? '1' : '0');
  clearSupabaseSession(window.localStorage);
  clearSupabaseSession(window.sessionStorage);
};

export const getRememberMeDefault = () => resolveRememberPreference();

const authStorage = {
  getItem: (key: string) => resolveAuthStorage()?.getItem(key) ?? null,
  setItem: (key: string, value: string) => resolveAuthStorage()?.setItem(key, value),
  removeItem: (key: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
  },
});
