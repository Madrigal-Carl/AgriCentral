import express from "express";
import {
    register,
    login,
    logout,
    getMe,
} from "../controllers/auth.controller.js";
import {
    validateRegister,
    validateLogin,
} from "../validators/auth.validator.js";
import { authenticated, guestOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", guestOnly, validateRegister, register);

router.post("/login", guestOnly, validateLogin, login);

router.post("/logout", authenticated, logout);

router.get("/me", authenticated, getMe);

export default router;