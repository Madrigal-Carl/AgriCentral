import mongoose from "mongoose";
import Crop from "../models/crop.model.js";
import Farm from "../models/farm.model.js";
import Report from "../models/report.model.js";
import { createLog } from "../services/log.service.js";
import { getCropReportEntries } from "./reportItems.js";
import { readFarmCropQuantities, stageQuantityTotal } from "./cropStages.js";

// Final approval of a Newly Planted crop report moves its seed:
//   - government seed: Crop.unplanted -= seedQuantity (never below zero);
//   - both ownerships: the farm's Farm.crops[].quantities.planted += seedQuantity.
// What was applied is recorded on the report (seedApplication, select:false)
// so it happens once, and reversal undoes exactly that record.
// Callers run these inside the report's operation lock.

function fail(message, statusCode = 409) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
}

const idOf = (value) => String(value?._id ?? value ?? "");

// The seed a report would apply on final approval, or null.
export function plannedSeedApplication(report) {
    if (report?.entityType !== "farm") return null;
    const entries = getCropReportEntries(report);
    const [entry] = entries;
    if (entries.length !== 1 || entry?.stage !== "newly_planted") return null;
    const quantity = entry.stageData?.seedQuantity;
    if (!Number.isFinite(quantity) || quantity <= 0) return null;
    return { crop: entry.crop, quantity, farm: report.parentId };
}

export async function getSeedApplication(reportId) {
    const report = await Report.findById(reportId).select("+seedApplication").lean();
    return report?.seedApplication?.crop ? report.seedApplication : null;
}

// Sets one farm crop entry's planted from `from` to `to`; the match on the
// value read guards against a concurrent write to the same entry.
async function setEntryPlanted(farmId, entryId, from, to) {
    const result = await Farm.updateOne(
        { _id: farmId, crops: { $elemMatch: { _id: entryId, "quantities.planted": from ?? null } } },
        { $set: { "crops.$.quantities.planted": to } },
    );
    if (!result.modifiedCount) fail("The farm record changed while the seed was being applied. Please try again.");
}

// Adds planted seed to the farm's latest entry for the crop, creating the
// entry when the farm has none. Returns the entry id.
async function addFarmPlanted(farm, cropId, quantity) {
    const entry = [...(farm.crops ?? [])].reverse().find((item) => idOf(item.crop) === idOf(cropId));
    if (!entry) {
        const entryId = new mongoose.Types.ObjectId();
        await Farm.updateOne(
            { _id: farm._id, deletedAt: null },
            { $push: { crops: { _id: entryId, crop: cropId, quantities: { planted: quantity } } } },
        );
        return entryId;
    }
    const planted = entry.quantities?.planted;
    await setEntryPlanted(farm._id, entry._id, planted, (planted ?? 0) + quantity);
    return entry._id;
}

const seedText = (record, crop, farm) =>
    `${record.quantity} ${record.ownership === "government" ? "government" : "farmer-owned"} seed${record.quantity === 1 ? "" : "s"} of ${crop?.name ?? "the crop"} on farm ${farm?.tag ?? "(removed)"}`;

// Applies a report's seed once. Insufficient government stock fails with 409
// and changes nothing.
export async function applySeedApplication(report) {
    const plan = plannedSeedApplication(report);
    if (!plan) return null;
    const existing = await getSeedApplication(report._id);
    if (existing) return existing;

    const crop = await Crop.findOne({ _id: plan.crop, deletedAt: null }).select("name ownership unplanted").lean();
    if (!crop) fail("The report's crop was not found", 404);
    const farm = await Farm.findOne({ _id: plan.farm, deletedAt: null }).select("tag crops").lean();
    if (!farm) fail("The report's farm was not found", 404);
    const ownership = crop.ownership === "farmer" ? "farmer" : "government";

    if (ownership === "government") {
        const deducted = await Crop.updateOne(
            { _id: crop._id, ownership: { $ne: "farmer" }, unplanted: { $gte: plan.quantity } },
            { $inc: { unplanted: -plan.quantity } },
        );
        if (!deducted.modifiedCount) {
            fail(`Not enough unplanted stock for ${crop.name}: this report plants ${plan.quantity} seeds but only ${crop.unplanted ?? 0} are available. Nothing was changed.`);
        }
    }

    let entryId;
    try {
        entryId = await addFarmPlanted(farm, crop._id, plan.quantity);
    } catch (error) {
        if (ownership === "government") await Crop.updateOne({ _id: crop._id }, { $inc: { unplanted: plan.quantity } });
        throw error;
    }

    const record = { crop: crop._id, quantity: plan.quantity, ownership, farm: farm._id, entry: entryId, appliedAt: new Date() };
    await Report.updateOne({ _id: report._id }, { $set: { seedApplication: record } });
    await createLog({
        entityType: "report", entityId: report._id, association: report.association,
        message: ownership === "government"
            ? `Approved crop report "${report.title}": deducted ${seedText(record, crop, farm)} from unplanted stock and added them to the farm's planted quantity.`
            : `Approved crop report "${report.title}": added ${seedText(record, crop, farm)} to the farm's planted quantity (no stock deducted).`,
    });
    return record;
}

// Undoes exactly what was applied. Blocked (409, nothing changed) when the
// farm's planted would drop below the quantities already in later stages.
export async function reverseSeedApplication(report, reason) {
    const record = await getSeedApplication(report._id);
    if (!record) return null;

    const crop = await Crop.findById(record.crop).select("name").lean();
    const farm = await Farm.findOne({ _id: record.farm, deletedAt: null }).select("tag crops").lean();
    const entry = farm?.crops?.find((item) => idOf(item._id) === idOf(record.entry))
        ?? [...(farm?.crops ?? [])].reverse().find((item) => idOf(item.crop) === idOf(record.crop));

    if (entry) {
        const quantities = readFarmCropQuantities(entry.quantities);
        const planted = quantities.planted ?? 0;
        const staged = stageQuantityTotal(quantities);
        const remaining = planted - record.quantity;
        if (remaining < staged) {
            fail(`Cannot reverse ${record.quantity} planted seeds of ${crop?.name ?? "this crop"} on farm ${farm.tag}: planted would drop to ${Math.max(remaining, 0)}, below the ${staged} already recorded in later stages. Lower those stage quantities in the farm record first.`);
        }
        await setEntryPlanted(farm._id, entry._id, entry.quantities?.planted, remaining);
    }
    if (record.ownership === "government") {
        await Crop.updateOne({ _id: record.crop }, { $inc: { unplanted: record.quantity } });
    }
    await Report.updateOne({ _id: report._id }, { $unset: { seedApplication: "" } });
    const effects = [
        ...(record.ownership === "government" ? ["returned to unplanted stock"] : []),
        entry ? "removed from the farm's planted quantity" : "the farm crop entry no longer exists",
    ];
    await createLog({
        entityType: "report", entityId: report._id, association: report.association,
        message: `Crop report "${report.title}" ${reason}: reversed ${seedText(record, crop, farm)} (${effects.join("; ")}).`,
    });
    return record;
}
