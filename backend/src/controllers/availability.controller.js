import { getAvailability } from "../services/availability.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getEquipmentAvailabilityHandler = asyncHandler(async (req, res) => {
    return res.json(await getAvailability("equipment"));
});

export const getLivestockAvailabilityHandler = asyncHandler(async (req, res) => {
    return res.json(await getAvailability("livestock"));
});
