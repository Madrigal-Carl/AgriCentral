import assert from "node:assert/strict";
import { mock, test } from "node:test";
import Equipment from "../src/models/equipment.model.js";
import Livestock from "../src/models/livestock.model.js";
import Farmer from "../src/models/farmer.model.js";
import Association from "../src/models/association.model.js";
import Log from "../src/models/log.model.js";
import Request from "../src/models/request.model.js";
import Report from "../src/models/report.model.js";
import { createFarmerSchema, updateFarmerSchema } from "../src/schemas/farmer.schema.js";
import { createEquipmentSchema, updateEquipmentSchema } from "../src/schemas/equipment.schema.js";
import { createLivestockSchema } from "../src/schemas/livestock.schema.js";
import { createAssociationSchema } from "../src/schemas/association.schema.js";
import { getReportsQuerySchema } from "../src/schemas/report.schema.js";
import { exportAnalyticsPdfQuerySchema, exportAnalyticsExcelQuerySchema } from "../src/schemas/analytics.schema.js";
import { isMeaningfulName } from "../src/utils/meaningfulName.js";
import { isMeaningfulName as frontendMeaningfulName } from "../../frontend/src/utils/meaningfulName.js";
import { fmtPendingSince } from "../../frontend/src/utils/format.js";
import { createFarmerUpdateSchema as frontendFarmerUpdateSchema } from "../../frontend/src/schemas/farmer.schema.js";
import { errorHandler } from "../src/middlewares/error.middleware.js";
import { createEquipment, updateEquipment, getEquipments } from "../src/services/equipment.service.js";
import { createLivestock, updateLivestock } from "../src/services/livestock.service.js";
import { createFarmer, updateFarmer } from "../src/services/farmer.service.js";
import { createAssociation, updateAssociation } from "../src/services/association.service.js";

mock.module("../src/queues/email.queue.js", { defaultExport: { add: async () => {} } });
const { createRequest, releaseRequest } = await import("../src/services/request.service.js");
const { getReports } = await import("../src/services/report.service.js");

const id = "012345678901234567890123";
const associationId = "012345678901234567890124";
const otherId = "012345678901234567890125";
const conflict = (message) => (error) => error.statusCode === 409 && error.message === message;
const query = (result) => ({ select: () => Promise.resolve(result) });
const listQuery = (result) => ({ populate() { return this; }, sort() { return this; }, lean: async () => result });

test("meaningful names have identical frontend/backend rules", () => {
    for (const name of ["abc", "Abc", "123", "Asdf", "Test", "farmers association", "FARMERS ASSOCIATION", "AaAa", "Brr", "A1", ""]) {
        assert.equal(isMeaningfulName(name), false, name);
        assert.equal(frontendMeaningfulName(name), false, name);
    }
    for (const name of ["Sta. Rosa Farmers Association", "Damaged Tractor Report", "Rice Pest Outbreak"]) {
        assert.equal(isMeaningfulName(name), true, name);
        assert.equal(frontendMeaningfulName(name), true, name);
    }
});

test("contact number is exactly 11 digits starting with 09", () => {
    const schema = createFarmerSchema.shape.contactNumber;
    assert.equal(schema.safeParse("09123456789").success, true);
    for (const value of ["08123456789", "0912345678", "091234567890", "+639123456789", "09abcdefghi", "", undefined]) {
        const result = schema.safeParse(value);
        assert.equal(result.success, false);
        assert.equal(result.error.issues[0].message, "Contact number must be 11 digits and start with 09");
    }
});

test("partial farmer updates preserve existing position and legacy attachments", () => {
    assert.deepEqual(updateFarmerSchema.parse({ firstName: "Juan" }), { firstName: "Juan" });
});

