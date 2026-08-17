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
import { authenticated, allowRoles, selfOrAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, allowRoles("admin"), validateGetUsersQuery, getUsersHandler);
router.post("/", authenticated, allowRoles("admin"), validateCreateUser, createUserHandler);
router.patch("/:id", authenticated, selfOrAdmin, validateUserIdParam, validateUpdateUser, updateUserHandler);
router.delete("/:id", authenticated, allowRoles("admin"), validateUserIdParam, deleteUserHandler);

export default router;