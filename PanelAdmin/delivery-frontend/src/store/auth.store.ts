import { create } from 'zustand';
import { clearAuthSession, getAuthToken, getStoredUser, setAuthToken, setStoredUser } from '../api';
import type { LoginResponse } from '../types';

export interface AuthState {
  token: string | null;
  user: LoginResponse | null;
  setSession: (data: LoginResponse) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getAuthToken(),
  user: getStoredUser(),
  setSession: (data) => {
    setAuthToken(data.token);
    setStoredUser(data);
    set({ token: data.token, user: data });
  },
  clearSession: () => {
    clearAuthSession();
    set({ token: null, user: null });
  },
}));
