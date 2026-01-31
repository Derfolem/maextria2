import { create } from 'zustand';
import { User } from '../types';
import { getRememberMeDefault, setRememberMe, supabase } from './supabase';
import api from './api'; // Import the custom API client
import toast from 'react-hot-toast'; // Import toast for local auth register feedback

// Determine if local auth should be used
const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, cpf: string) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

const resolveRole = (roles: Array<{ role: string }> | null) => {
  if (roles?.some((item) => item.role === 'admin')) {
    return 'admin' as const;
  }
  if (roles?.some((item) => item.role === 'teacher')) {
    return 'teacher' as const;
  }
  return 'student' as const;
};

const isProfileComplete = (profile: { cpf?: string | null; phone?: string | null; address?: string | null }) =>
  Boolean(profile.cpf?.trim()) && Boolean(profile.phone?.trim()) && Boolean(profile.address?.trim());

const toSafeStoredUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  is_admin: user.is_admin,
  created_at: user.created_at,
  profile_completed: user.profile_completed ?? false,
});

// Simplified fetchProfileAndRole for local auth
const fetchProfileAndRoleLocal = (user: {
  id: string | number,
  email: string,
  name: string,
  role: string,
  cpf?: string,
  phone?: string,
  address?: string,
  created_at?: string,
}): User => {
  const createdAt = user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString();
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'student' | 'teacher' | 'admin',
    cpf: user.cpf,
    phone: user.phone,
    address: user.address,
    profile_completed: isProfileComplete({ cpf: user.cpf, phone: user.phone, address: user.address }),
    created_at: createdAt,
    is_admin: user.role === 'admin', // Add is_admin property
  };
};

const fetchProfileAndRoleSupabase = async (userId: string, email: string, fallbackName?: string, createdAt?: string) => {
  const { data: profile } = await supabase
    .from('usuarios')
    .select('nome_completo, cpf, telefone, endereco')
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
    cpf: profile?.cpf || undefined,
    phone: profile?.telefone || undefined,
    address: profile?.endereco || undefined,
    profile_completed: isProfileComplete({
      cpf: profile?.cpf || undefined,
      phone: profile?.telefone || undefined,
      address: profile?.endereco || undefined,
    }),
    role: resolveRole(roles ?? null),
    created_at: createdAt || new Date().toISOString(),
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string, rememberMe = getRememberMeDefault()) => {
    setRememberMe(rememberMe); // This manages storage preference for Supabase, keep for now
    const storage = rememberMe ? window.localStorage : window.sessionStorage;

    if (USE_LOCAL_AUTH) {
      try {
        const response = await api.post('/auth/login', { email, password });
        const { token, user: userData } = response.data;

        if (!token || !userData) {
          throw new Error('Falha ao autenticar com o backend local: dados incompletos.');
        }

        const user = fetchProfileAndRoleLocal(userData); // Use local helper
        storage.setItem('token', token);
        storage.setItem('user', JSON.stringify(toSafeStoredUser(user)));
        set({ user, token, isAuthenticated: true, isLoading: false });
        return;
      } catch (error: any) {
        console.error('Local Auth Login Error:', error);
        throw new Error(error.response?.data?.error || error.message || 'Falha ao autenticar com o backend local.');
      }
    } else {
      // Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session?.user) {
        throw new Error(error?.message || 'Falha ao autenticar com Supabase.');
      }

      const session = data.session;
      const user = await fetchProfileAndRoleSupabase(
        session.user.id,
        session.user.email || email,
        session.user.user_metadata?.nome_completo,
        session.user.created_at
      );

      storage.setItem('token', session.access_token);
      storage.setItem('user', JSON.stringify(toSafeStoredUser(user)));
      set({ user, token: session.access_token, isAuthenticated: true, isLoading: false });
    }
  },

  register: async (name: string, email: string, password: string, cpf: string) => {
    if (USE_LOCAL_AUTH) {
      try {
        const response = await api.post('/auth/register', { name, email, password, cpf });
        if (response.status === 201) {
          toast.success('Usuário registrado com sucesso no backend local. Por favor, faça login.');
          return { needsEmailConfirmation: false }; // Assuming no email confirmation needed for local dev
        }
        throw new Error('Falha ao registrar com o backend local.');
      } catch (error: any) {
        console.error('Local Auth Register Error:', error);
        throw new Error(error.response?.data?.error || error.message || 'Falha ao registrar com o backend local.');
      }
    } else {
      // Supabase Register
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome_completo: name, cpf },
        },
      });

      if (error) {
        throw new Error(error.message || 'Falha ao cadastrar com Supabase.');
      }

      if (data.session?.user) {
        const session = data.session;
        const user = await fetchProfileAndRoleSupabase(
          session.user.id,
          session.user.email || email,
          name,
          session.user.created_at
        );
        window.localStorage.setItem('token', session.access_token);
        window.localStorage.setItem('user', JSON.stringify(toSafeStoredUser(user)));
        set({ user, token: session.access_token, isAuthenticated: true, isLoading: false });
        return { needsEmailConfirmation: false };
      }

      set({ isLoading: false });
      return { needsEmailConfirmation: true };
    }
  },

  logout: () => {
    if (USE_LOCAL_AUTH) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      window.sessionStorage.removeItem('token');
      window.sessionStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    } else {
      supabase.auth.signOut();
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      window.sessionStorage.removeItem('token');
      window.sessionStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  loadUser: async () => {
    set({ isLoading: true }); // Ensure loading state is true when trying to load user

    if (USE_LOCAL_AUTH) {
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (storedToken) {
        try {
          const response = await api.get('/users/me');
          const user = fetchProfileAndRoleLocal(response.data);
          const rememberMe = getRememberMeDefault();
          const storage = rememberMe ? window.localStorage : window.sessionStorage;
          storage.setItem('user', JSON.stringify(toSafeStoredUser(user)));
          set({ user, token: storedToken, isAuthenticated: true, isLoading: false });
          return;
        } catch (error) {
          console.error('Local Auth load profile error:', error);
        }
      }

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          set({ user, token: storedToken, isAuthenticated: true, isLoading: false });
          return;
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    } else {
      // Supabase loadUser
      supabase.auth.getSession().then(async ({ data }) => {
        if (!data.session?.user) {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          return;
        }

        const session = data.session;
        const user = await fetchProfileAndRoleSupabase(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.nome_completo,
          session.user.created_at
        );

        const rememberMe = getRememberMeDefault();
        const storage = rememberMe ? window.localStorage : window.sessionStorage;
        storage.setItem('token', session.access_token);
        storage.setItem('user', JSON.stringify(toSafeStoredUser(user)));
        set({ user, token: session.access_token, isAuthenticated: true, isLoading: false });
      }).catch((e) => {
        console.error('Supabase getSession error:', e);
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      });
    }
  },
}));
