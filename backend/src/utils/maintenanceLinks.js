import Municipality from "../models/municipality.model.js";
import Barangay from "../models/barangay.model.js";
import CropType from "../models/cropType.model.js";
import EquipmentType from "../models/equipmentType.model.js";
import AnimalType from "../models/animalType.model.js";
import Breed from "../models/breed.model.js";
import Color from "../models/color.model.js";

export const maintenanceModels = { municipalities: Municipality, barangays: Barangay, crops: CropType, equipments: EquipmentType, animals: AnimalType, breeds: Breed, colors: Color };
export const idOf = (value) => String(value?._id ?? value ?? "");
export const referenceError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

export async function validateLink(Model, value, previous, label) {
    if (value === undefined || (previous && idOf(value) === idOf(previous))) return;
    if (!value || !await Model.exists({ _id: value, deletedAt: null })) {
        throw referenceError(`Select an active ${label}`);
    }
}

export async function validateLocation(data, previous = {}) {
    await validateLink(Municipality, data.municipality, previous.municipality, "municipality");
    await validateLink(Barangay, data.barangay, previous.barangay, "barangay");
    const municipality = data.municipality ?? previous.municipality;
    const barangay = data.barangay ?? previous.barangay;
    if ((data.municipality !== undefined || data.barangay !== undefined) && barangay) {
        const child = await Barangay.findById(idOf(barangay));
        if (!child || idOf(child.municipality) !== idOf(municipality)) throw referenceError("Barangay must belong to the selected municipality");
    }
    if (municipality && barangay && (data.municipality !== undefined || data.barangay !== undefined || data.street !== undefined)) {
        const [parent, child] = await Promise.all([Municipality.findById(idOf(municipality)), Barangay.findById(idOf(barangay))]);
        data.address = [data.street ?? previous.street, child?.name, parent?.name].filter(Boolean).join(", ");
    }
}

export async function validateInventoryLinks(kind, data, previous = {}) {
    if (kind === "crop") await validateLink(CropType, data.cropType, previous.cropType, "crop");
    if (kind === "equipment") await validateLink(EquipmentType, data.equipmentType, previous.equipmentType, "equipment");
    const nameLink = kind === "crop" ? [CropType, "cropType", "name"] : kind === "equipment" ? [EquipmentType, "equipmentType", "name"] : [AnimalType, "animalType", "animal"];
    if (data[nameLink[1]]) {
        const item = await nameLink[0].findById(idOf(data[nameLink[1]]));
        data[nameLink[2]] = item?.name;
    }
    if (kind !== "livestock") return;
    await validateLink(AnimalType, data.animalType, previous.animalType, "animal");
    await validateLink(Breed, data.breed, previous.breed, "breed");
    await validateLink(Color, data.color, previous.color, "color");
    if (data.animalType !== undefined || data.breed !== undefined) {
        const breed = await Breed.findById(idOf(data.breed ?? previous.breed));
        if (!breed || idOf(breed.animalType) !== idOf(data.animalType ?? previous.animalType)) throw referenceError("Breed must belong to the selected animal");
    }
}

export const LOCATION_POPULATE = ["municipality", "barangay"].map((path) => ({ path, select: "name deletedAt municipality" }));
export const CROP_TYPE_POPULATE = { path: "cropType", select: "name deletedAt" };
export const EQUIPMENT_TYPE_POPULATE = { path: "equipmentType", select: "name deletedAt" };
export const ANIMAL_POPULATE = ["animalType", "breed", "color"].map((path) => ({ path, select: "name deletedAt animalType" }));
