import {
  registerUser,
  loginUser,
  logoutUser,
} from "../services/auth.service.js";
import { sendTokenCookies } from "../utils/sendTokenCookies.js";
import { clearTokenCookies } from "../utils/clearTokenCookies.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const register = asyncHandler(async (req, res) => {
  await registerUser(req.body);

  return res.status(201).json({
    message: "Account created. Please verify your email.",
  });
});

export const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await loginUser(req.body);

  sendTokenCookies({
    res,
    accessToken,
    refreshToken,
  });

  return res.json({
    message: "Login successful",
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser();

  clearTokenCookies(res);

  return res.json({
    message: "Logged out successfully",
  });
});

export const getMe = asyncHandler(async (req, res) => {
  return res.json({
    user: req.user || null,
  });
});
