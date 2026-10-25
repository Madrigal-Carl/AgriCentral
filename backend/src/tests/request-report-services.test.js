import { test, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Request from "../models/request.model.js";
import User from "../models/user.model.js";
import Report from "../models/report.model.js";
import Equipment from "../models/equipment.model.js";
import Livestock from "../models/livestock.model.js";
import Association from "../models/association.model.js";
import Log from "../models/log.model.js";

// No Redis or database connection: exercise service transitions against atomic
// in-memory model stubs, while using real Mongoose documents/subdocuments.
mock.module(new URL("../queues/email.queue.js", import.meta.url).href, { defaultExport: { add: async () => {} } });
const { createRequest, updateRequestApproval, revertRequestApproval, assignUnitsForRequest, releaseRequest, updateRequest, getRequests } = await import("../services/request.service.js");
const { validateRequestAvailability, availabilityFilter } = await import("../services/availability.service.js");
const { updateReportApproval, createReport, updateReport } = await import("../services/report.service.js");
const { seedReports } = await import("../seeders/report.seeder.js");
const { seedRequests } = await import("../seeders/request.seeder.js");
const oid = () => new mongoose.Types.ObjectId();
const actor = (role) => ({ role, _id: oid() });
let inventory;
let logs;
let locks;
let requests;

function matches(doc, filter) {
    return Object.entries(filter).every(([key, value]) => {
        const actual = doc[key];
        if (value === null) return actual == null;
        if (value?.$in) return value.$in.some((entry) => String(entry) === String(actual));
        if (value?.$nin) return !value.$nin.includes(actual);
        return String(actual) === String(value);
    });
}

function query(docs) {
    let rows = docs;
    const result = {
        sort: () => result,
        limit: (count) => { rows = rows.slice(0, count); return result; },
        select: () => result,
        lean: () => result,
        populate: () => result,
        then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject),
    };
    return result;
}

function unit(key = "Tractor", extras = {}) {
    const doc = { _id: oid(), name: key, animal: key, propertyNumber: `UNIT-${inventory.length + 1}`, deletedAt: null, association: null, reservedBy: null, status: "available", condition: "good", ...extras };
    inventory.push(doc);
    return doc;
}

function request(extras = {}) {
    const doc = new Request({
        title: "Harvest request", entityType: "equipment", lines: [{ key: "Tractor", quantity: 2 }],
        details: "Needed before harvest", approvalStatus: { coordinator: { status: "approved" }, governor: { status: "approved" }, head: { status: "pending" } },
        ...extras,
    });
    doc.save = mock.fn(async () => doc);
    requests.set(String(doc._id), doc);
    return doc;
}

beforeEach(() => {
    inventory = [];
    logs = [];
    locks = new Set();
    requests = new Map();
    mock.method(Request, "findOneAndUpdate", async ({ _id }) => {
        const key = String(_id);
        if (locks.has(key)) return null;
        const doc = requests.get(key);
        if (doc) locks.add(key);
        return doc;
    });
    mock.method(Request, "exists", async ({ _id }) => requests.has(String(_id)));
    mock.method(Request, "updateOne", async ({ _id }) => { locks.delete(String(_id)); return { modifiedCount: 1 }; });
    mock.method(Log, "create", async (entry) => { logs.push(entry); });
    mock.method(Association, "findById", () => query(null));
    mock.method(Association, "findOne", () => query(null));
    mock.method(User, "findById", () => query({ fullname: "Previous Reviewer" }));
    mock.method(User, "find", () => query([]));
    for (const Model of [Equipment, Livestock]) {
        mock.method(Model, "find", (filter) => query(inventory.filter((doc) => matches(doc, filter))));
        mock.method(Model, "countDocuments", async (filter) => inventory.filter((doc) => matches(doc, filter)).length);
        const write = async (filter, update) => {
            const docs = inventory.filter((doc) => matches(doc, filter));
            for (const doc of docs) {
                Object.assign(doc, update.$set ?? {});
                for (const key of Object.keys(update.$unset ?? {})) delete doc[key];
            }
            return { modifiedCount: docs.length };
        };
        mock.method(Model, "updateMany", write);
        mock.method(Model, "updateOne", write);
    }
});
afterEach(() => mock.restoreAll());

