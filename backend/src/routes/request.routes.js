import express from "express";
import {
    createRequestHandler,
    updateRequestHandler,
    updateRequestApprovalHandler,
    revertRequestApprovalHandler,
    releaseRequestHandler,
    deleteRequestHandler,
    getRequestsHandler,
} from "../controllers/request.controller.js";
import {
    validateCreateRequest,
    validateUpdateRequest,
    validateUpdateRequestApproval,
    validateRevertRequestApproval,
    validateRequestIdParam,
    validateGetRequestsQuery,
} from "../validators/request.validator.js";
import {
    authenticated,
    allowRoles,
    scopeByAssociationId,
    scopeByApprovalStage,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
    "/",
    authenticated,
    allowRoles("far", "coordinator", "governor", "head", "admin"),
    scopeByAssociationId,
    scopeByApprovalStage,
    validateGetRequestsQuery,
    getRequestsHandler,
);
router.post("/", authenticated, allowRoles("far"), validateCreateRequest, createRequestHandler);
router.patch("/:id", authenticated, allowRoles("far"), validateRequestIdParam, validateUpdateRequest, updateRequestHandler);
router.patch(
    "/:id/approval",
    authenticated,
    allowRoles("coordinator", "governor", "head"),
    validateRequestIdParam,
    validateUpdateRequestApproval,
    updateRequestApprovalHandler,
);
router.patch(
    "/:id/approval/revert",
    authenticated,
    allowRoles("governor", "head"),
    validateRequestIdParam,
    validateRevertRequestApproval,
    revertRequestApprovalHandler,
);
router.patch(
    "/:id/release",
    authenticated,
    allowRoles("coordinator"),
    validateRequestIdParam,
    releaseRequestHandler,
);
router.delete("/:id", authenticated, allowRoles("far"), validateRequestIdParam, deleteRequestHandler);

export default router;
