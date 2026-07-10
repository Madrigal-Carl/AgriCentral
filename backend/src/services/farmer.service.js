import Farmer from "../models/farmer.model.js";

export const createFarmer = async (data, authenticatedUserId) => {
    const { userId, ...farmerData } = data;

    const existing = await Farmer.findOne({ emailAddress: farmerData.emailAddress });

    if (existing) {
        throw new Error("A farmer with this email already exists");
    }

    const resolvedUserId = userId || authenticatedUserId;

    const farmer = await Farmer.create({
        ...farmerData,
        user: resolvedUserId || undefined,
    });

    return farmer;
};