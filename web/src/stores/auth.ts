import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminUser {
  email: string;
  nama: string;
}

interface AuthStore {
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, nama?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email, nama = "Admin") =>
        set({ user: { email, nama }, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "peta-tani-auth" }
  )
);
