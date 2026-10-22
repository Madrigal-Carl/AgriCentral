import assert from "node:assert/strict";
import { test } from "node:test";
import Livestock from "../src/models/livestock.model.js";
import Association from "../src/models/association.model.js";
import Farmer from "../src/models/farmer.model.js";
import Log from "../src/models/log.model.js";
import { createLivestockSchema, updateLivestockSchema, getLivestockMothersQuerySchema } from "../src/schemas/livestock.schema.js";
import { createLivestock, updateLivestock, deleteLivestock, getLivestock } from "../src/services/livestock.service.js";
import { validateLivestockLineage, getEligibleLivestockMothers, livestockAccessFilter, lineageChanged, withLivestockLineageTransaction } from "../src/services/livestockLineage.service.js";

const childId = "012345678901234567890101";
const motherId = "012345678901234567890102";
const descendantId = "012345678901234567890103";
const associationId = "012345678901234567890104";
const farmerId = "012345678901234567890105";
const otherAssociationId = "012345678901234567890106";
const payload = { propertyNumber: "LV-CHILD", animal: "Cow", breed: "Angus", gender: "female", birthDate: "2026-01-01", color: "Brown", weight: 100, condition: "healthy" };
const query = (value) => ({
    select() { return this; }, populate() { return this; }, sort() { return this; }, lean() { return this; }, session() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
});
const mother = (extra = {}) => ({ _id: motherId, animal: "Cow", gender: "female", association: associationId, assignedFarmer: null, ancestors: [], ...extra });
const record = (extra = {}) => ({ ...payload, _id: childId, association: associationId, assignedFarmer: null, mother: motherId, ...extra });
const document = (extra = {}) => {
    const doc = new Livestock({ ...payload, _id: childId, association: associationId, __v: 0, ...extra });
    doc.populate = async () => doc;
    return doc;
};
const rejects = (pattern, field = "mother", status = 400) => (error) => pattern.test(error.message) && error.field === field && error.statusCode === status;

function mocks(t, { selectedMother = mother(), offspring = false } = {}) {
    t.mock.method(Livestock, "aggregate", () => query(selectedMother ? [selectedMother] : []));
    t.mock.method(Livestock, "exists", async () => offspring ? { _id: descendantId } : null);
    t.mock.method(Livestock, "updateMany", async () => ({ modifiedCount: 1 }));
    t.mock.method(Log, "create", async () => ({}));
    t.mock.method(Association, "findById", () => query({ name: "Association" }));
    t.mock.method(Livestock.db, "transaction", async (callback) => callback({ transaction: true }));
}

test("legacy documents and payloads need no migration or mother", async () => {
    const doc = document({ mother: undefined });
    await doc.validate();
    assert.equal(doc.mother, null);
    assert.ok(Livestock.schema.indexes().some(([keys]) => keys.mother === 1 && keys.deletedAt === 1));
    assert.equal(createLivestockSchema.safeParse(payload).success, true);
    assert.equal(createLivestockSchema.safeParse({ ...payload, mother: null }).success, true);
    assert.equal(createLivestockSchema.safeParse({ ...payload, mother: motherId }).success, true);
    assert.equal(createLivestockSchema.safeParse({ ...payload, mother: "invalid" }).success, false);
    assert.deepEqual(updateLivestockSchema.parse({ mother: null }), { mother: null });
    assert.equal(Object.hasOwn(updateLivestockSchema.parse({ condition: "healthy" }), "mother"), false);
});

test("mother lookup validates animal, scope, and exclusion query inputs", () => {
    assert.equal(getLivestockMothersQuerySchema.safeParse({ animal: "Cow", associationId, assignedFarmer: farmerId, excludeId: childId }).success, true);
    assert.equal(getLivestockMothersQuerySchema.safeParse({ animal: "" }).success, false);
    assert.equal(getLivestockMothersQuerySchema.safeParse({ animal: "Cow", excludeId: "invalid" }).success, false);
});

test("valid female mother matches animal type case-insensitively and exact ownership", async (t) => {
    mocks(t);
    await validateLivestockLineage(childId, record({ animal: " cow " }));
});

