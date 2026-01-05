import { create } from 'zustand';
import { User } from '../types';
import { supabase } from './supabase';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => void;
  loadUser: () => void;
}

const resolveRole = (roles: Array<{ role: string }> | null) => {
  if (roles?.some((item) => item.role === 'admin')) {
    return 'admin' as const;
  }
  return 'student' as const;
};

const fetchProfileAndRole = async (userId: string, email: string, fallbackName?: string, createdAt?: string) => {
  const { data: profile } = await supabase
    .from('usuarios')
    .select('nome_completo')
    .eq('id', userId)
    .maybeSingle();

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  return {
    id: userId,
    email,
    name: profile?.nome_completo || fallbackName || email,
    role: resolveRole(roles ?? null),
    created_at: createdAt || new Date().toISOString(),
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session?.user) {
      throw new Error(error?.message || 'Falha ao autenticar.');
    }

    const session = data.session;
    const user = await fetchProfileAndRole(
      session.user.id,
      session.user.email || email,
      session.user.user_metadata?.nome_completo,
      session.user.created_at
    );

    localStorage.setItem('token', session.access_token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token: session.access_token, isAuthenticated: true });
  },

  register: async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome_completo: name },
      },
    });

    if (error) {
      throw new Error(error.message || 'Falha ao cadastrar.');
    }

    if (data.session?.user) {
      const session = data.session;
      const user = await fetchProfileAndRole(
        session.user.id,
        session.user.email || email,
        name,
        session.user.created_at
      );
      localStorage.setItem('token', session.access_token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token: session.access_token, isAuthenticated: true });
      return { needsEmailConfirmation: false };
    }

    return { needsEmailConfirmation: true };
  },

  logout: () => {
    supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: () => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) {
        set({ user: null, token: null, isAuthenticated: false });
        return;
      }

      const session = data.session;
      const user = await fetchProfileAndRole(
        session.user.id,
        session.user.email || '',
        session.user.user_metadata?.nome_completo,
        session.user.created_at
      );

      localStorage.setItem('token', session.access_token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token: session.access_token, isAuthenticated: true });
    });
  },
}));
