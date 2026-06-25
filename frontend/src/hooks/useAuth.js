import { useEffect } from "react";
import useAuthStore from "@/stores/auth.store";

const useAuth = () => {
    const user = useAuthStore((state) => state.user);
    const loading = useAuthStore((state) => state.loading);
    const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
    const login = useAuthStore((state) => state.login);
    const register = useAuthStore((state) => state.register);
    const logout = useAuthStore((state) => state.logout);
    const getInitial = useAuthStore((state) => state.getInitial);

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    return {
        user,
        loading,
        isAuthenticated: !!user,
        role: user?.role ?? null,
        initial: getInitial(),
        login,
        register,
        logout,
    };
};

export default useAuth;