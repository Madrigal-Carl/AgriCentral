import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

import logoAsset from "@/assets/logo.png";
import farmAsset from "@/assets/images/farm.jpg";
import { registerSchema, loginSchema } from "@/schemas/auth.schema";
import useAuth from "@/hooks/useAuth";

/* Palette: brand #00A36C · forest #0F3D2E · harvest gold #E0A526 · mint #F1F8F3 */

function FieldLines({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 200"
      fill="none"
      className={className}
    >
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path
          key={i}
          d={`M-20 ${190 - i * 24} C 100 ${150 - i * 24}, 260 ${230 - i * 24}, 420 ${150 - i * 24}`}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

function WheatStalk({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 160"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
    >
      <path d="M30 158V30" />
      {[34, 52, 70, 88].map((y) => (
        <g key={y}>
          <path
            d={`M30 ${y} C 18 ${y - 4}, 12 ${y - 14}, 14 ${y - 22} C 24 ${y - 18}, 30 ${y - 10}, 30 ${y}`}
          />
          <path
            d={`M30 ${y} C 42 ${y - 4}, 48 ${y - 14}, 46 ${y - 22} C 36 ${y - 18}, 30 ${y - 10}, 30 ${y}`}
          />
        </g>
      ))}
      <path d="M30 30 C 24 22, 24 12, 30 4 C 36 12, 36 22, 30 30Z" />
    </svg>
  );
}

const inputClass =
  "rounded-[5px] border border-[#cfe0d5] bg-white px-3 py-2.5 text-[14px] text-[#0F3D2E] outline-none transition-colors placeholder:text-[#8a9a92] focus:border-[#00A36C] focus:ring-2 focus:ring-[#00A36C]/20";
const labelClass =
  "font-mono text-[10.5px] tracking-[0.16em] text-[#4c5a54] uppercase";

export function AuthPage() {
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
    resolver: zodResolver(mode === "signup" ? registerSchema : loginSchema),
    defaultValues: { fullname: "", email: "", password: "" },
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
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#0F3D2E] px-5 py-16">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${farmAsset})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F3D2E]/80 via-[#0F3D2E]/65 to-[#0a2a20]/90" />
      <FieldLines className="pointer-events-none absolute inset-x-0 bottom-0 h-56 w-full text-white/10" />
      <WheatStalk className="pointer-events-none absolute -left-2 bottom-0 hidden h-64 text-[#E0A526]/25 lg:block" />
      <WheatStalk className="pointer-events-none absolute -right-2 bottom-0 hidden h-64 text-[#E0A526]/25 lg:block" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-6 flex flex-col items-center gap-2">
          <Link
            to="/"
            className="grid h-12 w-12 place-items-center rounded-lg bg-white/85 backdrop-blur-md sm:h-14 sm:w-14"
          >
            <img
              src={logoAsset}
              alt="AgriCentral"
              className="h-8 w-8 object-contain sm:h-10 sm:w-10"
            />
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#F3CC6B]">
            AgriCentral · PAgriO Platform
          </span>
        </div>

        <div className="rounded-xl bg-white p-7 shadow-xl">
          <div className="inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#4c5a54]">
            <span className="h-[3px] w-6 rounded-full bg-[#E0A526]" />
            {mode === "signin" ? "Account Access" : "Create Account"}
          </div>
          <h1 className="mt-3 text-[1.5rem] font-medium leading-[1.15] tracking-[-0.02em] text-[#0F3D2E]">
            {mode === "signin"
              ? "Sign in to AgriCentral"
              : "Create your account"}
          </h1>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-[#3F4B46]">
            {mode === "signin"
              ? "Access your operational dashboard and field data."
              : "Get started managing farms, livestock, and resources."}
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 flex flex-col gap-4"
          >
            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullname" className={labelClass}>
                  Full Name
                </label>
                <input
                  id="fullname"
                  type="text"
                  autoComplete="name"
                  {...register("fullname")}
                  className={inputClass}
                  placeholder="Juan Dela Cruz"
                />
                {errors.fullname && (
                  <p className="text-[12px] text-red-600">
                    {errors.fullname.message}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className={inputClass}
                placeholder="you@organization.org"
              />
              {errors.email && (
                <p className="text-[12px] text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className={labelClass}>
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
                  className={`w-full pr-10 ${inputClass}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#6b7a73] transition-colors hover:text-[#00A36C]"
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
              <div className="rounded-[5px] border border-[#ecd9a8] bg-[#FBF6E8] px-3 py-2 text-[12.5px] text-[#7a5600]">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-[5px] bg-[#00A36C] px-3.5 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-[#008a5b] disabled:opacity-60"
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

          <div className="mt-6 border-t border-[#d9e8de] pt-5 text-center text-[13px] text-[#4c5a54]">
            {mode === "signin" ? (
              <>
                New to AgriCentral?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-medium text-[#00A36C] hover:underline"
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
                  className="font-medium text-[#00A36C] hover:underline"
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
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-[#5be0ac]"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
