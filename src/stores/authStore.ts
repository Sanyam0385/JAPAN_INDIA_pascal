// Auth store using Zustand
import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { authService } from '../lib/auth/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;

  signIn: (email: string, password: string) => Promise<void>;
  signInWithRole: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setDemoMode: (enabled: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isDemoMode: true,

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.signIn(email, password);
      set({ user: session.user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  signInWithRole: async (role) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.signInWithRole(role);
      set({ user: session.user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  setDemoMode: (enabled) => set({ isDemoMode: enabled }),
}));
