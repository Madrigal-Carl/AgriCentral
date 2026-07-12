import {
    createUser,
    updateUser,
    deleteUser,
    getUsers,
} from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createUserHandler = asyncHandler(async (req, res) => {
    const user = await createUser(req.body);

    return res.status(201).json({
        message: "User created successfully",
        user,
    });
});

export const updateUserHandler = asyncHandler(async (req, res) => {
    const user = await updateUser(req.params.id, req.body);

    return res.status(200).json({
        message: "User updated successfully",
        user,
    });
});

export const deleteUserHandler = asyncHandler(async (req, res) => {
    const user = await deleteUser(req.params.id);

    return res.status(200).json({
        message: "User deleted successfully",
        user,
    });
});

export const getUsersHandler = asyncHandler(async (req, res) => {
    const { users, pagination } = await getUsers(req.query);

    return res.status(200).json({
        message: "Users fetched successfully",
        users,
        pagination,
    });
});