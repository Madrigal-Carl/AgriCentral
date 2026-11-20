import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import useAuthStore from "@/stores/auth.store";
import {
    requestPasswordReset,
    verifyPasswordResetOtp,
    resetPassword,
} from "@/services/auth.service";

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

/* ---------------- Forgot password (OTP) ---------------- */
export function useForgotPassword(options = {}) {
    return useMutation({
        mutationFn: (data) => requestPasswordReset(data),
        onSuccess: options.onSuccess,
        onError: options.onError,
    });
}

export function useVerifyResetOtp(options = {}) {
    return useMutation({
        mutationFn: (data) => verifyPasswordResetOtp(data),
        onSuccess: options.onSuccess,
        onError: options.onError,
    });
}

export function useResetPassword(options = {}) {
    return useMutation({
        mutationFn: (data) => resetPassword(data),
        onSuccess: options.onSuccess,
        onError: options.onError,
    });
}
