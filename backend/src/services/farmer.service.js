import Farmer from "../models/farmer.model.js";

export const createFarmer = async (data, userId) => {
    const existing = await Farmer.findOne({ emailAddress: data.emailAddress });

    if (existing) {
        throw new Error("A farmer with this email already exists");
    }

    const farmer = await Farmer.create({
        ...data,
        user: userId || undefined,
    });

    return farmer;
};