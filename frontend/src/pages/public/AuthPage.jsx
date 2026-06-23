import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Leaf, ArrowRight, Loader2 } from "lucide-react";

import barnAsset from "@/assets/images/barn.jpg";

export default function AuthPage() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setInfo(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setInfo(
        mode === "signup"
          ? "Account creation requires backend setup. Enable Lovable Cloud to continue."
          : "Sign-in requires backend setup. Enable Lovable Cloud to continue.",
      );
    }, 600);
  }

  return (
    <main className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#FAFAF8] py-16 px-5">
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
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-6">
          <div className="grid h-8 w-8 place-items-center bg-black rounded-[3px]">
            <Leaf className="h-4 w-4 text-[#00A36C]" strokeWidth={2.5} />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-white">
            AgriCentral
          </span>
        </Link>

        <div className="rounded-[6px] border border-zinc-200 bg-white p-7 shadow-xl">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-[#6F7478] uppercase">
            <span className="text-[#0F1112]">[</span>
            {mode === "signin" ? "ACCOUNT ACCESS" : "CREATE ACCOUNT"}
            <span className="text-[#0F1112]">]</span>
          </div>
          <h1 className="mt-3 text-[1.5rem] leading-[1.15] tracking-[-0.02em] font-medium text-[#0F1112]">
            {mode === "signin"
              ? "Sign in to AgriCentral"
              : "Create your account"}
          </h1>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-[#6F7478]">
            {mode === "signin"
              ? "Access your operational dashboard and field data."
              : "Get started managing farms, livestock, and resources."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="font-mono text-[10.5px] tracking-[0.16em] text-[#6F7478] uppercase"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-[5px] border border-zinc-300 bg-white px-3 py-2.5 text-[14px] text-[#0F1112] outline-none focus:border-[#0F1112] transition-colors"
                placeholder="you@organization.org"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="font-mono text-[10.5px] tracking-[0.16em] text-[#6F7478] uppercase"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-[5px] border border-zinc-300 bg-white px-3 py-2.5 text-[14px] text-[#0F1112] outline-none focus:border-[#0F1112] transition-colors"
                placeholder="••••••••"
              />
            </div>

            {info && (
              <div className="rounded-[5px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-[5px] bg-[#0F1112] px-3.5 py-2.5 text-[13.5px] font-medium text-white hover:bg-black transition-colors disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-200 text-center text-[13px] text-[#6F7478]">
            {mode === "signin" ? (
              <>
                New to AgriCentral?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setInfo(null);
                  }}
                  className="text-[#0F1112] font-medium hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setInfo(null);
                  }}
                  className="text-[#0F1112] font-medium hover:underline"
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
