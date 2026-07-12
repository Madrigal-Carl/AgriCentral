import { create } from "zustand";

import {
  loginUser,
  registerUser,
  logoutUser,
  getMe,
} from "@/services/auth.service";
import { queryClient } from "@/utils/queryClient";

const useAuthStore = create((set, get) => ({
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
    queryClient.clear();
  },

  getInitial: () => {
    const user = get().user;
    if (!user) return "";

    const name = user.fullname?.trim();
    if (name) return name.charAt(0).toUpperCase();

    const email = user.email?.trim();
    return email ? email.charAt(0).toUpperCase() : "";
  },
}));

export default useAuthStore;