import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

import { generateAccessToken } from "../utils/generateToken.js";

export const authenticated = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        return next();
      } catch (err) {
        // access token expired
      }
    }

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Session expired" });
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const newAccessToken = generateAccessToken(user._id);
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
    return res.status(401).json({ message: "Session expired" });
  }
};

export const guestOnly = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    let decoded = null;

    if (accessToken) {
      try {
        decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
      } catch (err) {
        // ignore expired/invalid access token
      }
    }

    if (!decoded && refreshToken) {
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch (err) {
        // ignore invalid refresh token
      }
    }

    if (decoded) {
      const user = await User.findById(decoded.userId);
      if (user) {
        return res.status(403).json({ message: "You are already logged in" });
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
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
};

export const excludeRoles = (...blockedRoles) => {
  return (req, res, next) => {
    if (req.user && blockedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

export const scopeByAssociationId = (req, res, next) => {
  const query = { ...req.query };

  if (req.user?.role === "far") {
    query.associationId = req.user.association
      ? String(req.user.association)
      : "000000000000000000000000";
  } else {
    delete query.associationId;
  }

  Object.defineProperty(req, "query", {
    value: query,
    writable: true,
    configurable: true,
    enumerable: true,
  });

  next();
};

// Restricts list visibility for stage-reviewer roles: a coordinator sees
// every request (the coordinator subdoc always exists, set at creation),
// a governor only sees requests that reached the governor stage (never
// livestock ones, since that stage is skipped for those), and head only
// sees requests that reached the head stage. far and admin are never
// stage-scoped — they see every request at every stage. Mirrors
// scopeByAssociationId's pattern of injecting a query param based on the
// authenticated user rather than trusting the client to supply it.
export const scopeByApprovalStage = (req, res, next) => {
  const stageRoles = ["coordinator", "governor", "head"];
  const query = { ...req.query };

  if (stageRoles.includes(req.user?.role)) {
    query.stage = req.user.role;
  } else {
    delete query.stage;
  }

  Object.defineProperty(req, "query", {
    value: query,
    writable: true,
    configurable: true,
    enumerable: true,
  });

  next();
};