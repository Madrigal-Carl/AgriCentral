import express from "express";
import { getUploadSignature } from "../controllers/upload.controller.js";
import { validateUploadSignature } from "../validators/upload.validator.js";
import { authenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signature", authenticated, validateUploadSignature, getUploadSignature);

export default router;