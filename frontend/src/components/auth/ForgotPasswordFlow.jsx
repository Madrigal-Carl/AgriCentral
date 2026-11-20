import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

import { forgotPasswordSchema, resetPasswordSchema } from "@/schemas/auth.schema";
import { useForgotPassword, useVerifyResetOtp, useResetPassword } from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { OtpInput } from "./OtpInput";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  linkButtonClass,
  noticeClass,
  successClass,
  eyebrowClass,
  titleClass,
  descriptionClass,
} from "./authStyles";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const emptyOtp = () => Array(OTP_LENGTH).fill("");

const STEPS = {
  email: {
    number: 1,
    title: "Forgot your password?",
    description: "Enter your account email and we'll send you a 6-digit code.",
  },
  otp: {
    number: 2,
    title: "Enter your code",
    description: "Type the 6-digit code from the email we sent you.",
  },
  password: {
    number: 3,
    title: "Set a new password",
    description: "Choose a new password for your account.",
  },
};

function PasswordField({ id, label, error, registration, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          {...registration}
          className={`w-full pr-10 ${inputClass}`}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-[#6b7a73] transition-colors hover:text-[#00A36C]"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}

// Email -> OTP -> new password, rendered inside the auth card.
export function ForgotPasswordFlow({ initialEmail = "", onCancel, onComplete }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(emptyOtp);
  const [otpKey, setOtpKey] = useState(0);
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const forgot = useForgotPassword();
  const verify = useVerifyResetOtp();
  const reset = useResetPassword();

  const emailForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: initialEmail },
  });
  const passwordForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Counts the resend cooldown down once a second while it is running.
  const cooldownActive = secondsLeft > 0;
  useEffect(() => {
    if (!cooldownActive) return undefined;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldownActive]);

  const startCooldown = () => setSecondsLeft(RESEND_COOLDOWN_SECONDS);

  const clearOtp = () => {
    setOtp(emptyOtp());
    setOtpKey((k) => k + 1); // remount so the first box regains focus
  };

  const goTo = (nextStep) => {
    setError(null);
    setNotice(null);
    setStep(nextStep);
  };

  async function submitEmail(values) {
    setError(null);
    try {
      const response = await forgot.mutateAsync({ email: values.email });
      setEmail(values.email);
      clearOtp();
      goTo("otp");
      setNotice(response.message);
      startCooldown();
    } catch (err) {
      setError(getErrorMessage(err, "Could not send a code. Please try again."));
    }
  }

  async function resend() {
    if (secondsLeft > 0 || forgot.isPending) return;
    setError(null);
    try {
      const response = await forgot.mutateAsync({ email });
      clearOtp();
      setNotice(response.message);
      startCooldown();
    } catch (err) {
      setError(getErrorMessage(err, "Could not resend the code. Please try again."));
    }
  }

  async function submitOtp(event) {
    event.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Enter the 6-digit code.");
      return;
    }
    setError(null);
    try {
      const response = await verify.mutateAsync({ email, otp: code });
      setResetToken(response.resetToken);
      passwordForm.reset();
      goTo("password");
    } catch (err) {
      clearOtp();
      setError(getErrorMessage(err, "This code is invalid or has expired."));
    }
  }

  async function submitPassword(values) {
    setError(null);
    try {
      const response = await reset.mutateAsync({
        email,
        resetToken,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      onComplete?.(response.message);
    } catch (err) {
      setError(getErrorMessage(err, "Could not reset your password. Please try again."));
    }
  }

  function back() {
    if (step === "email") {
      onCancel?.();
    } else if (step === "otp") {
      goTo("email");
    } else {
      // The verified code is single-use, so a new one is needed from here.
      setResetToken("");
      clearOtp();
      goTo("otp");
      setNotice("That code has already been used. Resend to get a new code.");
    }
  }

  const meta = STEPS[step];
  const busy = forgot.isPending || verify.isPending || reset.isPending;

  return (
    <>
      <div className={eyebrowClass}>
        <span className="h-[3px] w-6 rounded-full bg-[#E0A526]" />
        Password Reset · Step {meta.number} of 3
      </div>
      <h1 className={titleClass}>{meta.title}</h1>
      <p className={descriptionClass}>{meta.description}</p>

      {step === "email" && (
        <form
          onSubmit={emailForm.handleSubmit(submitEmail)}
          className="mt-6 flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-email" className={labelClass}>
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              autoFocus
              {...emailForm.register("email")}
              className={inputClass}
              placeholder="you@organization.org"
            />
            {emailForm.formState.errors.email && (
              <p className="text-[12px] text-red-600">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          {error && <div role="alert" className={noticeClass}>{error}</div>}

          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {forgot.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Send code
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={submitOtp} className="mt-6 flex flex-col gap-4" noValidate>
          {notice && <div role="status" className={successClass}>{notice}</div>}

          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Verification code</span>
            <OtpInput
              key={otpKey}
              value={otp}
              onChange={(next) => {
                setOtp(next);
                if (error) setError(null);
              }}
              disabled={verify.isPending}
              invalid={Boolean(error)}
              autoFocus
            />
            <p className="text-[12px] text-[#4c5a54]">
              Sent to <span className="font-medium text-[#0F3D2E]">{email}</span>. The code
              expires in 10 minutes.
            </p>
          </div>

          {error && <div role="alert" className={noticeClass}>{error}</div>}

          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {verify.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Verify code
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>

          <p className="text-center text-[13px] text-[#4c5a54]" aria-live="polite">
            Didn't get it?{" "}
            <button
              type="button"
              onClick={resend}
              disabled={secondsLeft > 0 || busy}
              className={linkButtonClass}
            >
              {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
            </button>
          </p>
        </form>
      )}

      {step === "password" && (
        <form
          onSubmit={passwordForm.handleSubmit(submitPassword)}
          className="mt-6 flex flex-col gap-4"
          noValidate
        >
          <PasswordField
            id="new-password"
            label="New Password"
            autoComplete="new-password"
            registration={passwordForm.register("password")}
            error={passwordForm.formState.errors.password?.message}
          />
          <PasswordField
            id="confirm-password"
            label="Confirm Password"
            autoComplete="new-password"
            registration={passwordForm.register("confirmPassword")}
            error={passwordForm.formState.errors.confirmPassword?.message}
          />

          {error && <div role="alert" className={noticeClass}>{error}</div>}

          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {reset.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Reset password
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 border-t border-[#d9e8de] pt-5 text-center text-[13px] text-[#4c5a54]">
        <button
          type="button"
          onClick={back}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 ${linkButtonClass}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {step === "email" ? "Back to sign in" : "Back"}
        </button>
      </div>
    </>
  );
}