for (const [label, selectedMother, message] of [
    ["missing or archived mother", null, /not found or has been archived/],
    ["male mother", mother({ gender: "male" }), /must be female/],
    ["different animal type", mother({ animal: "Goat" }), /same animal type/],
    ["other association", mother({ association: otherAssociationId }), /same association and assigned farmer/],
    ["other assigned farmer", mother({ assignedFarmer: farmerId }), /same association and assigned farmer/],
    ["circular ancestry", mother({ ancestors: [{ _id: childId }] }), /circular ancestry/],
    ["already-cyclic ancestry", mother({ ancestors: [{ _id: motherId }] }), /circular ancestry/],
]) {
    test(`rejects ${label}`, async (t) => {
        mocks(t, { selectedMother });
        await assert.rejects(validateLivestockLineage(childId, record(), undefined, true), rejects(message));
    });
}

test("self-reference is rejected without querying ancestors", async (t) => {
    const aggregate = t.mock.method(Livestock, "aggregate", () => { throw new Error("Unexpected database access"); });
    await assert.rejects(validateLivestockLineage(childId, record({ mother: childId })), rejects(/own mother/));
    await assert.rejects(validateLivestockLineage("ABCDEFABCDEFABCDEFABCDEF", record({ mother: "abcdefabcdefabcdefabcdef" })), rejects(/own mother/));
    assert.equal(aggregate.mock.callCount(), 0);
});

test("transaction validation locks every inspected ancestor against concurrent graph changes", async (t) => {
    mocks(t, { selectedMother: mother({ ancestors: [{ _id: descendantId }] }) });
    const session = {};
    await validateLivestockLineage(childId, record(), session);
    const [filter, update, options] = Livestock.updateMany.mock.calls[0].arguments;
    assert.deepEqual(filter._id.$in.map(String), [motherId, descendantId]);
    assert.deepEqual(update, { $inc: { __v: 1 } });
    assert.equal(options.session, session);
});

test("a mother cannot become male while active offspring reference it", async (t) => {
    mocks(t, { offspring: true });
    await assert.rejects(validateLivestockLineage(childId, record({ gender: "male", mother: null })), rejects(/must remain female/, "gender"));
});

test("a mother's type cannot invalidate active offspring", async (t) => {
    mocks(t, { offspring: true });
    await assert.rejects(validateLivestockLineage(childId, record({ animal: "Goat", mother: null })), rejects(/Offspring must keep the same animal type/, "animal"));
    const [filter] = Livestock.exists.mock.calls[0].arguments;
    assert.equal(String(filter.mother), childId);
    assert.equal(filter.deletedAt, null);
    assert.equal(filter.animal.$not.test("Goat"), true);
    assert.equal(filter.animal.$not.test("Cow"), false);
});

test("motherless creation keeps the existing create path", async (t) => {
    mocks(t);
    t.mock.method(Livestock, "findOne", () => query(null));
    t.mock.method(Livestock, "create", async (value) => document(value));
    const created = await createLivestock({ ...payload, associationId, mother: null });
    assert.equal(created.mother, null);
    assert.equal(Livestock.db.transaction.mock.callCount(), 0);
});

test("creation with a mother validates and writes in the same transaction", async (t) => {
    mocks(t);
    t.mock.method(Livestock, "findOne", () => query(null));
    t.mock.method(Livestock, "create", async ([value], options) => {
        assert.ok(options.session);
        return [document(value)];
    });
    const created = await createLivestock({ ...payload, associationId, mother: motherId });
    assert.equal(String(created.mother), motherId);
    assert.equal(created.$session(), null);
    assert.equal(Livestock.db.transaction.mock.callCount(), 1);
});

for (const [label, previousMother, nextMother] of [["assign", null, motherId], ["change", descendantId, motherId], ["remove", motherId, null]]) {
    test(`edit can ${label} a mother association`, async (t) => {
        mocks(t);
        const previous = document({ mother: previousMother });
        t.mock.method(Livestock, "findOne", () => query(previous));
        let written;
        t.mock.method(Livestock, "findOneAndUpdate", (filter, update, options) => {
            written = update;
            assert.ok(options.session);
            return query(document({ ...previous.toObject(), ...update.$set }));
        });
        const updated = await updateLivestock(childId, { mother: nextMother });
        assert.equal(written.$set.mother, nextMother);
        assert.equal(String(updated.mother ?? ""), String(nextMother ?? ""));
    });
}

