import express from "express";
import {
    createUserHandler,
    updateUserHandler,
    deleteUserHandler,
    getUsersHandler,
} from "../controllers/user.controller.js";
import {
    validateCreateUser,
    validateUpdateUser,
    validateUserIdParam,
    validateGetUsersQuery,
} from "../validators/user.validator.js";
import { authenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, validateGetUsersQuery, getUsersHandler);
router.post("/", authenticated, validateCreateUser, createUserHandler);
router.patch("/:id", authenticated, validateUserIdParam, validateUpdateUser, updateUserHandler);
router.delete("/:id", authenticated, validateUserIdParam, deleteUserHandler);

export default router;