test("head approval auto-assigns; revert frees units; re-approval reassigns and retains audit history", async () => {
    unit(); unit();
    const doc = request();
    const head = actor("head");
    await updateRequestApproval(doc._id, { status: "approved", remarks: "Ready to go" }, head);
    assert.equal(doc.entityIds.length, 2);
    assert.ok(inventory.every((item) => String(item.reservedBy) === String(doc._id)));
    await revertRequestApproval(doc._id, { status: "denied", reason: "Needs reassessment" }, head);
    assert.equal(doc.entityIds.length, 0);
    assert.ok(inventory.every((item) => !item.reservedBy));
    assert.equal(doc.approvalStatus.head.remarks, "Needs reassessment");
    await revertRequestApproval(doc._id, { status: "approved", reason: "Stock verified again" }, head);
    assert.equal(doc.entityIds.length, 2);
    assert.ok(logs.some((entry) => entry.message.includes("has approved")));
    assert.ok(logs.some((entry) => entry.message.includes("from approved to denied") && entry.message.includes("Ready to go")));
    assert.ok(logs.some((entry) => entry.message.includes("Stock verified again")));
});

test("stock depleted after denial leaves the head decision denied and makes no reservations", async () => {
    unit();
    const doc = request({ approvalStatus: { coordinator: { status: "approved" }, governor: { status: "approved" }, head: { status: "denied" } } });
    await assert.rejects(revertRequestApproval(doc._id, { status: "approved", reason: "Trying once again" }, actor("head")), { statusCode: 409, message: "Only 1 Tractor available" });
    assert.equal(doc.approvalStatus.head.status, "denied");
    assert.ok(inventory.every((item) => !item.reservedBy));
    assert.equal(doc.save.mock.callCount(), 0);
});

test("revert saves the previous reviewer's name rather than their database id", async () => {
    const governor = { ...actor("governor"), fullname: "Maria Santos" };
    const doc = request({ approvalStatus: {
        coordinator: { status: "approved" },
        governor: { status: "denied", approvedBy: governor._id, approvedAt: new Date(), remarks: "Earlier reason" },
    } });
    await assert.rejects(revertRequestApproval(doc._id, { status: "pending", reason: "Trying to reset" }, governor), { statusCode: 400 });
    await revertRequestApproval(doc._id, { status: "approved", reason: "Verified the stock" }, governor);
    const message = logs.find((entry) => entry.message.includes("changed their decision")).message;
    assert.ok(message.includes("Previous decision: by Maria Santos at"));
    assert.ok(!message.includes(String(governor._id)));
    assert.equal(User.findById.mock.callCount(), 0);
    const otherReviewer = { ...actor("governor"), fullname: "Another Governor" };
    mock.method(User, "findById", () => query({ fullname: "Maria Santos" }));
    await revertRequestApproval(doc._id, { status: "denied", reason: "Further checks needed" }, otherReviewer);
    assert.ok(logs.at(-1).message.includes("Previous decision: by Maria Santos at"));
});

test("legacy audit IDs resolve to names on reads without rewriting stored logs", async () => {
    const reviewerId = oid();
    const doc = request();
    const message = `Governor changed their decision. Previous decision: by ${reviewerId} at 2026-10-25T07:56:55.343Z; remarks: "Original reason".`;
    const legacy = { entityId: doc._id, message, createdAt: new Date() };
    mock.method(Request, "find", () => query([doc.toObject()]));
    mock.method(Log, "find", () => query([legacy]));
    mock.method(User, "find", () => query([{ _id: reviewerId, fullname: "Maria Santos" }]));
    const result = await getRequests({ all: true });
    assert.ok(result.requests[0].history[0].message.includes("by Maria Santos at"));
    assert.equal(legacy.message, message);
});

test("reviewer status filters match their own decision while overall status remains pending", async () => {
    let filter;
    mock.method(Request, "find", (value) => { filter = value; return query([]); });
    for (const stage of ["governor", "head"]) {
        await getRequests({ all: true, stage, status: "approved" });
        assert.equal(filter[`approvalStatus.${stage}.status`], "approved");
    }
    await getRequests({ all: true, status: "approved" });
    assert.equal(filter["approvalStatus.head.status"], "approved");
    assert.ok(filter.$nor);
});

test("failed approval save rolls back its reservations and does not write a decision log", async () => {
    unit(); unit();
    const doc = request();
    doc.save = async () => { throw new Error("Database write failed"); };
    await assert.rejects(updateRequestApproval(doc._id, { status: "approved" }, actor("head")), /Database write failed/);
    assert.ok(inventory.every((item) => !item.reservedBy));
    assert.equal(logs.length, 0);
    assert.equal(locks.size, 0);
});

test("request-level lock prevents a release racing the decision change", async () => {
    unit(); unit();
    const doc = request();
    await updateRequestApproval(doc._id, { status: "approved" }, actor("head"));
    const outcomes = await Promise.allSettled([
        releaseRequest(doc._id),
        revertRequestApproval(doc._id, { status: "denied", reason: "Cancel this request" }, actor("head")),
    ]);
    assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
    assert.equal(doc.releaseStatus, "released");
    assert.equal(doc.approvalStatus.head.status, "approved");
});

