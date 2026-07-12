import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

import { generateAccessToken } from "../utils/generateToken.js";

export const authenticated = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    // ACCESS TOKEN
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

        const user = await User.findById(decoded.userId);

        if (!user) {
          return res.status(401).json({
            message: "User not found",
          });
        }

        req.user = user;

        return next();
      } catch (err) {
        // access token expired
      }
    }

    // REFRESH TOKEN
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Session expired",
      });
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // GENERATE NEW ACCESS TOKEN
    const newAccessToken = generateAccessToken(user._id);

    // SET NEW ACCESS TOKEN COOKIE
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Session expired",
    });
  }
};

export const guestOnly = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    let decoded = null;

    if (accessToken) {
      try {
        decoded = jwt.verify(
          accessToken,
          process.env.JWT_ACCESS_SECRET
        );
      } catch (err) {
        // ignore expired/invalid access token
      }
    }

    if (!decoded && refreshToken) {
      try {
        decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET
        );
      } catch (err) {
        // ignore invalid refresh token
      }
    }

    if (decoded) {
      const user = await User.findById(decoded.userId);

      if (user) {
        return res.status(403).json({
          message: "You are already logged in",
        });
      }
    }

    next();
  } catch (err) {
    next();
  }
};

export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.role || "guest";

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: "Forbidden: insufficient permissions",
      });
    }

    next();
  };
};

export const excludeRoles = (...blockedRoles) => {
  return (req, res, next) => {
    if (req.user && blockedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }
    next();
  };
};

export const scopeByUserId = (req, res, next) => {
  if (req.user?.role === "far") {
    req.query.userId = String(req.user._id);
  } else {
    delete req.query.userId;
  }

  next();
};