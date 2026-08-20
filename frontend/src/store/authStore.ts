import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'farmer' | 'company' | 'admin';
  is_premium: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      
      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setToken: (token) => {
        localStorage.setItem('access_token', token);
        set({ token });
      },
      
      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, isAuthenticated: false, token: null });
      },
      
      initialize: () => {
        const token = localStorage.getItem('access_token');
        if (token) {
          set({ token, isAuthenticated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);