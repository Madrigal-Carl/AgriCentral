import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import mongoose from "mongoose";
import Livestock from "../src/models/livestock.model.js";
import Association from "../src/models/association.model.js";
import { createLivestock, updateLivestock, deleteLivestock, getLivestock } from "../src/services/livestock.service.js";
import { getEligibleLivestockMothers } from "../src/services/livestockLineage.service.js";

const uri = process.env.AGRICENTRAL_TEST_MONGO_URI;

test("real MongoDB replica-set offspring integration", { skip: !uri, timeout: 60000 }, async (t) => {
    // Never uses the URI's existing database: every run owns a fresh random test database.
    const dbName = `agricentral_offspring_test_${randomUUID().replaceAll("-", "")}`;
    await mongoose.connect(uri, { dbName });
    try {
        const hello = await mongoose.connection.db.admin().command({ hello: 1 });
        assert.ok(hello.setName || hello.msg === "isdbgrid", "Integration tests require transaction-capable MongoDB");
        await Promise.all([Livestock.init(), Association.init()]);
        const farUserId = new mongoose.Types.ObjectId();
        const [firstAssociation, secondAssociation] = await Association.create([
            { name: "First Farmers Association", user: farUserId },
            { name: "Second Farmers Association" },
        ]);
        const base = { animal: "Cow", breed: "Angus", gender: "female", birthDate: new Date("2026-01-01"), color: "Brown", weight: 100 };
        const mother = await Livestock.create({ ...base, propertyNumber: "MOTHER", association: secondAssociation._id });
        const male = await Livestock.create({ ...base, propertyNumber: "MALE", gender: "male", association: firstAssociation._id });
        let child;

        await t.test("managers create across ownership; direct children and eligible mothers are correct", async () => {
            child = await createLivestock({ ...base, propertyNumber: "CHILD", associationId: String(firstAssociation._id), mother: String(mother._id) }, undefined, { role: "admin" });
            assert.equal(String(child.mother._id), String(mother._id));
            const eligible = await getEligibleLivestockMothers({ animal: "cow", associationId: String(firstAssociation._id), excludeId: String(child._id) }, { role: "admin" });
            assert.ok(eligible.some((record) => String(record._id) === String(mother._id)));
            assert.ok(!eligible.some((record) => String(record._id) === String(male._id)));
            const details = await getLivestock(mother._id, { role: "admin" });
            assert.deepEqual(details.offspring.map((record) => String(record._id)), [String(child._id)]);
        });

        await t.test("female/type/cycle constraints also protect parent edits", async () => {
            await assert.rejects(updateLivestock(mother._id, { mother: String(child._id) }, { role: "admin" }), /circular ancestry/);
            await assert.rejects(updateLivestock(mother._id, { gender: "male" }, { role: "admin" }), /must remain female/);
            await assert.rejects(updateLivestock(mother._id, { animal: "Goat" }, { role: "admin" }), /same animal type/);
            await assert.rejects(updateLivestock(child._id, { mother: String(male._id) }, { role: "admin" }), /must be female/);
        });

        await t.test("FAR sees only its association and cannot link another association's mother", async () => {
            const actor = { role: "far", _id: farUserId };
            const details = await getLivestock(child._id, actor);
            assert.equal(details.mother, null);
            await assert.rejects(getLivestock(mother._id, actor), /not found/);
            await updateLivestock(child._id, { mother: null }, { role: "admin" });
            await assert.rejects(updateLivestock(child._id, { mother: String(mother._id) }, actor), /same association and assigned farmer/);
            await updateLivestock(child._id, { mother: String(mother._id) }, { role: "admin" });
        });

        await t.test("concurrent opposite ancestry assignments cannot commit a cycle", async () => {
            const [first, second] = await Livestock.create([
                { ...base, propertyNumber: "CONCURRENT-A" },
                { ...base, propertyNumber: "CONCURRENT-B" },
            ]);
            const results = await Promise.allSettled([
                updateLivestock(first._id, { mother: String(second._id) }, { role: "admin" }),
                updateLivestock(second._id, { mother: String(first._id) }, { role: "admin" }),
            ]);
            assert.ok(results.some((result) => result.status === "rejected"));
            const [savedFirst, savedSecond] = await Promise.all([Livestock.findById(first._id), Livestock.findById(second._id)]);
            assert.ok(!(String(savedFirst.mother) === String(second._id) && String(savedSecond.mother) === String(first._id)));
        });

        await t.test("archiving a mother preserves children and atomically clears their links", async () => {
            await deleteLivestock(mother._id);
            const saved = await Livestock.findById(child._id);
            assert.equal(saved.mother, null);
            assert.equal(saved.deletedAt, null);
            assert.deepEqual((await getLivestock(child._id, { role: "admin" })).offspring, []);
            await assert.rejects(createLivestock({ ...base, propertyNumber: "ARCHIVED-PARENT", mother: String(mother._id) }), /archived/);
        });
    } finally {
        assert.ok(mongoose.connection.name.startsWith("agricentral_offspring_test_"));
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    }
});
