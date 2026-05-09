import { create } from "zustand";

interface AdminUser {
  uid: string;
  email: string;
  nama: string;
}

interface AuthStore {
  user: AdminUser | null;
  isAuthenticated: boolean;
  setUser: (user: AdminUser | null) => void;
  logout: () => void;
}

// No persist middleware — Firebase Auth persists the session natively
// via IndexedDB. We only store display data for the UI here.
export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: user !== null }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
