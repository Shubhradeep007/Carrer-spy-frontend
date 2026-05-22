import { create } from "zustand";
import api from "@/lib/api";
import Cookies from "js-cookie";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/auth/login", credentials);
      Cookies.set("token", data.token, { expires: 7 });
      localStorage.setItem("token", data.token);
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (userData) => {
    set({ isLoading: true });
    try {
      await api.post("/auth/signup", userData);
      set({ isLoading: false });
      // Usually signup requires email verification, so we don't log them in automatically.
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    Cookies.remove("token");
    localStorage.removeItem("token");
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = Cookies.get("token") || localStorage.getItem("token");
    if (!token) return;
    
    set({ isLoading: true });
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      Cookies.remove("token");
      localStorage.removeItem("token");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
