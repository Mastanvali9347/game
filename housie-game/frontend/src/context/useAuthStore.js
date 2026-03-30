import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  updateCoins: (coins) =>
    set((state) => {
      const newUser = {
        ...state.user,
        coins
      };

      if (newUser.is_guest) {
        localStorage.setItem('housie_guest_user', JSON.stringify(newUser));
      } else {
        localStorage.setItem('housie_custom_user', JSON.stringify(newUser));
      }

      return { user: newUser };
    }),

  updateProfile: async (newName) => {
    const state = useAuthStore.getState();
    if (!state.user?.id) return;

    try {
      const res = await api.post('/api/auth/update-profile', {
        user_id: state.user.id,
        new_name: newName
      });

      if (res.data) {
        const updated = {
          ...state.user,
          name: res.data.name
        };

        if (updated.is_guest) {
          localStorage.setItem('housie_guest_user', JSON.stringify(updated));
        } else {
          localStorage.setItem('housie_custom_user', JSON.stringify(updated));
        }

        set({ user: updated });
        return updated;
      }
    } catch (err) {
      console.error("Profile update failed", err);
      throw err;
    }
  },
  refreshUser: async () => {
    const state = useAuthStore.getState();
    if (!state.user?.id) return;

    try {
      const res = await api.get(`/api/auth/me?user_id=${state.user.id}`);
      if (res.data && res.data.id) {
        const updated = {
          ...state.user,
          ...res.data,
          name: res.data.name || res.data.username || state.user.name,
          coins: res.data.coins ?? state.user.coins
        };
        
        if (updated.is_guest) {
          localStorage.setItem('housie_guest_user', JSON.stringify(updated));
        }
        
        set({ user: updated });
      }
    } catch (err) {
      console.error("User refresh failed", err);
    }
  },

  guestLogin: async (username) => {
    set({ loading: true, error: null });

    try {
      const res = await api.post('/api/auth/guest', { username });
      const userData = res.data;

      const normalizedUser = {
        id: userData.id,
        name: userData.name || userData.username,
        coins: userData.coins ?? 1000,
        is_guest: true
      };

      localStorage.setItem('housie_guest_user', JSON.stringify(normalizedUser));

      set({ user: normalizedUser, loading: false });
      return normalizedUser;

    } catch (err) {
      const msg = err?.response?.data?.detail || 'Guest login failed';
      set({ error: msg, loading: false });
      return null;
    }
  },

  signIn: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/api/auth/login', { username, password });
      
      const user = {
        id: res.data.id,
        name: res.data.name,
        coins: res.data.coins,
        is_guest: res.data.is_guest
      };
      
      localStorage.setItem('housie_custom_user', JSON.stringify(user));
      set({ user, loading: false });
      return user;
    } catch (err) {
      set({ error: err?.response?.data?.detail || 'Login failed Check your connection.', loading: false });
      return null;
    }
  },

  signUp: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const virtualEmail = `${username.toLowerCase().trim()}@game.com`;

      const { data, error } = await supabase.auth.signUp({
        email: virtualEmail,
        password,
        options: {
          data: { 
            username: username,
            full_name: username 
          }
        }
      });
      if (error) throw error;
      
      const user = {
        id: data.user.id,
        name: username,
        coins: 1000,
        is_guest: false
      };

      set({ user, loading: false });
      return user;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch {}

    localStorage.removeItem('housie_guest_user');
    localStorage.removeItem('housie_custom_user');
    set({ user: null, loading: false });
  },

  initAuth: async () => {
    set({ loading: true });

    try {
      const customUser = localStorage.getItem('housie_custom_user');
      if (customUser) {
        try {
          const parsed = JSON.parse(customUser);
          set({ user: parsed, loading: false });
          return;
        } catch {
          localStorage.removeItem('housie_custom_user');
        }
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email,
            coins: 1000,
            is_guest: false
          },
          loading: false
        });
        return;
      }

      const savedGuest = localStorage.getItem('housie_guest_user');

      if (savedGuest) {
        try {
          const parsed = JSON.parse(savedGuest);
          set({ user: parsed, loading: false });
          return;
        } catch {
          localStorage.removeItem('housie_guest_user');
        }
      }

      set({ user: null, loading: false });

    } catch (err) {
      set({ error: 'Auth init failed', loading: false });
    }
  },
}));

export default useAuthStore;