test("frontend contact and single-image validation match backend restrictions", () => {
    const schema = frontendFarmerUpdateSchema();
    assert.equal(schema.safeParse({ contact: "09123456789" }).success, true);
    assert.equal(schema.safeParse({ contact: "08123456789" }).success, false);
    assert.equal(schema.safeParse({ profileImage: [{ file: new File(["image"], "avatar.png", { type: "image/png" }) }] }).success, true);
    assert.equal(schema.safeParse({ profileImage: [{ file: new File(["text"], "notes.txt", { type: "text/plain" }) }] }).success, false);
    const image = { url: "https://example.com/avatar.jpg", publicId: "avatar", resourceType: "image" };
    assert.equal(schema.safeParse({ profileImage: [image, image] }).success, false);
});

test("unique indexes protect active positions and location pairs from concurrent writes", () => {
    const [, positionOptions] = Farmer.schema.indexes().find(([keys]) => keys.association && keys.position);
    assert.equal(positionOptions.unique, true);
    assert.equal(positionOptions.partialFilterExpression.position.$in.includes("member"), false);
    assert.equal(positionOptions.partialFilterExpression.position.$in.includes("director"), false);
    const [, locationOptions] = Association.schema.indexes().find(([keys]) => keys.municipality && keys.barangay);
    assert.equal(locationOptions.unique, true);
    assert.equal(locationOptions.collation.strength, 2);
});

test("concurrent duplicate writes return the same field-friendly 409 messages", (t) => {
    t.mock.method(console, "error", () => {});
    for (const [keyPattern, message] of [
        [{ propertyNumber: 1 }, "Property number is already in use"],
        [{ association: 1, position: 1 }, "This position is already taken in this association"],
        [{ municipality: 1, barangay: 1 }, "This municipality and barangay is already assigned to another association"],
    ]) {
        let status;
        const res = { status(value) { status = value; return this; }, json(body) { assert.equal(body.message, message); } };
        errorHandler({ code: 11000, keyPattern }, {}, res, () => {});
        assert.equal(status, 409);
    }
});

test("profile image only accepts a single image asset", () => {
    const image = { url: "https://example.com/avatar.jpg", publicId: "farmer/avatar", resourceType: "image" };
    assert.deepEqual(createFarmerSchema.shape.profileImage.parse(image), image);
    assert.equal(createFarmerSchema.shape.profileImage.safeParse({ ...image, resourceType: "raw" }).success, false);
    assert.equal(createFarmerSchema.shape.profileImage.safeParse([image, image]).success, false);
    assert.equal(createFarmerSchema.shape.profileImage.safeParse(null).success, true);
});

test("association location is validated", () => {
    const data = { name: "Sta. Rosa Farmers Association", municipality: "Boac", barangay: "Bantad" };
    assert.equal(createAssociationSchema.safeParse(data).success, true);
    assert.equal(createAssociationSchema.safeParse({ ...data, barangay: "" }).success, false);
});

test("equipment assignment no longer requires an assigned farmer", () => {
    assert.equal(createEquipmentSchema.safeParse({ propertyNumber: "EQ-1", name: "Tractor", associationId, status: "assigned" }).success, true);
    assert.equal(updateEquipmentSchema.safeParse({ status: "assigned", associationId }).success, true);
    for (const condition of ["damaged", "unusable", "maintenance"]) {
        assert.equal(createEquipmentSchema.safeParse({ propertyNumber: "EQ-1", name: "Tractor", associationId, condition }).success, false);
    }
});

test("livestock assignment rejects poor health in the validator", () => {
    const data = { propertyNumber: "LV-1", animal: "Cow", breed: "Angus", gender: "female", birthDate: "2026-01-01", color: "Brown", weight: 100, associationId };
    assert.equal(createLivestockSchema.safeParse({ ...data, status: "assigned" }).success, true);
    for (const condition of ["deceased", "injured", "sick"]) {
        assert.equal(createLivestockSchema.safeParse({ ...data, condition }).success, false);
    }
});

