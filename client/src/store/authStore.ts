import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Demo mode - fake user for viewing design
  user: { id: 1, email: 'demo@example.com', firstName: 'Demo', lastName: 'User' },
  token: 'demo-token',

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  isAuthenticated: () => {
    // Always return true for demo mode
    return true;
  },
}));
