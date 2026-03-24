import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  login: (userId: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  login: (userId, password) => {
    const trimmedUserId = (userId || '').trim();
    const trimmedPassword = (password || '').trim();
    if (trimmedUserId === 'admin' && trimmedPassword === 'admin123') {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ isAuthenticated: false }),
}));