test("model status follows association and mortality timestamps follow health", async () => {
    const equipment = new Equipment({ propertyNumber: "EQ-1", name: "Tractor", association: associationId });
    await equipment.validate();
    assert.equal(equipment.status, "assigned");
    equipment.association = null;
    equipment.assignedFarmer = id;
    await equipment.validate();
    assert.equal(equipment.status, "available");
    const livestock = new Livestock({ propertyNumber: "LV-1", animal: "Cow", breed: "Angus", gender: "female", birthDate: new Date(), color: "Brown", weight: 100, condition: "deceased", association: associationId });
    await livestock.validate();
    assert.equal(livestock.status, "assigned");
    const date = livestock.deceasedAt;
    assert.ok(date instanceof Date);
    await livestock.validate();
    assert.equal(livestock.deceasedAt.getTime(), date.getTime());
    livestock.condition = "healthy";
    await livestock.validate();
    assert.equal(livestock.deceasedAt, null);
});

for (const [name, Model, create, update] of [["equipment", Equipment, createEquipment, updateEquipment], ["livestock", Livestock, createLivestock, updateLivestock]]) {
    test(`${name} property number conflicts return 409 and exclude self on edit`, async (t) => {
        let filter;
        t.mock.method(Model, "findOne", (value) => { filter = value; return Promise.resolve({ _id: otherId }); });
        await assert.rejects(create({ propertyNumber: "PROP-1" }), conflict("Property number is already in use"));
        await assert.rejects(update(id, { propertyNumber: "PROP-1" }), conflict("Property number is already in use"));
        assert.deepEqual(filter._id, { $ne: id });
    });

    test(`${name} service blocks assigning an item in poor condition`, async (t) => {
        const condition = name === "equipment" ? "damaged" : "sick";
        t.mock.method(Model, "findOne", () => query({ condition }));
        await assert.rejects(update(id, { associationId }), conflict(`Not assignable: ${condition}`));
    });

    test(`${name} service derives status even when the caller supplies the wrong status`, async (t) => {
        t.mock.method(Model, "findOne", () => query({ association: associationId, condition: name === "equipment" ? "good" : "healthy" }));
        let written;
        t.mock.method(Model, "findOneAndUpdate", (filter, update) => {
            written = update;
            return { populate: async () => ({ _id: id, association: associationId, status: update.$set.status }) };
        });
        await update(id, { status: "available" });
        assert.equal(written.$set.status, "assigned");
    });
}

test("livestock service sets and clears deceasedAt on health updates", async (t) => {
    let previous = { association: associationId, condition: "healthy" };
    let written;
    t.mock.method(Livestock, "findOne", () => query(previous));
    t.mock.method(Log, "create", async () => ({}));
    t.mock.method(Livestock, "findOneAndUpdate", (filter, update) => {
        written = update;
        return { populate: async () => ({ _id: id, association: associationId, ...update.$set }) };
    });
    await updateLivestock(id, { condition: "deceased" });
    assert.ok(written.$set.deceasedAt instanceof Date);
    previous = { ...previous, condition: "deceased", deceasedAt: written.$set.deceasedAt };
    await updateLivestock(id, { condition: "deceased" });
    assert.equal(written.$set.deceasedAt, previous.deceasedAt);
    await updateLivestock(id, { condition: "healthy" });
    assert.equal(written.$set.deceasedAt, null);
});

test("unique association officer positions are checked on create and edit", async (t) => {
    let filter;
    t.mock.method(Farmer, "exists", async (value) => { filter = value; return { _id: otherId }; });
    t.mock.method(Farmer, "findOne", () => query({ association: associationId, position: "president" }));
    for (const position of ["president", "vice_president", "secretary", "treasurer", "auditor", "pio", "project_manager"]) {
        await assert.rejects(createFarmer({ associationId, position }), conflict("This position is already taken in this association"));
    }
    await assert.rejects(updateFarmer(id, { associationId }), conflict("This position is already taken in this association"));
    assert.deepEqual(filter._id, { $ne: id });
});

test("member and director positions may repeat", async (t) => {
    const exists = t.mock.method(Farmer, "exists", async () => { throw new Error("Should not check repeatable positions"); });
    t.mock.method(Farmer, "create", async () => ({ _id: id, getFullName: () => "Juan Dela Cruz" }));
    t.mock.method(Log, "create", async () => ({}));
    for (const position of ["member", "director"]) await createFarmer({ associationId, position });
    assert.equal(exists.mock.callCount(), 0);
});

