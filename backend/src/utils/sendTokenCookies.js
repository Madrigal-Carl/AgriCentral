import { REFRESH_TOKEN_TTL } from "./generateToken.js";

export const sendTokenCookies = ({ res, accessToken, refreshToken, rememberMe = false }) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    // No maxAge -> session cookie that the browser drops when it closes.
    ...(rememberMe ? { maxAge: REFRESH_TOKEN_TTL.remember.ms } : {}),
  });
};