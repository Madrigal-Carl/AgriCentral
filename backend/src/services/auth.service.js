import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";
import emailQueue from "../queues/email.queue.js";
import { EMAIL_JOBS } from "../queues/email.jobs.js";
import { valkeyConnection } from "../config/valkey.js";
import {
  OTP_TTL_SECONDS,
  RESET_TOKEN_TTL_SECONDS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_MAX_ATTEMPTS,
  normalizeEmail,
  passwordResetKeys,
  generateOtp,
  hashOtp,
  generateResetToken,
  hashResetToken,
  safeEqualHex,
  sealOtp,
} from "../utils/passwordReset.js";

import {
  generateAccessToken,
  generateRefreshToken,
  generateVerifyToken,
} from "../utils/generateToken.js";

export const registerUser = async ({ fullname, email, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    fullname,
    email,
    password: hashedPassword,
    isVerified: false,
  });

  const verifyToken = generateVerifyToken(user._id);

  return user;
};

const SALT_ROUNDS = 12;

export const loginUser = async ({ email, password, rememberMe = false }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user || !user.password) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  if (!user.isVerified) {
    throw new Error("Please verify your account first");
  }

  if (user.role === "far") {
    const association = await Association.findOne({
      user: user._id,
      deletedAt: null,
    });

    if (!association) {
      throw new Error("No association assigned to this account. Please contact your admin.");
    }
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id, { rememberMe });

  return {
    user,
    accessToken,
    refreshToken,
    rememberMe,
  };
};

export const logoutUser = async () => {
  return true;
};

/* ---------------- Forgot password (OTP) ---------------- */

export const PASSWORD_RESET_REQUEST_MESSAGE =
  "If an account exists for that email, a 6-digit code has been sent. It expires in 10 minutes.";

const resetError = (message, field) => {
  const error = new Error(message);
  error.statusCode = 400;
  if (field) error.field = field;
  return error;
};

// Rate limits apply to every email (registered or not) so behavior never
// reveals whether an account exists. Returns true when a send is allowed.
const consumeOtpSendAllowance = async (keys) => {
  const cooldownSet = await valkeyConnection.set(keys.cooldown, "1", "EX", OTP_RESEND_COOLDOWN_SECONDS, "NX");
  if (!cooldownSet) return false;

  const [[, sends]] = await valkeyConnection
    .multi()
    .incr(keys.sends)
    .expire(keys.sends, 60 * 60, "NX")
    .exec();
  return sends <= OTP_MAX_SENDS_PER_HOUR;
};

const issuePasswordResetOtp = async (email) => {
  const keys = passwordResetKeys(email);
  if (!(await consumeOtpSendAllowance(keys))) return;

  const user = await User.findOne({ email }).select("fullname email");
  if (!user) return;

  const otp = generateOtp();
  await valkeyConnection
    .multi()
    .del(keys.otp)
    .hset(keys.otp, "hash", hashOtp(email, otp), "attempts", 0)
    .expire(keys.otp, OTP_TTL_SECONDS)
    .exec();

  await emailQueue.add(
    EMAIL_JOBS.PASSWORD_RESET_OTP,
    {
      type: EMAIL_JOBS.PASSWORD_RESET_OTP,
      data: {
        to: user.email,
        name: user.fullname,
        sealedOtp: sealOtp(otp),
        expiresInMinutes: OTP_TTL_SECONDS / 60,
      },
    },
    { removeOnComplete: true, removeOnFail: true },
  );
};

// Responds identically for every email: the lookup, rate limiting and
// enqueueing run after the response so timing does not leak existence.
export const requestPasswordReset = async ({ email }) => {
  const normalized = normalizeEmail(email);
  issuePasswordResetOtp(normalized).catch((error) => {
    console.error("Password reset request failed:", error?.message ?? error);
  });
  return { message: PASSWORD_RESET_REQUEST_MESSAGE };
};

// Atomically counts the attempt (only while the OTP exists, so an expired
// key is never recreated without a TTL) and returns [attempts, hash].
const CONSUME_OTP_ATTEMPT = `
if redis.call('EXISTS', KEYS[1]) == 0 then return nil end
local attempts = redis.call('HINCRBY', KEYS[1], 'attempts', 1)
return { attempts, redis.call('HGET', KEYS[1], 'hash') }
`;

export const verifyPasswordResetOtp = async ({ email, otp }) => {
  const normalized = normalizeEmail(email);
  const keys = passwordResetKeys(normalized);
  const result = await valkeyConnection.eval(CONSUME_OTP_ATTEMPT, 1, keys.otp);

  if (!result) throw resetError("This code is invalid or has expired. Request a new code.", "otp");

  const [attempts, storedHash] = result;
  if (attempts > OTP_MAX_ATTEMPTS) {
    await valkeyConnection.del(keys.otp);
    throw resetError("Too many incorrect attempts. Request a new code.", "otp");
  }

  if (!safeEqualHex(hashOtp(normalized, otp), storedHash)) {
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await valkeyConnection.del(keys.otp);
      throw resetError("Too many incorrect attempts. Request a new code.", "otp");
    }
    const left = OTP_MAX_ATTEMPTS - attempts;
    throw resetError(`Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`, "otp");
  }

  // DEL doubles as a single-use guard against concurrent verifications.
  if ((await valkeyConnection.del(keys.otp)) !== 1) {
    throw resetError("This code is invalid or has expired. Request a new code.", "otp");
  }

  const resetToken = generateResetToken();
  await valkeyConnection.set(keys.token, hashResetToken(normalized, resetToken), "EX", RESET_TOKEN_TTL_SECONDS);

  return { resetToken, expiresInSeconds: RESET_TOKEN_TTL_SECONDS };
};

export const resetPasswordWithToken = async ({ email, resetToken, password }) => {
  const normalized = normalizeEmail(email);
  const keys = passwordResetKeys(normalized);
  const expired = "Your reset session has expired. Please start again.";

  const storedHash = await valkeyConnection.get(keys.token);
  if (!storedHash || !safeEqualHex(hashResetToken(normalized, resetToken), storedHash)) {
    throw resetError(expired);
  }
  if ((await valkeyConnection.del(keys.token)) !== 1) throw resetError(expired);

  const user = await User.findOne({ email: normalized }).select("_id");
  if (!user) throw resetError(expired);

  await User.updateOne(
    { _id: user._id },
    { $set: { password: await bcrypt.hash(password, SALT_ROUNDS) } },
  );
  await valkeyConnection.del(keys.otp);

  // Refresh tokens are stateless JWTs (no server-side session store), so
  // there are no stored sessions to revoke here.
  return { message: "Password updated. You can now sign in with your new password." };
};
