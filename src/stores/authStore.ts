// Auth store using Zustand with AsyncStorage persistence
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, UserRole, UserLocationCoords } from '../types';
import { authService, AuthError, SignUpData } from '../lib/auth/authService';

export type { SignUpData };

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;
  pendingVerificationEmail: string | null;
  pendingVerificationType: 'signup' | 'recovery' | null;

  signIn: (email: string, password: string) => Promise<{ success: boolean; unconfirmedEmail?: boolean; email?: string }>;
  signInWithRole: (role: UserRole) => Promise<void>;
  signUp: (data: SignUpData) => Promise<{ needsVerification: boolean; email: string }>;
  verifyOtp: (token: string) => Promise<User>;
  resendOtp: () => Promise<{ remainingSeconds: number; remainingResends: number }>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  setPendingVerification: (email: string | null, type?: 'signup' | 'recovery' | null) => void;
  clearPendingVerification: () => void;
  signOut: () => Promise<void>;
  updateUserLocation: (locationData: Partial<User>) => void;
  clearError: () => void;
  setDemoMode: (enabled: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isDemoMode: true,
      pendingVerificationEmail: null,
      pendingVerificationType: null,

      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const session = await authService.signIn(email, password);
          set({
            user: session.user,
            isAuthenticated: true,
            isLoading: false,
            isDemoMode: false,
            pendingVerificationEmail: null,
            pendingVerificationType: null,
          });
          return { success: true };
        } catch (e: any) {
          const isUnconfirmed = e?.unconfirmedEmail === true || e?.code === 'EMAIL_NOT_CONFIRMED';
          const emailToVerify = e?.email || email.trim().toLowerCase();

          if (isUnconfirmed) {
            set({
              pendingVerificationEmail: emailToVerify,
              pendingVerificationType: 'signup',
              error: e.message,
              isLoading: false,
            });
            return {
              success: false,
              unconfirmedEmail: true,
              email: emailToVerify,
            };
          }

          set({ error: e.message || 'Login failed', isLoading: false });
          return { success: false, unconfirmedEmail: false };
        }
      },

      signInWithRole: async (role) => {
        set({ isLoading: true, error: null });
        try {
          const session = await authService.signInWithRole(role);
          set({
            user: session.user,
            isAuthenticated: true,
            isLoading: false,
            isDemoMode: true,
            pendingVerificationEmail: null,
            pendingVerificationType: null,
          });
        } catch (e) {
          set({ error: (e as Error).message, isLoading: false });
        }
      },

      signUp: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.register(data);
          if (res.needsVerification) {
            set({
              pendingVerificationEmail: res.email,
              pendingVerificationType: 'signup',
              isLoading: false,
              error: null,
            });
            return { needsVerification: true, email: res.email };
          }

          if (res.session) {
            set({
              user: res.session.user,
              isAuthenticated: true,
              isLoading: false,
              isDemoMode: false,
              pendingVerificationEmail: null,
              pendingVerificationType: null,
            });
            return { needsVerification: false, email: res.email };
          }

          set({ isLoading: false });
          return { needsVerification: false, email: res.email };
        } catch (e: any) {
          set({ error: e.message || 'Registration failed', isLoading: false });
          throw e;
        }
      },

      verifyOtp: async (token: string) => {
        const email = get().pendingVerificationEmail;
        if (!email) {
          const err = new AuthError('No email pending verification.');
          set({ error: err.message });
          throw err;
        }
        const type = get().pendingVerificationType || 'signup';
        set({ isLoading: true, error: null });

        try {
          const session = await authService.verifyOtp({ email, token, type });
          set({
            user: session.user,
            isAuthenticated: true,
            isLoading: false,
            isDemoMode: false,
            pendingVerificationEmail: null,
            pendingVerificationType: null,
          });
          return session.user;
        } catch (e: any) {
          set({ error: e.message || 'Verification failed', isLoading: false });
          throw e;
        }
      },

      resendOtp: async () => {
        const email = get().pendingVerificationEmail;
        if (!email) {
          throw new AuthError('No email pending verification.');
        }
        const type = get().pendingVerificationType || 'signup';
        return await authService.resendOtp({ email, type });
      },

      resetPasswordForEmail: async (email: string) => {
        const normalized = email.trim().toLowerCase();
        set({ isLoading: true, error: null });
        try {
          await authService.resetPasswordForEmail(normalized);
          set({
            pendingVerificationEmail: normalized,
            pendingVerificationType: 'recovery',
            isLoading: false,
          });
        } catch (e: any) {
          set({ error: e.message || 'Password reset request failed', isLoading: false });
          throw e;
        }
      },

      updatePassword: async (password: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.updatePassword(password);
          set({ isLoading: false, pendingVerificationType: null, pendingVerificationEmail: null });
        } catch (e: any) {
          set({ error: e.message || 'Password update failed', isLoading: false });
          throw e;
        }
      },

      setPendingVerification: (email, type = 'signup') => {
        set({
          pendingVerificationEmail: email ? email.trim().toLowerCase() : null,
          pendingVerificationType: email ? (type || 'signup') : null,
        });
      },

      clearPendingVerification: () => {
        set({ pendingVerificationEmail: null, pendingVerificationType: null });
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await authService.signOut();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            pendingVerificationEmail: null,
            pendingVerificationType: null,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      updateUserLocation: (locationData) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const updatedUser: User = {
          ...currentUser,
          ...locationData,
          locationUpdatedAt: new Date().toISOString(),
        };
        set({ user: updatedUser });
      },

      clearError: () => set({ error: null }),
      setDemoMode: (enabled) => set({ isDemoMode: enabled }),
    }),
    {
      name: 'circulo-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isDemoMode: state.isDemoMode,
        pendingVerificationEmail: state.pendingVerificationEmail,
        pendingVerificationType: state.pendingVerificationType,
      }),
    }
  )
);