test("association municipality/barangay conflicts exclude self on edit", async (t) => {
    let filter;
    t.mock.method(Association, "exists", async (value) => { filter = value; return { _id: otherId }; });
    t.mock.method(Association, "findOne", async () => ({ municipality: "Boac", barangay: "Bantad" }));
    const message = "This municipality and barangay is already assigned to another association";
    await assert.rejects(createAssociation({ name: "Sta. Rosa Farmers Association", municipality: "Boac", barangay: "Bantad" }), conflict(message));
    await assert.rejects(updateAssociation(id, { barangay: "Bantad" }), conflict(message));
    assert.deepEqual(filter._id, { $ne: id });
    assert.equal(filter.municipality.test("BOAC"), true);
});

test("pending duration handles days, hours, minutes, invalid and future dates", () => {
    const now = Date.parse("2026-10-21T12:00:00Z");
    assert.equal(fmtPendingSince("2026-10-18T08:00:00Z", now), "3d 4h");
    assert.equal(fmtPendingSince("2026-10-21T06:40:00Z", now), "5h 20m");
    assert.equal(fmtPendingSince("2026-10-21T11:40:00Z", now), "20m");
    assert.equal(fmtPendingSince("2026-10-21T11:59:59Z", now), "just now");
    assert.equal(fmtPendingSince("2027-01-01", now), "just now");
    assert.equal(fmtPendingSince("invalid", now), "—");
});

test("status filter remains effective when association scoping is also present", async (t) => {
    let filter;
    t.mock.method(Equipment, "find", (value) => { filter = value; return { populate() { return this; }, sort: async () => [] }; });
    await getEquipments({ all: true, status: "available", associationId });
    assert.equal(filter.association, associationId);
    assert.deepEqual(filter.$and, [{ association: null }]);
});

test("request creation and release reject poor-condition items", async (t) => {
    t.mock.method(Equipment, "countDocuments", async () => 1);
    t.mock.method(Equipment, "find", () => query([{ condition: "maintenance" }]));
    await assert.rejects(createRequest({ entityType: "equipment", entityIds: [id] }), conflict("Not assignable: maintenance"));
    t.mock.method(Request, "findOne", async () => ({ entityType: "equipment", entityIds: [id], approvalStatus: { head: { status: "approved" } } }));
    await assert.rejects(releaseRequest(id), conflict("Not assignable: maintenance"));
});

test("report filters use stored farm type, severity and the browser's calendar date", async (t) => {
    let filter;
    t.mock.method(Report, "find", (value) => { filter = value; return listQuery([]); });
    const params = getReportsQuerySchema.parse({ entityType: "farm", severity: "high", date: "2026-10-21", timezoneOffset: "-480", all: "true" });
    await getReports(params);
    assert.equal(filter.entityType, "farm");
    assert.equal(filter.severity, "high");
    assert.equal(filter.createdAt.$gte.toISOString(), "2026-10-20T16:00:00.000Z");
    assert.equal(filter.createdAt.$lt.toISOString(), "2026-10-21T16:00:00.000Z");
    await getReports({ all: true, entityType: "equipment", associationId });
    assert.equal(filter.entityType, "equipment");
    assert.equal(filter.association, associationId);
});

test("analytics PDF and Excel exports support All, Crop, Equipment and Livestock", () => {
    for (const schema of [exportAnalyticsPdfQuerySchema, exportAnalyticsExcelQuerySchema]) {
        assert.equal(schema.parse({}).section, "all");
        for (const section of ["all", "farm", "equipment", "livestock"]) {
            const result = schema.parse({ section, association: associationId, period: "year" });
            assert.equal(result.section, section);
            assert.equal(result.association, associationId);
            assert.equal(result.period, "year");
        }
        assert.equal(schema.safeParse({ section: "invalid" }).success, false);
    }
});
