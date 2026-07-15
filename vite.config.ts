import { create } from 'zustand';
import type { UserProfile } from '../../types/user';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  // True until the app has finished checking localStorage for an existing
  // session on first load — ProtectedRoute waits on this instead of
  // flashing a redirect-to-login before the check completes.
  isInitializing: boolean;
  isAuthenticated: boolean;
  setSession: (user: UserProfile, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: UserProfile) => void;
  finishInitializing: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitializing: true,
  isAuthenticated: false,

  setSession: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  setAccessToken: (accessToken) => set({ accessToken, isAuthenticated: true }),
  setUser: (user) => set({ user }),
  finishInitializing: () => set({ isInitializing: false }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));
