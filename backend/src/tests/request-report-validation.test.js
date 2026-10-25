import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { createRequestSchema, updateRequestSchema, revertRequestApprovalSchema } from "../schemas/request.schema.js";
import { createReportSchema, updateReportSchema } from "../schemas/report.schema.js";
import { getReportItems, normalizeReportItems } from "../utils/reportItems.js";
import Report from "../models/report.model.js";
import Request from "../models/request.model.js";
import { canRevertDecision, getRequestLines, getOverallStatus, getDisplayStatus, getCurrentStage, isFullyApproved, formatRequestHistoryMessage } from "../../../frontend/src/utils/request.js";
import { fmtLongDate, fmtRequestedAt } from "../../../frontend/src/utils/format.js";
import { getReportItems as clientItems, getReportSeverity } from "../../../frontend/src/utils/report.js";
import { createRequestFormSchema } from "../../../frontend/src/schemas/request.schema.js";

const id = () => new mongoose.Types.ObjectId().toString();
const requestData = { title: "New tractor", entityType: "equipment", lines: [{ key: "Tractor", quantity: 2 }], details: "Needed for the harvest" };
const reportData = { title: "Tractor damage", entityType: "equipment", details: "Damage found during inspection", items: [{ itemId: id(), condition: "damaged", severity: "high" }] };

test("request lines reject duplicates, fractions, zero, and per-unit-only input", () => {
    assert.equal(createRequestSchema.safeParse(requestData).success, true);
    for (const quantity of [0, -1, 1.5]) assert.equal(createRequestSchema.safeParse({ ...requestData, lines: [{ key: "Tractor", quantity }] }).success, false);
    assert.equal(createRequestSchema.safeParse({ ...requestData, lines: [...requestData.lines, ...requestData.lines] }).success, false);
    assert.equal(createRequestSchema.safeParse({ ...requestData, lines: undefined, entityIds: [id()] }).success, false);
    assert.equal(updateRequestSchema.safeParse({ lines: [] }).success, false);
    assert.equal(updateRequestSchema.safeParse({}).success, false);
    assert.deepEqual(updateRequestSchema.parse({ title: "Updated title" }), { title: "Updated title" });
    const parsed = createRequestSchema.parse({ ...requestData, entityIds: [id()] });
    assert.equal("entityIds" in parsed, false);
});

test("decision-change reason is trimmed and limited to 5–500 characters", () => {
    assert.equal(revertRequestApprovalSchema.safeParse({ status: "approved", reason: "   abc  " }).success, false);
    assert.equal(revertRequestApprovalSchema.safeParse({ status: "pending", reason: "Valid reason" }).success, false);
    assert.equal(revertRequestApprovalSchema.safeParse({ status: "denied", reason: "x".repeat(501) }).success, false);
    assert.equal(revertRequestApprovalSchema.parse({ status: "denied", reason: "  No stock left  " }).reason, "No stock left");
});

test("report validation checks condition per type and identifies individual rows", () => {
    assert.equal(createReportSchema.safeParse(reportData).success, true);
    const invalid = createReportSchema.safeParse({ ...reportData, items: [{ ...reportData.items[0], condition: "healthy" }] });
    assert.equal(invalid.success, false);
    assert.deepEqual(invalid.error.issues[0].path, ["items", 0, "condition"]);
    assert.equal(createReportSchema.safeParse({ ...reportData, items: [...reportData.items, ...reportData.items] }).success, false);
    assert.equal(createReportSchema.safeParse({ ...reportData, items: [] }).success, false);
    assert.equal(createReportSchema.safeParse({ ...reportData, entityType: "livestock", items: [{ itemId: id(), condition: "pregnant" }] }).success, true);
    assert.equal(updateReportSchema.safeParse({ items: [{ itemId: id(), condition: "good" }] }).success, true);
    assert.equal(updateReportSchema.safeParse({}).success, false);
    assert.deepEqual(updateReportSchema.parse({ title: "Updated title" }), { title: "Updated title" });
});

test("farm reports retain shared crop condition/severity and farm requirement", () => {
    const farm = { ...reportData, entityType: "farm", items: undefined, parentId: id(), itemIds: [id()], condition: "growing", severity: "low" };
    assert.equal(createReportSchema.safeParse(farm).success, true);
    assert.equal(createReportSchema.safeParse({ ...farm, parentId: undefined }).success, false);
    assert.equal(normalizeReportItems(farm).severity, "low");
});

test("model derives itemIds and highest report severity; requests can start unbound", async () => {
    const items = [{ itemId: id(), condition: "good", severity: "low" }, { itemId: id(), condition: "damaged", severity: "critical" }];
    const report = new Report(normalizeReportItems({ ...reportData, items }));
    await report.validate();
    assert.deepEqual(report.itemIds.map(String), items.map((item) => item.itemId));
    assert.equal(report.severity, "critical");
    assert.equal(report.condition, undefined);
    const request = new Request(requestData);
    await request.validate();
    assert.deepEqual(request.entityIds, []);
});