test("changing animal type with an incompatible retained mother is rejected", async (t) => {
    mocks(t);
    t.mock.method(Livestock, "findOne", () => query(document({ mother: motherId })));
    await assert.rejects(updateLivestock(childId, { animal: "Goat" }), rejects(/same animal type/));
});

test("stale ancestry updates fail instead of overwriting a concurrent change", async (t) => {
    mocks(t);
    let reads = 0;
    t.mock.method(Livestock, "findOne", () => query(document({ __v: reads++ })));
    await assert.rejects(updateLivestock(childId, { mother: motherId }), rejects(/changed; refresh/, "mother", 409));
});

test("FAR cannot read or edit a record outside its association", async (t) => {
    mocks(t);
    const actor = { role: "far", _id: farmerId };
    t.mock.method(Association, "findOne", () => query({ _id: associationId }));
    t.mock.method(Livestock, "findOne", (filter) => {
        assert.equal(String(filter.association), associationId);
        return query(null);
    });
    await assert.rejects(getLivestock(childId, actor), rejects(/not found/, "mother", 404));
    await assert.rejects(updateLivestock(childId, { mother: motherId }, actor), rejects(/not found/, "mother", 404));
    assert.deepEqual(await livestockAccessFilter({ role: "admin" }), {});
});

test("FAR cannot override association ownership or assign another association's farmer", async (t) => {
    mocks(t);
    t.mock.method(Association, "findOne", () => query({ _id: associationId }));
    t.mock.method(Livestock, "findOne", () => query(document()));
    const actor = { role: "far", _id: farmerId };
    await assert.rejects(updateLivestock(childId, { associationId: otherAssociationId }, actor), rejects(/outside your association/, "associationId", 403));
    t.mock.method(Farmer, "exists", async () => null);
    await assert.rejects(updateLivestock(childId, { assignedFarmer: farmerId }, actor), rejects(/Assigned farmer must belong/, "assignedFarmer"));
});

test("eligible mothers exclude the edited record, all descendants, archived/male/different-type and other-owner records", async (t) => {
    mocks(t);
    t.mock.method(Association, "findOne", () => query({ _id: associationId }));
    t.mock.method(Livestock, "findOne", () => query(document({ assignedFarmer: farmerId })));
    t.mock.method(Livestock, "aggregate", () => query([{ descendants: [{ _id: descendantId }] }]));
    let filter;
    t.mock.method(Livestock, "find", (value) => { filter = value; return query([mother()]); });
    const result = await getEligibleLivestockMothers({ animal: "Cow", associationId: otherAssociationId, excludeId: childId }, { role: "far", _id: farmerId });
    assert.equal(result.length, 1);
    assert.equal(filter.gender, "female");
    assert.equal(filter.deletedAt, null);
    assert.equal(filter.association, associationId);
    assert.equal(String(filter.assignedFarmer), farmerId);
    assert.equal(filter.animal.test("cow"), true);
    assert.equal(filter.animal.test("Cow (other)"), false);
    assert.deepEqual(filter._id.$nin.map(String), [childId, descendantId]);
});

test("non-FAR mother lookup ignores association/farmer filters; no matches is an empty list", async (t) => {
    t.mock.method(Livestock, "find", (filter) => {
        assert.equal(Object.hasOwn(filter, "association"), false);
        assert.equal(Object.hasOwn(filter, "assignedFarmer"), false);
        return query([]);
    });
    for (const role of ["admin", "coordinator", "aew", "head"]) {
        assert.deepEqual(await getEligibleLivestockMothers({ animal: "Goat", associationId, assignedFarmer: farmerId }, { role }), []);
    }
});

test("archiving a mother nulls every direct child's reference without deleting offspring", async (t) => {
    mocks(t);
    t.mock.method(Livestock, "findOneAndUpdate", (filter, update, options) => {
        assert.ok(update.$set.deletedAt instanceof Date);
        assert.equal(update.$set.mother, null);
        assert.ok(options.session);
        return query(document({ _id: motherId, ...update.$set }));
    });
    await deleteLivestock(motherId);
    const [filter, update, options] = Livestock.updateMany.mock.calls[0].arguments;
    assert.deepEqual(filter, { mother: motherId });
    assert.equal(update.$set.mother, null);
    assert.equal(Object.hasOwn(update.$set, "deletedAt"), false);
    assert.ok(options.session);
});