test("governor reverts reset/recreate head, but cannot act after head or past earlier denial", async () => {
    const doc = request();
    const governor = actor("governor");
    await revertRequestApproval(doc._id, { status: "denied", reason: "Need more review" }, governor);
    assert.equal(doc.approvalStatus.head, undefined);
    await revertRequestApproval(doc._id, { status: "approved", reason: "Review completed" }, governor);
    assert.equal(doc.approvalStatus.head.status, "pending");
    doc.approvalStatus.head.status = "denied";
    await assert.rejects(revertRequestApproval(doc._id, { status: "denied", reason: "Need more review" }, governor), /Head has already acted/);
    doc.approvalStatus.coordinator.status = "denied";
    await assert.rejects(revertRequestApproval(doc._id, { status: "approved", reason: "Review completed" }, actor("head")), /earlier stages/);
});

test("revert rejects pending/same decisions, wrong roles, partial/full release, and a unit missing its reservation", async () => {
    const doc = request();
    await assert.rejects(revertRequestApproval(doc._id, { status: "approved", reason: "Valid reason" }, actor("coordinator")), { statusCode: 403 });
    await assert.rejects(revertRequestApproval(doc._id, { status: "approved", reason: "Valid reason" }, actor("head")), /not been reviewed/);
    doc.approvalStatus.head.status = "denied";
    await assert.rejects(revertRequestApproval(doc._id, { status: "denied", reason: "Valid reason" }, actor("head")), /must differ/);
    for (const releaseStatus of ["partial", "released"]) {
        doc.releaseStatus = releaseStatus;
        await assert.rejects(revertRequestApproval(doc._id, { status: "approved", reason: "Valid reason" }, actor("head")), /released/);
    }
    doc.releaseStatus = "pending";
    doc.approvalStatus.head.status = "approved";
    doc.entityIds = [unit()._id];
    await assert.rejects(revertRequestApproval(doc._id, { status: "denied", reason: "Valid reason" }, actor("head")), /left this request/);
});

test("failed later line and short atomic update roll back ALL reservations", async () => {
    unit(); unit();
    const doc = request({ lines: [{ key: "Tractor", quantity: 2 }, { key: "Pump", quantity: 1 }] });
    await assert.rejects(assignUnitsForRequest(doc), /Only 0 Pump/);
    assert.ok(inventory.every((item) => !item.reservedBy));
    doc.lines = [{ key: "Tractor", quantity: 2 }];
    const write = Equipment.updateMany;
    mock.method(Equipment, "updateMany", async (filter, update) => {
        if (update.$set?.reservedBy) return write({ ...filter, _id: { $in: [inventory[0]._id] } }, update);
        return write(filter, update);
    });
    await assert.rejects(assignUnitsForRequest(doc), /Stock changed/);
    assert.ok(inventory.every((item) => !item.reservedBy));
});

