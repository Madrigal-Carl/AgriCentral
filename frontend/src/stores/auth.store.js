import { create } from "zustand";

import {
  loginUser,
  registerUser,
  logoutUser,
  getMe,
} from "@/services/auth.service";

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  fetchCurrentUser: async () => {
    try {
      const response = await getMe();
      set({ user: response.user });
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },

  login: async (credentials) => {
    const response = await loginUser(credentials);
    set({ user: response.user });
    return response;
  },

  register: async (userData) => {
    const response = await registerUser(userData);
    return response;
  },

  logout: async () => {
    await logoutUser();
    set({ user: null });
  },
}));

export default useAuthStore;