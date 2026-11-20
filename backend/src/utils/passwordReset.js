import crypto from "crypto";

export const OTP_TTL_SECONDS = 10 * 60;
export const RESET_TOKEN_TTL_SECONDS = 10 * 60;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_SENDS_PER_HOUR = 5;
export const OTP_MAX_ATTEMPTS = 5;

// Dedicated secret when configured; otherwise a key derived (domain-separated)
// from the refresh-token secret so the feature works without new config.
const secretKey = () => {
    if (process.env.PASSWORD_RESET_SECRET) return process.env.PASSWORD_RESET_SECRET;
    if (!process.env.JWT_REFRESH_SECRET) throw new Error("PASSWORD_RESET_SECRET is not configured");
    return crypto.createHmac("sha256", process.env.JWT_REFRESH_SECRET).update("agricentral:password-reset").digest();
};

const hmac = (purpose, value) =>
    crypto.createHmac("sha256", secretKey()).update(`${purpose}:${value}`).digest("hex");

export const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

// Keys are derived from an HMAC of the email so Valkey never holds addresses.
const keyId = (email) => hmac("email", normalizeEmail(email));
export const passwordResetKeys = (email) => {
    const id = keyId(email);
    return {
        otp: `pwreset:otp:${id}`,
        cooldown: `pwreset:cooldown:${id}`,
        sends: `pwreset:sends:${id}`,
        token: `pwreset:token:${id}`,
    };
};

export const generateOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
export const hashOtp = (email, otp) => hmac(`otp:${normalizeEmail(email)}`, otp);

export const generateResetToken = () => crypto.randomBytes(32).toString("hex");
export const hashResetToken = (email, token) => hmac(`reset:${normalizeEmail(email)}`, token);

export const safeEqualHex = (a, b) => {
    if (typeof a !== "string" || typeof b !== "string") return false;
    const left = Buffer.from(a, "hex");
    const right = Buffer.from(b, "hex");
    return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
};

// The OTP travels to the email worker through BullMQ (stored in Valkey), so
// it is encrypted in the job payload rather than kept there in plain text.
const encryptionKey = () => crypto.createHash("sha256").update("otp-job:").update(secretKey()).digest();

export const sealOtp = (otp) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
    const data = Buffer.concat([cipher.update(otp, "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map((part) => part.toString("base64")).join(".");
};

export const openOtp = (sealed) => {
    const [iv, tag, data] = String(sealed).split(".").map((part) => Buffer.from(part, "base64"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
};
