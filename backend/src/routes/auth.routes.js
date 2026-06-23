import express from "express";
import {
    register,
    login,
    logout,
    getMe,
} from "../controllers/auth.controller.js";
import {
    validateAuth,
} from "../validators/auth.validator.js";
import { authenticated, guestOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", guestOnly, validateAuth, register);

router.post("/login", guestOnly, validateAuth, login);

router.post("/logout", authenticated, logout);

router.get("/me", authenticated, getMe);

export default router;
