import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

import logoAsset from "@/assets/logo.png";
import barnAsset from "@/assets/images/barn.jpg";
import { authSchema } from "@/schemas/auth.schema";
import useAuth from "@/hooks/useAuth";

export default function AuthPage() {
  const [mode, setMode] = useState("signin");
  const [info, setInfo] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  function switchMode(nextMode) {
    setMode(nextMode);
    setInfo(null);
    setShowPassword(false);
    reset();
  }

  async function onSubmit(values) {
    setInfo(null);
    try {
      if (mode === "signup") {
        await registerUser(values);
        setInfo("Account created. You can now sign in.");
        switchMode("signin");
      } else {
        await login(values);
      }
    } catch (err) {
      setInfo(
        err?.response?.data?.message ??
          (mode === "signup"
            ? "Could not create account. Please try again."
            : "Invalid email or password."),
      );
    }
  }

  return (
    <main className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-canvas py-16 px-5">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${barnAsset})` }}
      />
      <div className="absolute inset-0 bg-black/55" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex items-center justify-center mb-6">
          <Link
            to="/"
            className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center bg-white/75 backdrop-blur-md rounded-[3px]"
          >
            <img
              src={logoAsset}
              alt="AgriCentral"
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
            />
          </Link>
        </div>

        <div className="rounded-[6px] border border-zinc-200 bg-white p-7 shadow-xl">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-ink-muted uppercase">
            <span className="text-ink">[</span>
            {mode === "signin" ? "ACCOUNT ACCESS" : "CREATE ACCOUNT"}
            <span className="text-ink">]</span>
          </div>
          <h1 className="mt-3 text-[1.5rem] leading-[1.15] tracking-[-0.02em] font-medium text-ink">
            {mode === "signin"
              ? "Sign in to AgriCentral"
              : "Create your account"}
          </h1>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-muted">
            {mode === "signin"
              ? "Access your operational dashboard and field data."
              : "Get started managing farms, livestock, and resources."}
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="font-mono text-[10.5px] tracking-[0.16em] text-ink-muted uppercase"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="rounded-[5px] border border-zinc-300 bg-white px-3 py-2.5 text-[14px] text-ink outline-none focus:border-ink transition-colors"
                placeholder="you@organization.org"
              />
              {errors.email && (
                <p className="text-[12px] text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="font-mono text-[10.5px] tracking-[0.16em] text-ink-muted uppercase"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  {...register("password")}
                  className="w-full rounded-[5px] border border-zinc-300 bg-white px-3 py-2.5 pr-10 text-[14px] text-ink outline-none focus:border-ink transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-muted hover:text-ink transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[12px] text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {info && (
              <div className="rounded-[5px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-[5px] bg-ink px-3.5 py-2.5 text-[13.5px] font-medium text-white hover:bg-black transition-colors disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-200 text-center text-[13px] text-ink-muted">
            {mode === "signin" ? (
              <>
                New to AgriCentral?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-ink font-medium hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-ink font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            to="/"
            className="font-mono text-[11px] tracking-[0.16em] text-white/70 hover:text-white uppercase"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
