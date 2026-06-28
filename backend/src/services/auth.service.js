import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

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

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    fullname,
    email,
    password: hashedPassword,
    isVerified: false,
  });

  const verifyToken = generateVerifyToken(user._id);

  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Email is not registered");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Password is incorrect");
  }

  if (!user.isVerified) {
    throw new Error("Please verify your email first");
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const logoutUser = async () => {
  return true;
};