test("details fetch direct active offspring in one query, not grandchildren", async (t) => {
    t.mock.method(Livestock, "findOne", () => query(document({ _id: motherId })));
    t.mock.method(Log, "find", () => query([]));
    t.mock.method(Livestock, "find", (filter) => {
        assert.deepEqual(filter, { mother: motherId, deletedAt: null });
        return query([record({ mother: motherId })]);
    });
    const details = await getLivestock(motherId, { role: "admin" });
    assert.equal(details.offspring.length, 1);
    assert.equal(details.offspring[0].status, "assigned");
    assert.equal(Livestock.find.mock.callCount(), 1);
});

test("details with no offspring returns an empty array", async (t) => {
    t.mock.method(Livestock, "findOne", () => query(document()));
    t.mock.method(Log, "find", () => query([]));
    t.mock.method(Livestock, "find", () => query([]));
    assert.deepEqual((await getLivestock(childId)).offspring, []);
});

test("management roles may link mothers across associations and assigned farmers", async (t) => {
    mocks(t);
    await validateLivestockLineage(childId, record({ association: otherAssociationId, assignedFarmer: farmerId }));
    t.mock.method(Livestock, "findOne", () => query(document({ association: otherAssociationId })));
    t.mock.method(Livestock, "findOneAndUpdate", (filter, update) => query(document({ association: otherAssociationId, ...update.$set })));
    const updated = await updateLivestock(childId, { mother: motherId }, { role: "admin" });
    assert.equal(String(updated.mother), motherId);
    assert.equal(String(updated.association), otherAssociationId);
});

test("ownership transfers retain biological mother links for management roles", async (t) => {
    mocks(t);
    t.mock.method(Livestock, "findOne", () => query(document({ mother: motherId })));
    t.mock.method(Livestock, "findOneAndUpdate", (filter, update) => query(document({ mother: motherId, ...update.$set })));
    const result = await updateLivestock(childId, { associationId: otherAssociationId }, { role: "admin" });
    assert.equal(String(result.mother), motherId);
    assert.equal(String(result.association), otherAssociationId);
    assert.equal(Livestock.db.transaction.mock.callCount(), 0);
});

test("FAR writes cannot bypass mother ownership scope with a guessed mother id", async (t) => {
    mocks(t, { selectedMother: mother({ association: otherAssociationId }) });
    t.mock.method(Association, "findOne", () => query({ _id: associationId }));
    t.mock.method(Livestock, "findOne", () => query(document()));
    await assert.rejects(updateLivestock(childId, { mother: motherId }, { role: "far", _id: farmerId }), rejects(/same association and assigned farmer/));
});

test("FAR detail mother population and offspring query do not expose another association", async (t) => {
    mocks(t);
    t.mock.method(Association, "findOne", () => query({ _id: associationId }));
    let populated;
    t.mock.method(Livestock, "findOne", () => ({
        populate(options) { populated = options; return Promise.resolve(document()); },
    }));
    t.mock.method(Log, "find", () => query([]));
    t.mock.method(Livestock, "find", (filter) => {
        assert.equal(String(filter.association), associationId);
        return query([]);
    });
    await getLivestock(childId, { role: "far", _id: farmerId });
    const motherPopulation = populated.find((option) => option.path === "mother");
    assert.equal(String(motherPopulation.match.association), associationId);
    assert.equal(motherPopulation.match.deletedAt, null);
});

test("lineage change detection preserves unrelated updates and normalized type labels", () => {
    const previous = record();
    assert.equal(lineageChanged(previous, { condition: "sick" }), false);
    assert.equal(lineageChanged(previous, { animal: " cow " }), false);
    assert.equal(lineageChanged(previous, { mother: motherId }), false);
    assert.equal(lineageChanged(previous, { mother: null }), true);
    assert.equal(lineageChanged(previous, { associationId: otherAssociationId }), false);
});

test("transactions use snapshot/majority settings and fail clearly on standalone MongoDB", async (t) => {
    t.mock.method(Livestock.db, "transaction", async (callback, options) => {
        assert.deepEqual(options, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
        const error = new Error("Transaction numbers are only allowed on a replica set member or mongos");
        error.code = 20;
        throw error;
    });
    await assert.rejects(withLivestockLineageTransaction(async () => {}), rejects(/replica-set transaction support/, "mother", 503));
});