test("legacy reports and populated per-item responses render gracefully", () => {
    const itemId = id();
    const legacy = { entityType: "equipment", itemIds: [itemId], condition: "damaged", severity: "high" };
    assert.equal(getReportItems(legacy)[0].condition, "damaged");
    assert.equal(clientItems(legacy)[0].itemId, itemId);
    const current = { ...legacy, items: [{ item: { _id: itemId, name: "Tractor", propertyNumber: "EQP-001" }, condition: "good", severity: "low" }] };
    assert.equal(clientItems(current)[0].name, "Tractor");
    assert.equal(getReportSeverity(current), "low");
});

test("frontend validates live stock on the specific quantity row", () => {
    const schema = createRequestFormSchema({ equipment: [{ name: "Tractor", available: 1 }] });
    const result = schema.safeParse(requestData);
    assert.equal(result.success, false);
    assert.deepEqual(result.error.issues[0].path, ["lines", 0, "quantity"]);
});

test("frontend revert guard includes denied governors without a head stage, but excludes releases", () => {
    const request = { entityType: "equipment", releaseStatus: "pending", approvalStatus: { coordinator: { status: "approved" }, governor: { status: "denied" } } };
    assert.equal(canRevertDecision(request, "governor"), true);
    assert.equal(getOverallStatus(request), "denied");
    request.approvalStatus.governor.status = "approved";
    request.approvalStatus.head = { status: "pending" };
    assert.equal(canRevertDecision(request, "governor"), true);
    request.approvalStatus.head.status = "denied";
    assert.equal(canRevertDecision(request, "governor"), false);
    assert.equal(canRevertDecision(request, "head"), true);
    request.releaseStatus = "partial";
    assert.equal(canRevertDecision(request, "head"), false);
    assert.deepEqual(getRequestLines({ entities: [{ name: "Tractor" }, { name: "Tractor" }] }), [{ key: "Tractor", quantity: 2 }]);
});

test("governor decision changes display approved/denied without completing or bypassing head review", () => {
    const request = { entityType: "equipment", approvalStatus: { coordinator: { status: "approved" }, governor: { status: "denied" } } };
    assert.equal(getDisplayStatus(request, "governor"), "denied");
    request.approvalStatus.governor.status = "approved";
    request.approvalStatus.head = { status: "pending" };
    assert.equal(getDisplayStatus(request, "governor"), "approved");
    assert.equal(getDisplayStatus(request, "head"), "pending");
    assert.equal(getDisplayStatus(request), "pending");
    assert.equal(getCurrentStage(request), "head");
    assert.equal(isFullyApproved(request), false);
    request.approvalStatus.head.status = "approved";
    assert.equal(getDisplayStatus(request, "head"), "approved");
    request.approvalStatus.head.status = "denied";
    assert.equal(getDisplayStatus(request, "head"), "denied");
});

test("request audit dates show Month Day, Year without changing quoted reasons or stored timestamps", () => {
    const timestamp = new Date(2029, 7, 22, 12).toISOString();
    const message = `Governor changed their decision. Reason: "Discussed at ${timestamp}". Previous decision: by Juan Governor at ${timestamp}; remarks: "Noted at ${timestamp}".`;
    assert.equal(fmtLongDate(timestamp), "August 22, 2029");
    assert.equal(formatRequestHistoryMessage(message), `Governor changed their decision. Reason: "Discussed at ${timestamp}". Previous decision: by Juan Governor at August 22, 2029; remarks: "Noted at ${timestamp}".`);
    assert.equal(fmtLongDate("invalid date"), "invalid date");
    assert.equal(fmtLongDate(null), "—");
});

test("requested-at ages use compact minutes, hours, days, and Just now", () => {
    const now = new Date("2029-08-22T12:00:00Z").getTime();
    const ago = (minutes) => new Date(now - minutes * 60000).toISOString();
    assert.equal(fmtRequestedAt(ago(0), now), "Just now");
    assert.equal(fmtRequestedAt(ago(1), now), "1m");
    assert.equal(fmtRequestedAt(ago(49), now), "49m");
    assert.equal(fmtRequestedAt(ago(59), now), "59m");
    assert.equal(fmtRequestedAt(ago(60), now), "1hr");
    assert.equal(fmtRequestedAt(ago(65), now), "1hr");
    assert.equal(fmtRequestedAt(ago(1440), now), "1d");
    assert.equal(fmtRequestedAt(ago(2880), now), "2d");
    assert.equal(fmtRequestedAt(ago(-1), now), "Just now");
    assert.equal(fmtRequestedAt(null, now), "—");
    assert.equal(fmtRequestedAt("invalid date", now), "—");
});
