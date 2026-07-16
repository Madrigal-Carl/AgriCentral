import {
    createRequest,
    updateRequest,
    updateRequestApproval,
    releaseRequest,
    deleteRequest,
    getRequests,
} from "../services/request.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createRequestHandler = asyncHandler(async (req, res) => {
    const request = await createRequest(req.body, req.user?._id);

    return res.status(201).json({
        message: "Request created successfully",
        request,
    });
});

export const updateRequestHandler = asyncHandler(async (req, res) => {
    const request = await updateRequest(req.params.id, req.body);

    return res.status(200).json({
        message: "Request updated successfully",
        request,
    });
});

export const updateRequestApprovalHandler = asyncHandler(async (req, res) => {
    const request = await updateRequestApproval(req.params.id, req.body, req.user);

    return res.status(200).json({
        message: "Request review submitted successfully",
        request,
    });
});

export const releaseRequestHandler = asyncHandler(async (req, res) => {
    const request = await releaseRequest(req.params.id);

    return res.status(200).json({
        message: `Request release status: ${request.releaseStatus}`,
        request,
    });
});

export const deleteRequestHandler = asyncHandler(async (req, res) => {
    const request = await deleteRequest(req.params.id);

    return res.status(200).json({
        message: "Request deleted successfully",
        request,
    });
});

export const getRequestsHandler = asyncHandler(async (req, res) => {
    const { requests, pagination } = await getRequests(req.query);

    return res.status(200).json({
        message: "Requests fetched successfully",
        requests,
        pagination,
    });
});