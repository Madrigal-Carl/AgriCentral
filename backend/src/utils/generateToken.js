import jwt from "jsonwebtoken";

export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES,
  });
};

// "Remember me" keeps the session for 30 days; otherwise the refresh token
// lasts 1 day and rides in a session cookie, so it cannot outlive the browser
// session by much. The choice is embedded in the token so it is preserved.
export const REFRESH_TOKEN_TTL = {
  remember: { jwt: "30d", ms: 30 * 24 * 60 * 60 * 1000 },
  session: { jwt: "1d" },
};

export const generateRefreshToken = (userId, { rememberMe = false } = {}) => {
  const ttl = rememberMe ? REFRESH_TOKEN_TTL.remember : REFRESH_TOKEN_TTL.session;
  return jwt.sign({ userId, rememberMe: Boolean(rememberMe) }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: ttl.jwt,
  });
};

export const generateVerifyToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_VERIFY_SECRET, {
    expiresIn: "1d",
  });
};
