import express from "express";
import {
    register,
    login,
    logout,
    getMe,
    forgotPassword,
    verifyOtp,
    resetPassword,
} from "../controllers/auth.controller.js";
import {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateVerifyOtp,
    validateResetPassword,
} from "../validators/auth.validator.js";
import { authenticated, guestOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", guestOnly, validateRegister, register);

router.post("/login", guestOnly, validateLogin, login);

router.post("/logout", authenticated, logout);

router.get("/me", authenticated, getMe);

router.post("/forgot-password", validateForgotPassword, forgotPassword);

router.post("/verify-otp", validateVerifyOtp, verifyOtp);

router.post("/reset-password", validateResetPassword, resetPassword);

export default router;