test("two requests competing for stock never double-book a unit", async () => {
    unit(); unit();
    const a = request();
    const b = request();
    const results = await Promise.allSettled([assignUnitsForRequest(a), assignUnitsForRequest(b)]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(new Set(inventory.map((item) => String(item.reservedBy))).size, 1);
});

test("partial release tracks cumulative quantity, cannot revert, and can finish later", async () => {
    unit(); unit();
    const doc = request();
    await updateRequestApproval(doc._id, { status: "approved" }, actor("head"));
    inventory[1].condition = "damaged";
    await releaseRequest(doc._id);
    assert.equal(doc.releaseStatus, "partial");
    assert.equal(doc.releasedIds.length, 1);
    await assert.rejects(revertRequestApproval(doc._id, { status: "denied", reason: "Cancel request" }, actor("head")), /released/);
    inventory[1].condition = "good";
    await releaseRequest(doc._id);
    assert.equal(doc.releaseStatus, "released");
    assert.equal(doc.releasedIds.length, 2);
});

test("availability excludes assigned, reserved, deleted, and blocked units", async () => {
    unit();
    unit("Tractor", { association: oid() });
    unit("Tractor", { reservedBy: oid() });
    unit("Tractor", { condition: "maintenance" });
    unit("Tractor", { deletedAt: new Date() });
    unit("Tractor", { status: "assigned" });
    assert.equal(inventory.filter((doc) => matches(doc, availabilityFilter("equipment"))).length, 1);
    await assert.rejects(validateRequestAvailability("equipment", [{ key: "Tractor", quantity: 2 }]), /Only 1 Tractor available/);
});

test("FAR editing is blocked after any review and cannot cross associations", async () => {
    const association = oid();
    mock.method(Association, "findOne", () => query({ _id: association }));
    const doc = request({ association });
    await assert.rejects(updateRequest(doc._id, { title: "Changed title" }, actor("far")), /cannot be edited/);
    doc.association = oid();
    await assert.rejects(updateRequest(doc._id, { title: "Changed title" }, actor("far")), { statusCode: 403 });
});

test("submission/edit validate stock, save lines, and leave units unbound until head", async () => {
    const association = oid();
    mock.method(Association, "findOne", () => query({ _id: association }));
    unit(); unit();
    mock.method(Request, "create", async (data) => request(data));
    const doc = await createRequest({ title: "Farm tractor", entityType: "equipment", lines: [{ key: "Tractor", quantity: 2 }], details: "Needed before harvest" }, oid());
    assert.equal(doc.entityIds.length, 0);
    assert.ok(inventory.every((item) => !item.reservedBy));
    await updateRequest(doc._id, { lines: [{ key: "Tractor", quantity: 1 }] }, actor("far"));
    assert.equal(doc.lines[0].quantity, 1);
    await assert.rejects(updateRequest(doc._id, { lines: [{ key: "Tractor", quantity: 3 }] }, actor("far")), /Only 2 Tractor available/);
    assert.equal(doc.lines[0].quantity, 1);
});

test("report approval applies each condition separately and legacy reports still apply", async () => {
    const a = unit(); const b = unit();
    const doc = new Report({ title: "Machine inspection", entityType: "equipment", details: "Individual inspection findings", itemIds: [a._id, b._id], items: [
        { item: a._id, condition: "damaged", severity: "high" }, { item: b._id, condition: "excellent", severity: "low" },
    ], approvalStatus: { aew: { status: "pending" } } });
    doc.save = async () => doc;
    mock.method(Report, "findOne", async () => doc);
    await updateReportApproval(doc._id, { status: "approved" }, actor("aew"));
    assert.equal(a.condition, "damaged");
    assert.equal(b.condition, "excellent");
    doc.items = [];
    doc.condition = "maintenance";
    doc.approvalStatus.aew.status = "pending";
    await updateReportApproval(doc._id, { status: "approved" }, actor("aew"));
    assert.equal(b.condition, "maintenance");
});

test("create/update report derive ids and highest severity rather than trusting shared values", async () => {
    const a = unit(); const b = unit();
    const payload = { title: "Machine inspection", entityType: "equipment", details: "Individual inspection findings", items: [
        { itemId: String(a._id), condition: "damaged", severity: "critical" }, { itemId: String(b._id), condition: "good", severity: "low" },
    ], severity: "low", condition: "good" };
    let doc;
    mock.method(Report, "create", async (data) => {
        doc = new Report(data);
        doc.save = async () => doc;
        return doc;
    });
    await createReport(payload, actor("far"));
    assert.equal(doc.severity, "critical");
    assert.deepEqual(doc.itemIds.map(String), [a, b].map((item) => String(item._id)));
    mock.method(Report, "findOne", async () => doc);
    await updateReport(doc._id, { items: [{ itemId: String(a._id), condition: "good", severity: "low" }] });
    assert.equal(doc.severity, "low");
    assert.equal(doc.itemIds.length, 1);
});

test("updated seeders produce valid crop ids, per-item reports, quantity lines, and reachable request stages", async () => {
    mock.method(console, "log", () => {});
    const association = { _id: oid() };
    const farms = Array.from({ length: 12 }, () => ({ _id: oid(), association: association._id, crops: [{ crop: oid() }] }));
    const equipments = Array.from({ length: 12 }, (_, index) => unit(`Equipment ${index + 1}`, { propertyNumber: `EQP-${String(index + 1).padStart(3, "0")}` }));
    const livestocks = Array.from({ length: 13 }, (_, index) => unit(`Animal ${index + 1}`, { condition: "healthy", propertyNumber: `LVS-${String(index + 1).padStart(3, "0")}` }));
    const users = ["coordinator", "head", "governor", "aew"].map(actor);
    mock.method(Report, "create", async (data) => {
        const doc = new Report(data);
        await doc.validate();
        return doc;
    });
    const { reports } = await seedReports({ farms, equipments, livestocks, users });
    assert.ok(reports.filter((doc) => doc.entityType !== "farm").every((doc) => doc.items.length > 0 && !doc.condition));
    for (const doc of reports.filter((entry) => entry.entityType === "farm")) {
        assert.ok(farms.flatMap((farm) => farm.crops.map((entry) => String(entry.crop))).includes(String(doc.itemIds[0])));
    }
    mock.method(Request, "create", async (data) => {
        const doc = request(data);
        await doc.validate();
        return doc;
    });
    const { requests: seeded } = await seedRequests({ equipments, livestocks, associations: [association], users });
    assert.ok(seeded.every((doc) => doc.lines.length > 0));
    assert.ok(seeded.filter((doc) => doc.entityType === "livestock").every((doc) => !doc.approvalStatus.governor));
    assert.ok(seeded.filter((doc) => doc.approvalStatus.coordinator.status !== "approved").every((doc) => !doc.approvalStatus.head && !doc.approvalStatus.governor));
});
