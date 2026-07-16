import express from "express";
import {
    createRequestHandler,
    updateRequestHandler,
    updateRequestApprovalHandler,
    releaseRequestHandler,
    deleteRequestHandler,
    getRequestsHandler,
} from "../controllers/request.controller.js";
import {
    validateCreateRequest,
    validateUpdateRequest,
    validateUpdateRequestApproval,
    validateRequestIdParam,
    validateGetRequestsQuery,
} from "../validators/request.validator.js";
import {
    authenticated,
    scopeByAssociationId,
    scopeByApprovalStage,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
    "/",
    authenticated,
    scopeByAssociationId,
    scopeByApprovalStage,
    validateGetRequestsQuery,
    getRequestsHandler,
);
router.post("/", authenticated, validateCreateRequest, createRequestHandler);
router.patch("/:id", authenticated, validateRequestIdParam, validateUpdateRequest, updateRequestHandler);
router.patch(
    "/:id/approval",
    authenticated,
    validateRequestIdParam,
    validateUpdateRequestApproval,
    updateRequestApprovalHandler,
);
router.patch(
    "/:id/release",
    authenticated,
    validateRequestIdParam,
    releaseRequestHandler,
);
router.delete("/:id", authenticated, validateRequestIdParam, deleteRequestHandler);

export default router;