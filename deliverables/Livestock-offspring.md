# Livestock Offspring Tracking

Implemented in the existing livestock Add/Edit forms, APIs, and details drawer. Full contents of all 17 changed/new code files follow this implementation guide.

## Model and database compatibility

- Added nullable mother: ObjectId with ref: Livestock and default: null. Direct offspring are the inverse query, not a second stored array.
- Added a non-unique { mother: 1, deletedAt: 1 } index for direct offspring and descendant traversal. Existing documents remain valid, including documents with no mother field.
- No SQL migrations, document backfill, collection recreation, database reset, or production database operations were performed. Mongoose applies the schema index using the project's normal auto-index behavior; deployments disabling autoIndex must provision this index during deployment.
- References are enforced by application services because MongoDB does not provide SQL-style foreign keys. Archival transactionally sets direct children's mother to null, including archived children, without archiving/deleting those children. The archived record's own mother link is also cleared.

## Role scope: latest clarification applied

- FAR: mother candidates must be in the authenticated FAR's association and the same assigned-farmer scope. With excludeId, the farmer scope is derived from the actual edited record rather than trusting an override. New mother assignments enforce the same rule server-side. A FAR cannot fetch/update another association's record or change livestock association ownership.
- Other existing permitted roles: eligible mothers are not filtered by association or assigned farmer, even if these query parameters are supplied. Managers can establish relationships across ownership scopes. No new roles were granted access to existing livestock APIs or full Add/Edit forms.
- Female gender, matching animal type, active/non-archived mother, self-reference protection, and cycle prevention apply to everyone. Matching uses trimmed, case-insensitive animal values, not hardcoded animal categories.
- Biological links persist through ownership transfers. FAR detail/list population hides mothers and offspring outside its normal association visibility; permitted management roles can see cross-ownership relationships. Request releases retain existing behavior, with a livestock version increment so lineage transactions can detect concurrent record changes.

## API changes and responsibility

- Existing POST /livestocks and PATCH /livestocks/:id accept mother as a valid ObjectId string or null. Omitting mother retains PATCH behavior; existing clients are not required to send a new field.
- GET /livestocks/mothers?animal=...&excludeId=... dynamically returns eligible candidates in the existing { message, livestocks } response shape. Association/farmer query options only affect FAR. All descendants and the current record are excluded with one graph traversal rather than one lookup per candidate.
- GET /livestocks/:id returns { message, livestock } including the populated mother (or null), direct active offspring, existing assignment/association data, and history. It was necessary because no single-record livestock GET endpoint existed.
- Existing list responses now populate visible mother metadata for edit prepopulation. Offspring are fetched only for the requested detail record in a single indexed query.
- Schemas/validators validate incoming IDs/query values; livestockLineage.service.js implements scope, graph checks, and transaction options; livestock.service.js keeps existing CRUD/log/status handling; controllers/routes retain existing authentication/role conventions. Errors add an optional field for inline frontend error placement without changing prior response fields.

## Forms and details

- Add and Edit reuse Field and FullSelect for Offspring (No/Yes). Yes reveals the existing searchable SingleSelect for Select Mother. No hides it and saves mother: null. Existing relationships are prepopulated.
- Changing animal type refreshes candidates and clears the selected mother; a successful refetch also clears a mother that has become ineligible. Loading, empty, retry, and field-error states reuse existing page/component patterns. Association changes do not clear/restrict mother selection for management roles.
- The existing drawer adds a mother link and an Offspring section only when direct offspring exist. Cards reuse current livestock card/status styles and show property number, animal, gender, breed, the existing date, and status. Grandchildren are not included in a mother's direct offspring list.
- Clicking a mother/offspring uses the current role's existing /livestocks page with ?livestock=<id>, opening the same drawer. Direct links, browser Back/Forward, and records outside the current table page work without a duplicate livestock page or management flow.
- Mutations invalidate all livestock query keys, updating mother candidates, list records, and parent/child detail caches after create, reparent, unlink, update, and archive.

## Integrity and deployment prerequisite

**MongoDB replica-set transactions are required** for relationship-changing writes, type/gender changes, archival, and restore. Atlas normally satisfies this requirement. A standalone mongod is insufficient for these operations; the API returns a clear 503 deployment-prerequisite error rather than silently weakening integrity. Motherless creation and ordinary health/status/ownership updates keep their normal non-lineage write path.

- Transactions use snapshot reads and majority writes. They bulk-touch inspected ancestors and increment document versions so concurrent ancestry edits conflict/retry rather than introducing a cycle through write skew. Stale record updates return a clear 409.
- Self references (including differently cased ObjectId strings), direct/indirect cycles, missing/archived mothers, male mothers, and mismatched animal types are rejected.
- A mother with active offspring cannot become male or change to an incompatible animal type; users must unlink those offspring first. Ownership changes do not invalidate biological relationships.
- Archival and reference clearing are atomic. Restore validates any retained relationship before saving.

## Verification

- Frontend npm run build: passed.
- Frontend npm run lint: **32 existing errors, 8 existing warnings**; no new lint findings from this feature.
- **60 tests passed, 1 live-MongoDB suite skipped** across the existing regression suite and new offspring tests. The skipped suite requires an explicitly supplied test replica-set URI; it includes actual graph queries, cross-role scope checks, concurrent opposite assignments, and archival cleanup. No live database was configured or modified for this run.
- Browser checks with mocked API responses passed: Add/Edit controls, successful offspring POST, edit prepopulation, enabled mother requirement, type refresh/selection clearing, empty candidates, changing/removing a mother, management requests without ownership filters, direct-offspring-only cards, child links/deep-linked drawers, no-offspring section hiding, and no page errors.
- Backend syntax checks and git diff --check passed. No package dependencies, CSS files, Tailwind configuration, tokens, or visual variants were changed.

### Run tests

From backend/:

```powershell
node --experimental-test-module-mocks --test test/requested-updates.test.js test/livestock-offspring.test.js test/livestock-offspring.integration.test.js
```

To run the real database suite, point this variable at a **dedicated test replica set**, not production:

```powershell
$env:AGRICENTRAL_TEST_MONGO_URI = 'mongodb://localhost:27017/?replicaSet=rs0'
node --test test/livestock-offspring.integration.test.js
```

The integration suite always creates its own random agricentral_offspring_test_* database and drops only that database during cleanup; it does not use or reset the URI's existing database.

## Assumptions and styling

- Offspring is a Yes/No FullSelect instead of a new checkbox/switch design because there is no existing checkbox/switch pattern in this app. Mother presence is authoritative in MongoDB; isOffspring is form-only state.
- The existing birthDate field remains labeled Release Date, as previously requested. Its value is displayed without introducing a second date field or inferring an age.
- Existing styling/class values and unrelated layouts were preserved. Only the requested new form fields, mother/detail links, offspring section, loading/errors, and URL-driven drawer state were added using existing components and class patterns.

## New files

- backend/src/services/livestockLineage.service.js
- backend/test/livestock-offspring.test.js
- backend/test/livestock-offspring.integration.test.js
- deliverables/Livestock-offspring.md (this guide and full-file deliverable)

## Database model

### backend/src/models/livestock.model.js

````js
import mongoose from "mongoose";

const livestockSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        propertyNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        animal: {
            type: String,
            required: true,
            trim: true,
        },
        breed: {
            type: String,
            required: true,
            trim: true,
        },
        gender: {
            type: String,
            enum: [
                "male",
                "female",
            ],
            required: true,
        },
        birthDate: {
            type: Date,
            required: true,
        },
        color: {
            type: String,
            required: true,
            trim: true,
        },
        weight: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        condition: {
            type: String,
            enum: [
                "healthy",
                "pregnant",
                "sick",
                "injured",
                "deceased",
            ],
            default: "healthy",
        },
        deceasedAt: { type: Date, default: null },
        status: {
            type: String,
            enum: [
                "assigned",
                "available",
            ],
            default: "available",
        },
        assignedFarmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmer",
        },
        mother: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Livestock",
            default: null,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        reservedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Request",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

livestockSchema.pre("validate", function () {
    this.status = this.association ? "assigned" : "available";
    this.deceasedAt = this.condition === "deceased" ? this.deceasedAt ?? new Date() : null;
});

livestockSchema.index(
    { mother: 1, deletedAt: 1 }
);

livestockSchema.index(
    { propertyNumber: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

export default mongoose.model("Livestock", livestockSchema);
````

## Backend validation, authorization, APIs, and integrity

### backend/src/schemas/livestock.schema.js

````js
import { z } from "zod";
import { BLOCKED_CONDITIONS } from "../utils/assignment.js";

const CONDITIONS = ["healthy", "pregnant", "sick", "injured", "deceased"];
const STATUSES = ["assigned", "available"];
const GENDERS = ["male", "female"];

const objectId = (message) =>
    z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const createLivestockSchema = z
    .object({
        associationId: objectId("Invalid association id").optional(),
        propertyNumber: z
            .string({ required_error: "Property number is required" })
            .trim()
            .min(1, "Property number is required")
            .max(30, "Property number must not exceed 30 characters")
            .toUpperCase(),
        animal: z
            .string({ required_error: "Animal is required" })
            .trim()
            .min(2, "Animal must be at least 2 characters")
            .max(100, "Animal must not exceed 100 characters"),
        breed: z
            .string({ required_error: "Breed is required" })
            .trim()
            .min(2, "Breed must be at least 2 characters")
            .max(100, "Breed must not exceed 100 characters"),
        gender: z.enum(GENDERS, { required_error: "Gender is required" }),
        birthDate: z.coerce.date({ error: "Invalid release date" }),
        color: z
            .string({ required_error: "Color is required" })
            .trim()
            .min(1, "Color is required")
            .max(50, "Color must not exceed 50 characters"),
        weight: z.coerce
            .number({ required_error: "Weight is required" })
            .min(0, "Weight must not be negative")
            .default(0),
        condition: z.enum(CONDITIONS).optional().default("healthy"),
        status: z.enum(STATUSES).optional().default("available"),
        assignedFarmer: objectId("Invalid farmer id").optional(),
        mother: objectId("Invalid mother id").nullable().optional(),
    })
    .refine((data) => !(data.associationId || data.assignedFarmer) || !BLOCKED_CONDITIONS.livestock.includes(data.condition), {
        message: "Not assignable: livestock is deceased, injured, or sick",
        path: ["associationId"],
    });

export const updateLivestockSchema = z
    .object({
        associationId: objectId("Invalid association id").nullable().optional(),
        propertyNumber: z
            .string()
            .trim()
            .min(1, "Property number is required")
            .max(30, "Property number must not exceed 30 characters")
            .toUpperCase()
            .optional(),
        animal: z
            .string()
            .trim()
            .min(2, "Animal must be at least 2 characters")
            .max(100, "Animal must not exceed 100 characters")
            .optional(),
        breed: z
            .string()
            .trim()
            .min(2, "Breed must be at least 2 characters")
            .max(100, "Breed must not exceed 100 characters")
            .optional(),
        gender: z.enum(GENDERS).optional(),
        birthDate: z.coerce.date({ error: "Invalid release date" }).optional(),
        color: z
            .string()
            .trim()
            .min(1, "Color is required")
            .max(50, "Color must not exceed 50 characters")
            .optional(),
        weight: z.coerce.number().min(0, "Weight must not be negative").optional(),
        condition: z.enum(CONDITIONS).optional(),
        status: z.enum(STATUSES).optional(),
        // null clears the assignment (return to available); a string
        // assigns/reassigns; omitted leaves it untouched.
        assignedFarmer: objectId("Invalid farmer id").nullable().optional(),
        mother: objectId("Invalid mother id").nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const livestockIdParamSchema = z.object({
    id: objectId("Invalid livestock id"),
});

export const getLivestocksQuerySchema = z.object({
    condition: z.enum(CONDITIONS).optional(),
    status: z.enum(STATUSES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    associationId: objectId("Invalid association id").optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});

export const getLivestockMothersQuerySchema = z.object({
    animal: z.string().trim().min(2, "Enter an animal type").max(100),
    associationId: objectId("Invalid association id").optional(),
    assignedFarmer: objectId("Invalid farmer id").optional(),
    excludeId: objectId("Invalid livestock id").optional(),
});
````

### backend/src/validators/livestock.validator.js

````js
import {
    createLivestockSchema,
    updateLivestockSchema,
    livestockIdParamSchema,
    getLivestocksQuerySchema,
    getLivestockMothersQuerySchema,
} from "../schemas/livestock.schema.js";

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation error",
            errors: result.error.issues,
        });
    }

    req.body = result.data;
    next();
};

const validateParams = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation error",
            errors: result.error.issues,
        });
    }

    req.params = result.data;
    next();
};

const validateQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation error",
            errors: result.error.issues,
        });
    }

    Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
    });

    next();
};

export const validateCreateLivestock = validate(createLivestockSchema);
export const validateUpdateLivestock = validate(updateLivestockSchema);
export const validateLivestockIdParam = validateParams(livestockIdParamSchema);
export const validateGetLivestocksQuery = validateQuery(getLivestocksQuerySchema);
export const validateGetLivestockMothersQuery = validateQuery(getLivestockMothersQuerySchema);
````

### backend/src/services/livestockLineage.service.js

````js
import mongoose from "mongoose";
import Livestock from "../models/livestock.model.js";
import Association from "../models/association.model.js";

export const LIVESTOCK_RELATION_FIELDS = "propertyNumber animal gender breed birthDate condition status association assignedFarmer mother";
export const MOTHER_POPULATE = { path: "mother", match: { deletedAt: null }, select: LIVESTOCK_RELATION_FIELDS };
const idString = (value) => String(value?._id ?? value ?? "").toLowerCase();
const sameAnimal = (first, second) => first?.trim().toLowerCase() === second?.trim().toLowerCase();
const animalPattern = (animal) => new RegExp(`^${animal.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

export function lineageError(message, field = "mother", statusCode = 400) {
    const error = new Error(message);
    error.field = field;
    error.statusCode = statusCode;
    return error;
}

export async function withLivestockLineageTransaction(operation) {
    try {
        return await Livestock.db.transaction(operation, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
    } catch (error) {
        if (error.code === 20 && /transaction/i.test(error.message)) {
            throw lineageError("Livestock offspring updates require MongoDB replica-set transaction support", "mother", 503);
        }
        throw error;
    }
}

export async function livestockAccessFilter(actingUser) {
    if (actingUser?.role !== "far") return {};
    const association = await Association.findOne({ user: actingUser._id, deletedAt: null }).select("_id");
    return { association: association?._id ?? new mongoose.Types.ObjectId("000000000000000000000000") };
}

export function lineageChanged(previous, data) {
    return (data.mother !== undefined && idString(data.mother) !== idString(previous.mother)) ||
        (data.gender !== undefined && data.gender !== previous.gender) ||
        (data.animal !== undefined && !sameAnimal(data.animal, previous.animal));
}

export async function validateLivestockLineage(id, record, session, enforceMotherScope = false) {
    const options = session ? { session } : {};
    if (record.mother) {
        if (idString(record.mother) === idString(id)) throw lineageError("Livestock cannot be its own mother");
        const pipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(idString(record.mother)), deletedAt: null } },
            { $graphLookup: {
                from: Livestock.collection.name,
                startWith: "$mother",
                connectFromField: "mother",
                connectToField: "_id",
                as: "ancestors",
                restrictSearchWithMatch: { deletedAt: null },
            } },
            { $project: { gender: 1, animal: 1, association: 1, assignedFarmer: 1, "ancestors._id": 1 } },
        ];
        const aggregation = Livestock.aggregate(pipeline);
        if (session) aggregation.session(session);
        const [mother] = await aggregation;
        if (!mother) throw lineageError("Selected mother was not found or has been archived");
        if (mother.gender !== "female") throw lineageError("Selected mother must be female");
        if (!sameAnimal(mother.animal, record.animal)) throw lineageError("Selected mother must have the same animal type");
        if (enforceMotherScope && (idString(mother.association) !== idString(record.association) || idString(mother.assignedFarmer) !== idString(record.assignedFarmer))) {
            throw lineageError("Selected mother must belong to the same association and assigned farmer");
        }
        if (mother.ancestors.some((ancestor) => idString(ancestor) === idString(id) || idString(ancestor) === idString(mother._id))) {
            throw lineageError("Selected mother would create a circular ancestry relationship");
        }
        // Writing all inspected ancestors makes concurrent graph edits conflict and retry.
        if (session) await Livestock.updateMany(
            { _id: { $in: [mother._id, ...mother.ancestors.map((ancestor) => ancestor._id)] } },
            { $inc: { __v: 1 } },
            options,
        );
    }
    if (!id) return;
    const childFilter = { mother: id, deletedAt: null };
    if (record.gender !== "female") {
        if (await Livestock.exists(childFilter, options)) throw lineageError("A mother with offspring must remain female; remove the offspring links first", "gender");
    } else {
        const incompatible = await Livestock.exists({
            ...childFilter,
            animal: { $not: animalPattern(record.animal) },
        }, options);
        if (incompatible) throw lineageError("Offspring must keep the same animal type as their mother; remove the offspring links first", "animal");
    }
}

export async function getEligibleLivestockMothers({ animal, assignedFarmer, excludeId }, actingUser) {
    const access = await livestockAccessFilter(actingUser);
    if (excludeId) {
        const current = await Livestock.findOne({ _id: excludeId, deletedAt: null, ...access }).select("assignedFarmer");
        if (!current) throw lineageError("Livestock not found", "mother", 404);
        if (actingUser?.role === "far") assignedFarmer = current.assignedFarmer ?? null;
    }
    const filter = {
        deletedAt: null,
        animal: animalPattern(animal),
        gender: "female",
        ...access,
        ...(actingUser?.role === "far" ? { assignedFarmer: assignedFarmer ?? null } : {}),
    };
    if (excludeId) {
        const [record] = await Livestock.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(excludeId), deletedAt: null } },
            { $graphLookup: {
                from: Livestock.collection.name,
                startWith: "$_id",
                connectFromField: "_id",
                connectToField: "mother",
                as: "descendants",
                restrictSearchWithMatch: { deletedAt: null },
            } },
            { $project: { "descendants._id": 1 } },
        ]);
        filter._id = { $nin: [new mongoose.Types.ObjectId(excludeId), ...(record?.descendants ?? []).map((child) => child._id)] };
    }
    return Livestock.find(filter).select(LIVESTOCK_RELATION_FIELDS).sort({ propertyNumber: 1 }).lean();
}
````

### backend/src/services/livestock.service.js

````js
import Livestock from "../models/livestock.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities } from "./log.service.js";
import { assertAssignable } from "../utils/assignment.js";
import { LIVESTOCK_RELATION_FIELDS, MOTHER_POPULATE, livestockAccessFilter, lineageChanged, lineageError, validateLivestockLineage, withLivestockLineageTransaction } from "./livestockLineage.service.js";

const ASSOCIATION_POPULATE = { path: "association", select: "name" };

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const association = await Association.findOne({
        user: authenticatedUserId,
        deletedAt: null,
    }).select("_id");

    return association?._id ?? undefined;
};

export const createLivestock = async (data, authenticatedUserId, actingUser) => {
    const { associationId, ...livestockData } = data;

    const existing = await Livestock.findOne({ propertyNumber: livestockData.propertyNumber, deletedAt: null });

    if (existing) {
        const error = new Error("Property number is already in use");
        error.statusCode = 409;
        throw error;
    }

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    if (resolvedAssociationId || livestockData.assignedFarmer) assertAssignable("livestock", livestockData.condition);
    const record = {
        ...livestockData,
        association: resolvedAssociationId || undefined,
        status: resolvedAssociationId ? "assigned" : "available",
        deceasedAt: livestockData.condition === "deceased" ? new Date() : null,
    };
    const livestock = record.mother
        ? await withLivestockLineageTransaction(async (session) => {
            await validateLivestockLineage(null, record, session, actingUser?.role === "far");
            const [created] = await Livestock.create([record], { session });
            return created;
        })
        : await Livestock.create(record);
    if (record.mother) livestock.$session(null);

    await createLog({
        entityType: "livestock",
        entityId: livestock._id,
        association: livestock.association,
        message: `${livestock.animal} (${livestock.propertyNumber}) has been added to the livestock inventory.`,
    });

    if (livestock.association) {
        const association = await Association.findById(livestock.association).select("name");

        await createLog({
            entityType: "livestock",
            entityId: livestock._id,
            association: livestock.association,
            message: `${livestock.animal} (${livestock.propertyNumber}) has been assigned to ${association?.name ?? "an association"}.`,
        });
    }

    if (livestock.assignedFarmer) {
        const farmer = await Farmer.findById(livestock.assignedFarmer).select("firstName lastName");
        const farmerName = farmer?.getFullName() ?? "a farmer";

        await createLog({
            entityType: "livestock",
            entityId: livestock._id,
            association: livestock.association,
            message: `${livestock.animal} (${livestock.propertyNumber}) has been assigned to ${farmerName}.`,
        });

        await createLog({
            entityType: "farmer",
            entityId: livestock.assignedFarmer,
            association: livestock.association,
            message: `${farmer ? farmer.getFullName() : "The farmer"} has received ${livestock.animal} (${livestock.propertyNumber}).`,
        });
    }

    await livestock.populate(["assignedFarmer", ASSOCIATION_POPULATE, MOTHER_POPULATE].map((p) =>
        p === "assignedFarmer" ? { path: "assignedFarmer", select: "firstName lastName" } : p
    ));

    return livestock;
};

export const updateLivestock = async (id, data, actingUser) => {
    const access = await livestockAccessFilter(actingUser);
    const { associationId, ...livestockData } = data;
    if (associationId !== undefined) {
        livestockData.association = associationId;
    }

    if (livestockData.propertyNumber) {
        const existing = await Livestock.findOne({
            propertyNumber: livestockData.propertyNumber,
            _id: { $ne: id },
            deletedAt: null,
        });

        if (existing) {
            const error = new Error("Property number is already in use");
            error.statusCode = 409;
            throw error;
        }
    }

    const previousLivestock = await Livestock.findOne({ _id: id, deletedAt: null, ...access }).select("assignedFarmer condition animal propertyNumber association deceasedAt gender mother __v");
    if (!previousLivestock) throw lineageError("Livestock not found", "mother", 404);
    if (actingUser?.role === "far" && associationId !== undefined && String(associationId ?? "").toLowerCase() !== String(previousLivestock.association ?? "").toLowerCase()) {
        throw lineageError("You cannot move livestock outside your association", "associationId", 403);
    }
    if (actingUser?.role === "far" && data.assignedFarmer && associationId !== null) {
        const farmer = await Farmer.exists({ _id: data.assignedFarmer, association: associationId ?? previousLivestock.association ?? null, deletedAt: null });
        if (!farmer) throw lineageError("Assigned farmer must belong to the livestock association", "assignedFarmer");
    }

    if (livestockData.association === null) {
        livestockData.assignedFarmer = null;
    }

    const association = livestockData.association !== undefined ? livestockData.association : previousLivestock?.association;
    livestockData.status = association ? "assigned" : "available";
    if ((livestockData.association && String(livestockData.association) !== String(previousLivestock?.association ?? "")) ||
        (livestockData.assignedFarmer && String(livestockData.assignedFarmer) !== String(previousLivestock?.assignedFarmer ?? ""))) {
        assertAssignable("livestock", livestockData.condition ?? previousLivestock?.condition);
    }
    if (livestockData.condition !== undefined) {
        livestockData.deceasedAt = livestockData.condition === "deceased"
            ? previousLivestock?.deceasedAt ?? new Date()
            : null;
    }

    const update = { ...livestockData };
    const unset = {};
    if (update.assignedFarmer === null) {
        delete update.assignedFarmer;
        unset.assignedFarmer = "";
    }
    if (update.association === null) {
        delete update.association;
        unset.association = "";
    }

    const changesLineage = lineageChanged(previousLivestock, data);
    const persist = async (session) => {
        if (session) {
            const current = await Livestock.findOne({ _id: id, deletedAt: null, ...access }, null, { session }).select("__v");
            if (!current || current.__v !== previousLivestock.__v) throw lineageError("Livestock changed; refresh and try again", "mother", 409);
            const effective = { ...previousLivestock.toObject(), ...livestockData };
            const selectingMother = data.mother && String(data.mother) !== String(previousLivestock.mother ?? "");
            await validateLivestockLineage(id, effective, session, actingUser?.role === "far" && !!selectingMother);
        }
        return Livestock.findOneAndUpdate(
            { _id: id, deletedAt: null, ...access },
            {
                $set: update,
                $inc: { __v: 1 },
                ...(Object.keys(unset).length ? { $unset: unset } : {}),
            },
            { new: true, runValidators: true, ...(session ? { session } : {}) },
        ).populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE, { ...MOTHER_POPULATE, match: { deletedAt: null, ...access } }]);
    };
    const livestock = changesLineage ? await withLivestockLineageTransaction(persist) : await persist();
    if (changesLineage && livestock) livestock.$session(null);

    if (!livestock) {
        const notFoundError = new Error("Livestock not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (
        livestockData.association !== undefined &&
        String(previousLivestock?.association ?? "") !== String(livestock.association?._id ?? livestock.association ?? "")
    ) {
        if (livestock.association) {
            const association = await Association.findById(livestock.association._id ?? livestock.association).select("name");

            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: livestock.association._id ?? livestock.association,
                message: `${livestock.animal} (${livestock.propertyNumber}) has been assigned to ${association?.name ?? "an association"}.`,
            });
        } else {
            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: previousLivestock?.association,
                message: `${livestock.animal} (${livestock.propertyNumber}) has been returned and removed from its association.`,
            });
        }
    }

    if (
        livestockData.assignedFarmer !== undefined &&
        String(previousLivestock?.assignedFarmer ?? "") !== String(livestock.assignedFarmer?._id ?? "")
    ) {
        if (livestock.assignedFarmer) {
            const assignedName = livestock.assignedFarmer.getFullName?.() ?? "a farmer";

            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: livestock.association?._id ?? livestock.association,
                message: `${livestock.animal} (${livestock.propertyNumber}) has been assigned to ${assignedName}.`,
            });

            await createLog({
                entityType: "farmer",
                entityId: livestock.assignedFarmer._id,
                association: livestock.association?._id ?? livestock.association,
                message: `${livestock.assignedFarmer.getFullName?.() ?? "The farmer"} has received ${livestock.animal} (${livestock.propertyNumber}).`,
            });
        } else {
            const previousFarmer = previousLivestock?.assignedFarmer
                ? await Farmer.findById(previousLivestock.assignedFarmer).select("firstName lastName")
                : null;

            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: livestock.association?._id ?? livestock.association,
                message: `${livestock.animal} (${livestock.propertyNumber}) has been returned.`,
            });

            if (previousFarmer) {
                await createLog({
                    entityType: "farmer",
                    entityId: previousLivestock.assignedFarmer,
                    association: livestock.association?._id ?? livestock.association,
                    message: `${previousFarmer.getFullName()} has returned ${livestock.animal} (${livestock.propertyNumber}).`,
                });
            }
        }
    }

    if (
        livestockData.condition !== undefined &&
        previousLivestock?.condition !== livestock.condition
    ) {
        await createLog({
            entityType: "livestock",
            entityId: livestock._id,
            association: livestock.association?._id ?? livestock.association,
            message: `${livestock.animal} (${livestock.propertyNumber})'s condition has been changed from ${previousLivestock?.condition ?? "unknown"} to ${livestock.condition}.`,
        });
    }

    return livestock;
};

export const deleteLivestock = async (id) => {
    return withLivestockLineageTransaction(async (session) => {
        const livestock = await Livestock.findOneAndUpdate(
            { _id: id, deletedAt: null },
            { $set: { deletedAt: new Date(), mother: null }, $inc: { __v: 1 } },
            { new: true, session },
        );
        if (!livestock) throw lineageError("Livestock not found", "mother", 404);
        await Livestock.updateMany({ mother: id }, { $set: { mother: null }, $inc: { __v: 1 } }, { session });
        livestock.$session(null);
        return livestock;
    });
};

export const restoreLivestock = async (id) => {
    const toRestore = await Livestock.findOne({ _id: id, deletedAt: { $ne: null } });

    if (!toRestore) {
        const notFoundError = new Error("Deleted livestock not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const propertyNumberTaken = await Livestock.findOne({
        _id: { $ne: id },
        propertyNumber: toRestore.propertyNumber,
        deletedAt: null,
    });

    if (propertyNumberTaken) {
        const conflictError = new Error("An active livestock record with this property number already exists");
        conflictError.statusCode = 409;
        throw conflictError;
    }

    await withLivestockLineageTransaction(async (session) => {
        toRestore.deletedAt = null;
        await validateLivestockLineage(id, toRestore.toObject(), session);
        await toRestore.save({ session });
    });
    toRestore.$session(null);
    return toRestore;
};

const attachHistory = async (livestocks, associationId) => {
    const livestockIds = livestocks.map((l) => l._id);

    if (!livestockIds.length) return [];

    const logsByLivestockId = await getLogsForEntities(
        "livestock",
        livestockIds,
        associationId,
    );

    return livestocks.map((l) => {
        const obj = typeof l.toObject === "function" ? l.toObject() : l;
        const key = obj._id.toString();
        return {
            ...obj,
            status: obj.association ? "assigned" : "available",
            history: logsByLivestockId.get(key) ?? [],
        };
    });
};

export const getAvailableLivestocks = async () => {
    const livestocks = await Livestock.find({
        deletedAt: null,
        association: null,
        assignedFarmer: null,
    })
        .select("propertyNumber animal breed condition status")
        .sort({ propertyNumber: 1 });

    return livestocks;
};

export const getLivestocks = async ({
    condition,
    status,
    search,
    associationId,
    all,
    page,
    limit,
    includeDeleted = false,
}, actingUser) => {
    const access = await livestockAccessFilter(actingUser);
    const motherPopulate = { ...MOTHER_POPULATE, match: { deletedAt: null, ...access } };
    const filter = includeDeleted ? { ...access } : { deletedAt: null, ...access };
    if (condition) filter.condition = condition;
    if (status) filter.$and = [{ association: status === "assigned" ? { $ne: null } : null }];
    if (associationId && actingUser?.role !== "far") filter.association = associationId;

    if (search) {
        filter.animal = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const livestocks = await Livestock.find(filter)
            .populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE, motherPopulate])
            .sort({ createdAt: -1 });

        return {
            livestocks: await attachHistory(livestocks, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [livestocks, total] = await Promise.all([
        Livestock.find(filter)
            .populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE, motherPopulate])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Livestock.countDocuments(filter),
    ]);

    return {
        livestocks: await attachHistory(livestocks, associationId),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getLivestock = async (id, actingUser) => {
    const access = await livestockAccessFilter(actingUser);
    const livestock = await Livestock.findOne({ _id: id, deletedAt: null, ...access })
        .populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE, { ...MOTHER_POPULATE, match: { deletedAt: null, ...access } }]);
    if (!livestock) throw lineageError("Livestock not found", "mother", 404);
    const [record] = await attachHistory([livestock], livestock.association?._id ?? livestock.association);
    const offspring = await Livestock.find({ mother: id, deletedAt: null, ...access })
        .select(LIVESTOCK_RELATION_FIELDS).sort({ birthDate: -1, propertyNumber: 1 }).lean();
    return { ...record, mother: record.mother ?? null, offspring: offspring.map((child) => ({ ...child, status: child.association ? "assigned" : "available" })) };
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
````

### backend/src/controllers/livestock.controller.js

````js
import {
    createLivestock,
    updateLivestock,
    deleteLivestock,
    getLivestocks,
    getAvailableLivestocks,
    getLivestock,
} from "../services/livestock.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getEligibleLivestockMothers } from "../services/livestockLineage.service.js";

export const createLivestockHandler = asyncHandler(async (req, res) => {
    const livestock = await createLivestock(req.body, req.user?._id, req.user);

    return res.status(201).json({
        message: "Livestock created successfully",
        livestock,
    });
});

export const updateLivestockHandler = asyncHandler(async (req, res) => {
    const livestock = await updateLivestock(req.params.id, req.body, req.user);

    return res.status(200).json({
        message: "Livestock updated successfully",
        livestock,
    });
});

export const deleteLivestockHandler = asyncHandler(async (req, res) => {
    const livestock = await deleteLivestock(req.params.id);

    return res.status(200).json({
        message: "Livestock deleted successfully",
        livestock,
    });
});

export const getLivestocksHandler = asyncHandler(async (req, res) => {
    const { livestocks, pagination } = await getLivestocks(req.query, req.user);

    return res.status(200).json({
        message: "Livestock fetched successfully",
        livestocks,
        pagination,
    });
});

export const getAvailableLivestocksHandler = asyncHandler(async (req, res) => {
    const livestocks = await getAvailableLivestocks();

    return res.status(200).json({
        message: "Available livestock fetched successfully",
        livestocks,
    });
});

export const getLivestockHandler = asyncHandler(async (req, res) => {
    const livestock = await getLivestock(req.params.id, req.user);
    res.status(200).json({ message: "Livestock fetched successfully", livestock });
});

export const getLivestockMothersHandler = asyncHandler(async (req, res) => {
    const livestocks = await getEligibleLivestockMothers(req.query, req.user);
    res.status(200).json({ message: "Eligible mothers fetched successfully", livestocks });
});
````

### backend/src/routes/livestock.routes.js

````js
import express from "express";
import {
    createLivestockHandler,
    updateLivestockHandler,
    deleteLivestockHandler,
    getLivestocksHandler,
    getAvailableLivestocksHandler,
    getLivestockHandler,
    getLivestockMothersHandler,
} from "../controllers/livestock.controller.js";
import {
    validateCreateLivestock,
    validateUpdateLivestock,
    validateLivestockIdParam,
    validateGetLivestocksQuery,
    validateGetLivestockMothersQuery,
} from "../validators/livestock.validator.js";
import { authenticated, allowRoles, scopeByAssociationId } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), scopeByAssociationId, validateGetLivestocksQuery, getLivestocksHandler);
router.get("/available", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), getAvailableLivestocksHandler);
router.get("/mothers", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), scopeByAssociationId, validateGetLivestockMothersQuery, getLivestockMothersHandler);
router.get("/:id", authenticated, allowRoles("far", "aew", "coordinator", "head", "admin"), validateLivestockIdParam, getLivestockHandler);
router.post("/", authenticated, allowRoles("coordinator", "admin"), validateCreateLivestock, createLivestockHandler);
router.patch("/:id", authenticated, allowRoles("far", "coordinator", "admin"), validateLivestockIdParam, validateUpdateLivestock, updateLivestockHandler);
router.delete("/:id", authenticated, allowRoles("coordinator", "admin"), validateLivestockIdParam, deleteLivestockHandler);

export default router;
````

### backend/src/middlewares/error.middleware.js

````js
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const propertyConflict = err.code === 11000 && err.keyPattern?.propertyNumber;
  const positionConflict = err.code === 11000 && err.keyPattern?.association && err.keyPattern?.position;
  const locationConflict = err.code === 11000 && err.keyPattern?.municipality && err.keyPattern?.barangay;
  const conflictMessage = propertyConflict ? "Property number is already in use"
    : positionConflict ? "This position is already taken in this association"
    : locationConflict ? "This municipality and barangay is already assigned to another association" : null;
  const statusCode = conflictMessage ? 409 : err.statusCode || err.status || 500;

  return res.status(statusCode).json({
    message: conflictMessage || err.message || "Server Error",
    ...(err.field ? { field: err.field } : {}),
  });
};
````

### backend/src/services/request.service.js

````js
import Request from "../models/request.model.js";
import User from "../models/user.model.js";
import Livestock from "../models/livestock.model.js";
import Equipment from "../models/equipment.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";
import emailQueue from "../queues/email.queue.js";
import { EMAIL_JOBS } from "../queues/email.jobs.js";
import { assertAssignable, BLOCKED_CONDITIONS } from "../utils/assignment.js";

const STAGE_ORDER = ["coordinator", "governor", "head"];

const ENTITY_MODELS = {
    livestock: Livestock,
    equipment: Equipment,
};

const ENTITY_SELECT = {
    livestock: "propertyNumber animal",
    equipment: "propertyNumber name",
};

const ASSOCIATION_POPULATE = { path: "association", select: "name" };

async function populateEntities(requests) {
    const idsByType = { livestock: new Set(), equipment: new Set() };

    for (const r of requests) {
        if (idsByType[r.entityType]) {
            for (const id of r.entityIds) {
                idsByType[r.entityType].add(String(id));
            }
        }
    }

    const [livestockDocs, equipmentDocs] = await Promise.all([
        idsByType.livestock.size
            ? Livestock.find({ _id: { $in: [...idsByType.livestock] } })
                .select(ENTITY_SELECT.livestock)
                .lean()
            : [],
        idsByType.equipment.size
            ? Equipment.find({ _id: { $in: [...idsByType.equipment] } })
                .select(ENTITY_SELECT.equipment)
                .lean()
            : [],
    ]);

    const entityMap = new Map();
    for (const doc of livestockDocs) entityMap.set(String(doc._id), doc);
    for (const doc of equipmentDocs) entityMap.set(String(doc._id), doc);

    return requests.map((r) => ({
        ...r,
        entities: r.entityIds
            .map((id) => entityMap.get(String(id)))
            .filter(Boolean),
    }));
}

// Mirrors attachRelatedRecords in farmer.service.js — pulls each
// request's audit trail from Log (entityType: "request") and merges it
// in as `history`, newest first (getLogsForEntities already sorts by
// createdAt desc).
async function attachHistory(requests, associationId) {
    const requestIds = requests.map((r) => r._id);

    if (!requestIds.length) return [];

    const logsByRequestId = await getLogsForEntities(
        "request",
        requestIds,
        associationId,
    );

    return requests.map((r) => {
        const key = r._id.toString();
        return {
            ...r,
            history: logsByRequestId.get(key) ?? [],
        };
    });
}

const resolveAssociationId = async (authenticatedUserId) => {
    if (!authenticatedUserId) return undefined;

    const association = await Association.findOne({
        user: authenticatedUserId,
        deletedAt: null,
    }).select("_id");

    return association?._id ?? undefined;
};

// Resolves the association's assigned user so approval/release/rejection
// emails have somewhere to go. Returns null (rather than throwing) when
// there's no association or no user email on file, so callers can just
// skip sending in that case — mirrors the tolerant "unaffiliated user"
// handling already used in createRequest's log message.
async function getAssociationRecipient(associationId) {
    if (!associationId) return null;

    const association = await Association.findById(associationId)
        .select("name user")
        .populate({ path: "user", select: "fullname email" });

    if (!association?.user?.email) return null;

    return {
        email: association.user.email,
        name: association.user.fullname || association.name || "there",
    };
}

function mapItemsForEmail(entityType, docs) {
    return docs.map((doc) => ({
        label: entityType === "livestock" ? doc.animal : doc.name,
        propertyNumber: doc.propertyNumber,
    }));
}

async function sendRequestApprovedEmail(request) {
    const recipient = await getAssociationRecipient(request.association);
    if (!recipient) return;

    const EntityModel = ENTITY_MODELS[request.entityType];
    const reservedDocs = await EntityModel.find({
        _id: { $in: request.entityIds },
        reservedBy: request._id,
    })
        .select(ENTITY_SELECT[request.entityType])
        .lean();

    await emailQueue.add(EMAIL_JOBS.REQUEST_APPROVED, {
        type: EMAIL_JOBS.REQUEST_APPROVED,
        data: {
            to: recipient.email,
            name: recipient.name,
            requestTitle: request.title,
            entityType: request.entityType,
            items: mapItemsForEmail(request.entityType, reservedDocs),
        },
    });
}

async function sendRequestReleasedEmail(request, releasedDocs, isPartial) {
    const recipient = await getAssociationRecipient(request.association);
    if (!recipient) return;

    await emailQueue.add(EMAIL_JOBS.REQUEST_RELEASED, {
        type: EMAIL_JOBS.REQUEST_RELEASED,
        data: {
            to: recipient.email,
            name: recipient.name,
            requestTitle: request.title,
            entityType: request.entityType,
            items: mapItemsForEmail(request.entityType, releasedDocs),
            isPartial,
        },
    });
}

async function sendRequestRejectedEmail(request, role, remarks) {
    const recipient = await getAssociationRecipient(request.association);
    if (!recipient) return;

    await emailQueue.add(EMAIL_JOBS.REQUEST_REJECTED, {
        type: EMAIL_JOBS.REQUEST_REJECTED,
        data: {
            to: recipient.email,
            name: recipient.name,
            requestTitle: request.title,
            stage: humanize(role),
            remarks: remarks || "",
        },
    });
}

export const createRequest = async (data, authenticatedUserId) => {
    const resolvedAssociationId = await resolveAssociationId(authenticatedUserId);

    const EntityModel = ENTITY_MODELS[data.entityType];
    const entityExists = await EntityModel.countDocuments({
        _id: { $in: data.entityIds },
        deletedAt: null,
    });
    if (entityExists !== data.entityIds.length) {
        const error = new Error(`One or more selected ${data.entityType} items were not found`);
        error.statusCode = 404;
        throw error;
    }
    await checkRequestConditions(data.entityType, data.entityIds);

    const request = await Request.create({
        ...data,
        association: resolvedAssociationId || undefined,
        approvalStatus: {
            coordinator: { status: "pending" },
        },
    });

    // Always logged on submission, regardless of whether the requester
    // belongs to an association — falls back to a generic subject rather
    // than skipping the log entirely.
    const association = request.association
        ? await Association.findById(request.association).select("name")
        : null;
    const submitterLabel = association?.name ?? "An unaffiliated user";

    await createLog({
        entityType: "request",
        entityId: request._id,
        association: request.association,
        message: `${submitterLabel} submitted a request "${request.title}" for ${humanize(request.entityType)}.`,
    });

    return request;
};

export const updateRequest = async (id, data) => {
    if (data.entityIds || data.entityType) {
        const previous = await Request.findOne({ _id: id, deletedAt: null });
        if (previous) await checkRequestConditions(data.entityType ?? previous.entityType, data.entityIds ?? previous.entityIds);
    }
    const request = await Request.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!request) {
        const notFoundError = new Error("Request not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return request;
};

export const updateRequestApproval = async (id, { status, remarks }, actingUser) => {
    const role = actingUser?.role;

    if (!STAGE_ORDER.includes(role)) {
        const error = new Error("Only coordinator, governor, or head users can review requests");
        error.statusCode = 403;
        throw error;
    }

    const request = await Request.findOne({ _id: id, deletedAt: null });

    if (!request) {
        const notFoundError = new Error("Request not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const currentStageEntry = request.approvalStatus?.[role];

    if (!currentStageEntry) {
        const error = new Error("This request is not currently awaiting your review");
        error.statusCode = 403;
        throw error;
    }

    if (currentStageEntry.status !== "pending") {
        const error = new Error("This stage has already been reviewed");
        error.statusCode = 409;
        throw error;
    }

    request.approvalStatus[role] = {
        status,
        approvedBy: actingUser._id,
        approvedAt: new Date(),
        remarks: remarks || "",
    };

    const stageLabel = humanize(role);
    const decisionVerb = status === "approved" ? "approved" : "denied";
    const remarksSuffix = remarks ? ` Remarks: "${remarks}"` : "";

    // Single decision log per stage — this is the log, full stop.
    // No separate "now awaiting the next stage" entry: the next
    // reviewer's own decision log, once they act, speaks for itself.
    await createLog({
        entityType: "request",
        entityId: request._id,
        association: request.association,
        message: `${stageLabel} has ${decisionVerb} the request "${request.title}".${remarksSuffix}`,
    });

    if (status === "approved") {
        if (role === "coordinator") {
            const nextStage = request.entityType === "livestock" ? "head" : "governor";
            request.approvalStatus[nextStage] = { status: "pending" };
        } else if (role === "governor") {
            request.approvalStatus.head = { status: "pending" };
        } else if (role === "head") {
            await reserveRequestItems(request);

            await createLog({
                entityType: "request",
                entityId: request._id,
                association: request.association,
                message: `Request "${request.title}" has been fully approved. ${request.entityIds.length} item(s) have been reserved pending release.`,
            });

            await sendRequestApprovedEmail(request);
        }
    } else if (status === "denied") {
        await sendRequestRejectedEmail(request, role, remarks);
    }

    await request.save();
    return request;
};

async function reserveRequestItems(request) {
    const EntityModel = ENTITY_MODELS[request.entityType];
    await checkRequestConditions(request.entityType, request.entityIds);

    await EntityModel.updateMany(
        {
            _id: { $in: request.entityIds },
            deletedAt: null,
            association: null,
            reservedBy: null,
            condition: { $nin: BLOCKED_CONDITIONS[request.entityType] },
        },
        { $set: { reservedBy: request._id } }
    );
}

export const releaseRequest = async (id) => {
    const request = await Request.findOne({ _id: id, deletedAt: null });

    if (!request) {
        const notFoundError = new Error("Request not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (request.approvalStatus?.head?.status !== "approved") {
        const error = new Error("Request must be fully approved before it can be released");
        error.statusCode = 409;
        throw error;
    }

    if (request.releaseStatus === "released") {
        const error = new Error("Request has already been fully released");
        error.statusCode = 409;
        throw error;
    }

    const EntityModel = ENTITY_MODELS[request.entityType];
    await checkRequestConditions(request.entityType, request.entityIds);

    // Select the display fields for this entity type up front (not just
    // _id) — needed below to write a readable per-item log once release
    // succeeds, without a second round-trip to re-fetch them.
    const availableDocs = await EntityModel.find({
        _id: { $in: request.entityIds },
        deletedAt: null,
        reservedBy: request._id,
    }).select(`_id ${ENTITY_SELECT[request.entityType]}`);

    const availableIds = availableDocs.map((doc) => doc._id);

    if (availableIds.length === 0) {
        await createLog({
            entityType: "request",
            entityId: request._id,
            association: request.association,
            message: `Release attempted for request "${request.title}" but no reserved items were available to release.`,
        });
        return request;
    }

    await EntityModel.updateMany(
        { _id: { $in: availableIds } },
        {
            $set: {
                association: request.association,
                status: request.association ? "assigned" : "available",
            },
            $unset: { reservedBy: "" },
            ...(request.entityType === "livestock" ? { $inc: { __v: 1 } } : {}),
        }
    );

    request.releaseStatus =
        availableIds.length === request.entityIds.length ? "released" : "partial";

    await request.save();

    const association = request.association
        ? await Association.findById(request.association).select("name")
        : null;
    const associationLabel = association?.name ?? "the association";

    // One log per released item, on the entity's own log (equipment or
    // livestock), so it shows up in that item's history alongside its
    // other assignment/return entries — not just as a single aggregate
    // count on the request's log.
    for (const doc of availableDocs) {
        const itemLabel =
            request.entityType === "livestock"
                ? `${doc.animal} (${doc.propertyNumber})`
                : `${doc.name} (${doc.propertyNumber})`;

        await createLog({
            entityType: request.entityType,
            entityId: doc._id,
            association: request.association,
            message: `${itemLabel} has been released from request "${request.title}" and added to ${associationLabel}.`,
        });
    }

    await sendRequestReleasedEmail(
        request,
        availableDocs,
        request.releaseStatus === "partial"
    );

    if (request.releaseStatus === "released") {
        await createLog({
            entityType: "request",
            entityId: request._id,
            association: request.association,
            message: `Request "${request.title}" has been fully released. All ${availableIds.length} item(s) have been added to the association.`,
        });
    } else {
        await createLog({
            entityType: "request",
            entityId: request._id,
            association: request.association,
            message: `Request "${request.title}" has been partially released. ${availableIds.length} of ${request.entityIds.length} item(s) were added to the association; the remainder are no longer available.`,
        });
    }

    return request;
};

export const deleteRequest = async (id) => {
    const request = await Request.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!request) {
        const notFoundError = new Error("Request not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    await createLog({
        entityType: "request",
        entityId: request._id,
        association: request.association,
        message: `Request "${request.title}" has been deleted.`,
    });

    return request;
};

async function checkRequestConditions(type, ids) {
    const docs = await ENTITY_MODELS[type].find({ _id: { $in: ids }, deletedAt: null }).select("condition");
    for (const doc of docs) assertAssignable(type, doc.condition);
}

function buildOverallStatusFilter(status) {
    const DENIED_AT_ANY_STAGE = [
        { "approvalStatus.coordinator.status": "denied" },
        { "approvalStatus.governor.status": "denied" },
        { "approvalStatus.head.status": "denied" },
    ];

    if (status === "denied") {
        return { $or: DENIED_AT_ANY_STAGE };
    }
    if (status === "approved") {
        return { "approvalStatus.head.status": "approved" };
    }
    return {
        $nor: [...DENIED_AT_ANY_STAGE, { "approvalStatus.head.status": "approved" }],
    };
}

export const getRequests = async ({
    status,
    severity,
    search,
    stage,
    associationId,
    all,
    page,
    limit,
    includeDeleted = false,
}) => {
    const filter = includeDeleted ? {} : { deletedAt: null };

    if (severity) filter.severity = severity;
    if (associationId) filter.association = associationId;
    if (search) filter.title = new RegExp(escapeRegex(search), "i");

    if (stage) filter[`approvalStatus.${stage}`] = { $exists: true };
    if (status) Object.assign(filter, buildOverallStatusFilter(status));

    if (all) {
        const requests = await Request.find(filter)
            .populate(ASSOCIATION_POPULATE)
            .sort({ createdAt: -1 })
            .lean();
        const withEntities = await populateEntities(requests);
        return {
            requests: await attachHistory(withEntities, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
        Request.find(filter)
            .populate(ASSOCIATION_POPULATE)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Request.countDocuments(filter),
    ]);

    const withEntities = await populateEntities(requests);

    return {
        requests: await attachHistory(withEntities, associationId),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
````

## Frontend forms, queries, and livestock details

### frontend/src/schemas/livestock.schema.js

````js
import { z } from "zod";
import { GENDER_OPTIONS, LIVESTOCK_HEALTH_OPTIONS } from "@/constants/data";

const GENDERS = GENDER_OPTIONS.map((o) => o.value);
const HEALTH_STATUSES = LIVESTOCK_HEALTH_OPTIONS.map((o) => o.value);
const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

const baseLivestockFormSchema = z.object({
    propertyNumber: z
        .string({ required_error: "Property number is required" })
        .trim()
        .min(1, "Property number is required")
        .max(30, "Property number must not exceed 30 characters"),
    animal: z
        .string({ required_error: "Animal type is required" })
        .trim()
        .min(2, "Animal type must be at least 2 characters")
        .max(50, "Animal type must not exceed 50 characters"),
    breed: z
        .string({ required_error: "Breed is required" })
        .trim()
        .min(2, "Breed must be at least 2 characters")
        .max(50, "Breed must not exceed 50 characters"),
    gender: z.enum(GENDERS),
    health: z.enum(HEALTH_STATUSES),
    dob: z
        .string({ error: "Release date is required" })
        .trim()
        .min(1, "Release date is required"),
    color: z
        .string({ required_error: "Color is required" })
        .trim()
        .min(1, "Color is required")
        .max(50, "Color must not exceed 50 characters"),
    weight: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : val),
        z.union([z.number(), z.string()]).optional(),
    ).transform((val, ctx) => {
        if (val === undefined) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Weight is required" });
            return z.NEVER;
        }
        const num = typeof val === "number" ? val : Number(val);
        if (Number.isNaN(num)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Weight must be a number" });
            return z.NEVER;
        }
        if (num < 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Weight must be zero or greater" });
            return z.NEVER;
        }
        return num;
    }),
    associationId: z.union([objectId("Invalid association id"), z.literal("")]).optional(),
    isOffspring: z.boolean().optional().default(false),
    mother: z.union([objectId("Select a valid mother"), z.literal("")]).nullable().optional(),
});

function validateMother(data, ctx) {
    if (data.isOffspring && !data.mother) {
        ctx.addIssue({ code: "custom", path: ["mother"], message: "Select a mother when Offspring is enabled" });
    }
}

export const livestockFormSchema = baseLivestockFormSchema.superRefine(validateMother);
export const livestockUpdateSchema = baseLivestockFormSchema.partial().superRefine(validateMother);
````

### frontend/src/services/livestock.service.js

````js
import api from "@/api/axios";

export async function getLivestocks(params) {
    const response = await api.get("/livestocks", { params });
    return response.data;
}

export async function createLivestock(data) {
    const response = await api.post("/livestocks", data);
    return response.data;
}

export async function updateLivestock(id, data) {
    const response = await api.patch(`/livestocks/${id}`, data);
    return response.data;
}

export async function deleteLivestock(id) {
    const response = await api.delete(`/livestocks/${id}`);
    return response.data;
}

export async function getAvailableLivestocks() {
    const response = await api.get("/livestocks/available");
    return response.data;
}

export async function getLivestock(id) {
    const response = await api.get(`/livestocks/${id}`);
    return response.data;
}

export async function getLivestockMothers(params) {
    const response = await api.get("/livestocks/mothers", { params });
    return response.data;
}
````

### frontend/src/hooks/useLivestocks.js

````js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getLivestocks,
    getAvailableLivestocks,
    createLivestock,
    updateLivestock,
    deleteLivestock,
    getLivestock,
    getLivestockMothers,
} from "@/services/livestock.service";

/* ---------------- Query Keys ---------------- */
export const livestockKeys = {
    all: ["livestocks"],
    lists: () => [...livestockKeys.all, "list"],
    list: (filters) => [...livestockKeys.lists(), filters],
    details: () => [...livestockKeys.all, "detail"],
    detail: (id) => [...livestockKeys.details(), id],
    available: () => [...livestockKeys.all, "available"],
    mothers: (filters) => [...livestockKeys.all, "mothers", filters],
};

/* ---------------- Queries ---------------- */
export function useLivestocks(filters = {}, options = {}) {
    return useQuery({
        queryKey: livestockKeys.list(filters),
        queryFn: () => getLivestocks(filters),
        keepPreviousData: true,
        ...options,
    });
}

export function useAvailableLivestocks(options = {}) {
    return useQuery({
        queryKey: livestockKeys.available(),
        queryFn: () => getAvailableLivestocks(),
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
export function useLivestock(id, options = {}) {
    return useQuery({
        queryKey: livestockKeys.detail(id),
        queryFn: () => getLivestock(id),
        enabled: !!id,
        ...options,
    });
}

export function useLivestockMothers(filters, options = {}) {
    return useQuery({
        queryKey: livestockKeys.mothers(filters),
        queryFn: () => getLivestockMothers(filters),
        ...options,
    });
}

export function useCreateLivestock(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createLivestock(data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: livestockKeys.all });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateLivestock(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => updateLivestock(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: livestockKeys.all });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useDeleteLivestock(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteLivestock(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: livestockKeys.all });
            queryClient.removeQueries({ queryKey: livestockKeys.detail(variables) });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}
````

### frontend/src/components/modal/LivestockModal.jsx

````jsx
import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, FullSelect, TextInput, SingleSelect } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { GENDER_OPTIONS, LIVESTOCK_HEALTH_OPTIONS } from "@/constants/data";
import { useAssociations } from "@/hooks/useAssociations";
import { useCreateLivestock, useUpdateLivestock, useLivestockMothers } from "@/hooks/useLivestocks";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { assignmentReason } from "@/utils/assignment";
import useAuth from "@/hooks/useAuth";
import {
  livestockFormSchema,
  livestockUpdateSchema,
} from "@/schemas/livestock.schema";

export function LivestockModal({ mode, initial, onClose, onSave }) {
  const isEdit = mode === "edit";
  const { role } = useAuth();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver((isEdit ? livestockUpdateSchema : livestockFormSchema).superRefine((values, ctx) => {
      const reason = assignmentReason("livestock", values.health);
      if (reason && values.associationId && (!isEdit || values.associationId !== initial.associationId)) {
        ctx.addIssue({ code: "custom", message: reason, path: ["associationId"] });
      }
    })),
    defaultValues: {
      propertyNumber: initial.propertyNumber,
      animal: initial.animal,
      breed: initial.breed,
      gender: initial.gender,
      health: initial.health,
      dob: initial.dob?.slice(0, 10),
      color: initial.color,
      weight: initial.weight,
      associationId: initial.associationId || "",
      isOffspring: !!initial.mother,
      mother: initial.mother?._id ?? initial.mother ?? "",
    },
  });

  const animal = useWatch({ control, name: "animal" }) ?? "";
  const associationId = useWatch({ control, name: "associationId" });
  const isOffspring = useWatch({ control, name: "isOffspring" });
  const mother = useWatch({ control, name: "mother" });
  const { data: mothersData, isFetching: mothersLoading, isError: mothersFailed, error: mothersError, refetch: reloadMothers } = useLivestockMothers({
    animal: animal.trim(),
    ...(role === "far" ? { associationId: associationId || undefined, assignedFarmer: associationId ? initial.farmer || undefined : undefined } : {}),
    excludeId: isEdit ? initial._id : undefined,
  }, { enabled: !!isOffspring && animal.trim().length >= 2 });
  const motherOptions = (mothersData?.livestocks ?? []).map((record) => ({ value: record._id, label: `${record.propertyNumber} · ${record.animal} · ${record.breed}` }));

  useEffect(() => {
    if (isOffspring && mother && mothersData && !mothersLoading && !mothersFailed && !mothersData.livestocks.some((record) => record._id === mother)) {
      setValue("mother", "", { shouldValidate: true });
    }
  }, [isOffspring, mother, mothersData, mothersLoading, mothersFailed, setValue]);

  const { data: associationsData } = useAssociations({ all: true });

  const associationOptions = [
    { value: "", label: "No Association (Return Livestock)" },
    ...(associationsData?.associations ?? []).map((a) => ({
      value: a._id,
      label: a.name,
    })),
  ];

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateLivestock({
      onError: (err) =>
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        ),
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateLivestock({
      onError: (err) =>
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        ),
    });

  const busy = isCreating || isUpdating;

  const onSubmit = async (values) => {
    setSubmitError(null);

    const clearingAssociation = isEdit && !values.associationId;
    const derivedStatus = values.associationId ? "assigned" : "available";

    const payload = {
      propertyNumber: values.propertyNumber,
      animal: values.animal,
      breed: values.breed,
      gender: values.gender,
      condition: values.health,
      birthDate: values.dob,
      color: values.color,
      weight: values.weight,
      status: derivedStatus,
      mother: values.isOffspring ? values.mother : null,
      ...(isEdit
        ? { associationId: values.associationId || null }
        : values.associationId
          ? { associationId: values.associationId }
          : {}),
      ...(isEdit
        ? {
            assignedFarmer: clearingAssociation ? null : initial.farmer || null,
          }
        : initial.farmer
          ? { assignedFarmer: initial.farmer }
          : {}),
    };

    try {
      if (mode === "add") {
        const { livestock } = await createMutateAsync(payload);
        onSave?.(livestock);
      } else {
        const { livestock } = await updateMutateAsync({
          id: initial._id,
          ...payload,
        });
        onSave?.(livestock);
      }
    } catch (err) {
      const message = getErrorMessage(err, "Failed to save livestock");
      if (message === "Property number is already in use") {
        setError("propertyNumber", { type: "server", message });
      }
      const field = err?.response?.data?.field;
      if (["mother", "animal", "gender", "associationId"].includes(field)) setError(field, { type: "server", message });
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save livestock",
      );
    }
  };

  return (
    <ModalShell
      eyebrow={`Livestock · ${initial.id || "New"}`}
      title={mode === "add" ? "Add New Livestock" : `Edit ${initial.id}`}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            type="button"
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            variant="accent"
            type="submit"
            form="livestock-form"
            disabled={busy || (isOffspring && (mothersLoading || mothersFailed))}
          >
            {busy
              ? "Saving…"
              : mode === "add"
                ? "Add Livestock"
                : "Save Changes"}
          </Button>
        </>
      }
    >
      {submitError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {submitError}
        </div>
      )}
      <form
        id="livestock-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Field
          label="Property Number"
          error={errors.propertyNumber?.message}
          full
        >
          <TextInput
            {...register("propertyNumber")}
            placeholder="e.g. LVS-001"
          />
        </Field>
        <Field label="Animal Type" error={errors.animal?.message} full>
          <TextInput
            {...register("animal")}
            onChange={(event) => {
              if (event.target.value.trim().toLowerCase() !== animal.trim().toLowerCase()) setValue("mother", "");
              register("animal").onChange(event);
            }}
            placeholder="e.g. Cow, Goat, Sheep"
          />
        </Field>
        <Field label="Breed Type" error={errors.breed?.message}>
          <TextInput
            {...register("breed")}
            placeholder="e.g. Hereford, Angus"
          />
        </Field>
        <Field label="Color" error={errors.color?.message}>
          <TextInput {...register("color")} placeholder="e.g. Brown & White" />
        </Field>
        <Field label="Gender" error={errors.gender?.message}>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <FullSelect
                value={field.value}
                onChange={field.onChange}
                options={GENDER_OPTIONS}
              />
            )}
          />
        </Field>
        <Field label="Condition" error={errors.health?.message}>
          <Controller
            name="health"
            control={control}
            render={({ field }) => (
              <FullSelect
                value={field.value}
                onChange={field.onChange}
                options={LIVESTOCK_HEALTH_OPTIONS}
              />
            )}
          />
        </Field>
        <Field label="Release Date" error={errors.dob?.message}>
          <TextInput type="date" {...register("dob")} />
        </Field>
        <Field label="Weight (kg)" error={errors.weight?.message}>
          <TextInput
            type="number"
            min="0"
            step="0.1"
            {...register("weight")}
            placeholder="0.0"
          />
        </Field>
        {!initial.reservedBy && (
          <Field label="Association" error={errors.associationId?.message} full>
            <Controller
              name="associationId"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  options={associationOptions}
                  onChange={(value) => {
                    if (role === "far" && value !== field.value) setValue("mother", "");
                    field.onChange(value);
                  }}
                  defaultValue=""
                />
              )}
            />
          </Field>
        )}
        <Field label="Offspring" full error={errors.isOffspring?.message}>
          <Controller
            name="isOffspring"
            control={control}
            render={({ field }) => (
              <FullSelect
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  if (!value) setValue("mother", "", { shouldValidate: true });
                }}
                options={[{ value: false, label: "No" }, { value: true, label: "Yes" }]}
              />
            )}
          />
        </Field>
        {isOffspring && (
          <Field label="Select Mother" full error={errors.mother?.message || (mothersFailed ? getErrorMessage(mothersError, "Failed to load eligible mothers") : undefined)}>
            {animal.trim().length < 2 || mothersLoading ? (
              <div className="w-full border border-border bg-muted px-3 py-2.5 text-sm text-secondary">
                {animal.trim().length < 2 ? "Enter an animal type first…" : "Loading eligible mothers…"}
              </div>
            ) : mothersFailed ? (
              <Button type="button" variant="outline" onClick={() => reloadMothers()}>Retry</Button>
            ) : (
              <Controller
                name="mother"
                control={control}
                render={({ field }) => (
                  <SingleSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={motherOptions}
                    placeholder={motherOptions.length ? "Select mother…" : "No eligible mothers for this animal"}
                    searchPlaceholder="Search mother…"
                  />
                )}
              />
            )}
          </Field>
        )}
      </form>
    </ModalShell>
  );
}
````

### frontend/src/components/modal/LivestockDrawer.jsx

````jsx
import { X, Info, User, Activity, Calendar, Beef } from "lucide-react";
import { StatusPill } from "@/components/public";
import { fmtDate } from "@/utils/format";
import { DefList, Section } from "@/components/drawer";
import { healthTone, statusTone } from "@/constants/data";
import { useLivestock } from "@/hooks/useLivestocks";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { Link, useLocation } from "react-router-dom";

export function LivestockDrawer({ row: initialRow, onClose }) {
  const { data, isLoading, isError, error } = useLivestock(initialRow._id);
  const row = data?.livestock ?? initialRow;
  const location = useLocation();
  const detailsHref = (id) => {
    const params = new URLSearchParams(location.search);
    params.set("livestock", id);
    return `${location.pathname}?${params}`;
  };
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground-40" />
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-surface border-l border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="label-eyebrow mb-1">
                Livestock · {row.propertyNumber}
              </div>
              <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                {row.animal} · {row.breed}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                  {row.animal}
                </span>
                <StatusPill tone={healthTone[row.condition]}>
                  {row.condition}
                </StatusPill>
                <StatusPill tone={statusTone[row.status]}>
                  {row.status}
                </StatusPill>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center text-secondary hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {isLoading && <div className="text-sm text-secondary">Loading livestock…</div>}
          {isError && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{getErrorMessage(error, "Failed to load livestock details")}</div>}
          <Section icon={Info} title="Basic Information">
            <DefList
              items={[
                ["Property Number", row.propertyNumber],
                // association is now a populated { _id, name } object
                // (or absent) — display the name, not the object itself.
                ["Association", row.association?.name || "—"],
                ["Animal", row.animal],
                ["Breed", row.breed || "—"],
                ["Gender", row.gender ? (row.gender === "male" ? "Male" : "Female") : "—"],
                ["Mother", row.mother ? <Link to={detailsHref(row.mother._id)} className="text-sm font-medium text-foreground hover:underline">{row.mother.propertyNumber} · {row.mother.animal}</Link> : "—"],
                ["Release Date", row.birthDate ? fmtDate(row.birthDate) : "—"],
                ["Color", row.color || "—"],
                ["Weight", row.weight ? `${row.weight} kg` : "—"],
              ]}
            />
          </Section>

          {data?.livestock?.offspring?.length > 0 && (
            <Section icon={Beef} title="Offspring">
              <div className="space-y-2">
                {data.livestock.offspring.map((child) => (
                  <Link key={child._id} to={detailsHref(child._id)} className="flex items-center justify-between gap-3 border border-border bg-muted-30 p-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">{child.propertyNumber}</div>
                      <div className="text-xs text-secondary">{child.animal} · {child.gender === "female" ? "Female" : "Male"}{child.breed ? ` · ${child.breed}` : ""}</div>
                      {child.birthDate && <div className="text-xs text-secondary">Release Date: {fmtDate(child.birthDate)}</div>}
                    </div>
                    <StatusPill tone={statusTone[child.status]}>{child.status}</StatusPill>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          <Section icon={User} title="Assigned Farmer">
            {row.assignedFarmer ? (
              <div className="flex items-center gap-3 border border-border bg-muted-30 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-accent-soft rounded-full font-display text-sm text-accent">
                  {row.assignedFarmer.fullName?.[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">
                    {row.assignedFarmer.fullName}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-secondary">No farmer assigned.</div>
            )}
          </Section>

          <Section icon={Calendar} title="Activity Timeline">
            {row.history && row.history.length > 0 ? (
              <ol className="relative ml-2 border-l border-border">
                {row.history.map((h, i) => (
                  <li key={h._id ?? i} className="relative pl-5 pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                    <div className="font-semibold text-sm text-foreground">
                      {h.message}
                    </div>
                    <div className="text-xs text-secondary">
                      {fmtDate(h.date)}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-secondary">No activity yet.</div>
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}
````

### frontend/src/pages/public/LivestocksPage.jsx

````jsx
import { useState } from "react";
import { Plus, Eye, UserPlus, HeartPulse } from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, IconButton } from "@/components/ui";

import {
  healthTone,
  STATUS_OPTIONS,
  LIVESTOCK_HEALTH_OPTIONS,
  statusTone,
} from "@/constants/data";
import {
  LivestockDrawer,
  AssignModal,
  StatusUpdateModal,
  DeleteConfirmModal,
  LivestockModal,
} from "@/components/modal";
import { usePermissions } from "@/constants/permissions";
import useAuth from "@/hooks/useAuth";
import {
  useLivestocks,
  useUpdateLivestock,
  useDeleteLivestock,
} from "@/hooks/useLivestocks";
import { useFarmersByAssociationId } from "@/hooks/useFarmers";
import { fmtDate } from "@/utils/format";
import { useSearchParams } from "react-router-dom";

export function LivestocksPage() {
  const can = usePermissions("livestocks");
  const { role } = useAuth();

  // Coordinators/admins are the "managers": they add, edit (tag/animal/
  // breed/gender/dob/color/weight), and delete livestock via
  // LivestockModal + plain View/Edit/Delete actions.
  // FAR can only assign livestock to a farmer and update its health —
  // no add, no delete/return.
  const isManagerRole = role === "coordinator" || role === "admin";

  const [coordModal, setCoordModal] = useState(null); // { mode: 'add' | 'edit', data } — TODO: wire to create/update API
  const [assignRow, setAssignRow] = useState(null);
  const [statusRow, setStatusRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const drawerId = searchParams.get("livestock");
  const openView = (row) => setSearchParams((params) => { const next = new URLSearchParams(params); next.set("livestock", row._id); return next; });
  const closeView = () => setSearchParams((params) => { const next = new URLSearchParams(params); next.delete("livestock"); return next; });

  const [search, setSearch] = useState("");
  const [health, setHealth] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const queryFilters = {
    page,
    limit,
    ...(search ? { search } : {}),
    // Local state/UI copy uses "health"; the backend query schema
    // (getLivestocksQuerySchema) only recognizes "condition" — translate
    // here at the request boundary, same pattern as LivestockModal.
    ...(health ? { condition: health } : {}),
    ...(status ? { status } : {}),
  };

  const { data, isLoading, isError, error } = useLivestocks(queryFilters);
  const rows = data?.livestocks ?? [];
  const pagination = data?.pagination;

  // Farmer options for the assign modal, scoped to the livestock's own
  // association. Only fires while a row is actually being assigned.
  const { data: farmersData, isLoading: farmersLoading } =
    useFarmersByAssociationId(
      assignRow?.association?._id ?? assignRow?.association,
    );
  const farmerOptions = (farmersData?.farmers ?? []).map((f) => ({
    value: f._id,
    label: f.fullName,
  }));

  const updateMutation = useUpdateLivestock({
    onSuccess: () => {
      setAssignRow(null);
      setStatusRow(null);
    },
    onError: (err) => console.error("Failed to update livestock:", err),
  });
  const deleteMutation = useDeleteLivestock({
    onSuccess: () => setDeleteRow(null),
    onError: (err) => console.error("Failed to delete livestock:", err),
  });

  const openAdd = () => {
    if (!can.add || !isManagerRole) return;
    setCoordModal({
      mode: "add",
      data: {
        id: "",
        propertyNumber: "",
        animal: "",
        breed: "",
        gender: "male",
        health: "healthy",
        dob: "",
        color: "",
        weight: "",
        farmer: "",
        associationId: "",
      },
    });
  };

  const openCoordEdit = (row) => {
    if (!can.edit || !isManagerRole) return;
    setCoordModal({
      mode: "edit",
      data: {
        _id: row._id,
        id: row.propertyNumber,
        propertyNumber: row.propertyNumber,
        animal: row.animal,
        breed: row.breed,
        gender: row.gender,
        health: row.condition,
        dob: row.birthDate,
        color: row.color,
        weight: row.weight,
        farmer: row.assignedFarmer?._id,
        associationId: row.association?._id ?? row.association,
        reservedBy: row.reservedBy || null,
        mother: row.mother ?? null,
      },
    });
  };

  const openAssign = (row) => {
    if (!can.edit) return;
    setAssignRow(row);
  };

  const openStatus = (row) => {
    if (!can.edit) return;
    setStatusRow(row);
  };

  const openDelete = (row) => {
    if (!can.delete || !isManagerRole) return;
    setDeleteRow(row);
  };

  // FAR: assign livestock to a farmer.
  const handleAssign = (farmerId) => {
    if (!assignRow || !can.edit) return;
    updateMutation.mutate({
      id: assignRow._id,
      assignedFarmer: farmerId,
      status: "assigned",
    });
  };

  // FAR: update livestock health.
  const handleStatusUpdate = (health) => {
    if (!statusRow || !can.edit) return;
    updateMutation.mutate({ id: statusRow._id, condition: health });
  };

  const handleDelete = () => {
    if (!deleteRow || !can.delete || !isManagerRole) return;
    deleteMutation.mutate(deleteRow._id);
  };

  return (
    <div>
      <PageHeader
        title="Livestock"
        subtitle="Animal welfare and livestock inventory management."
        action={
          can.add && isManagerRole ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Livestock
            </Button>
          ) : null
        }
      />

      {isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load livestock"}
        </div>
      )}

      <DataTable
        searchPlaceholder="Search animal…"
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        data={rows}
        loading={isLoading}
        pagination={
          pagination
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                onPageChange: setPage,
              }
            : undefined
        }
        filters={[
          {
            key: "health",
            label: "Health",
            options: LIVESTOCK_HEALTH_OPTIONS,
            value: health,
            onChange: (v) => {
              setPage(1);
              setHealth(v);
            },
          },
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            value: status,
            onChange: (v) => {
              setPage(1);
              setStatus(v);
            },
          },
        ]}
        columns={[
          {
            key: "propertyNumber",
            header: "Property Number",
            cell: (r) => (
              <div className="flex items-center gap-6">
                <div>
                  <div className="font-semibold text-foreground">
                    {r.propertyNumber}
                  </div>
                  <div className="text-xs text-secondary">
                    {r.animal} · {r.breed}
                  </div>
                </div>
                {r.reservedBy && (
                  <StatusPill tone={statusTone.reserved} className="mt-1">
                    Reserved
                  </StatusPill>
                )}
              </div>
            ),
          },
          {
            key: "farmer",
            header: "Assigned Farmer",
            accessor: (r) => r.assignedFarmer?.fullName || "",
            cell: (r) => r.assignedFarmer?.fullName || "—",
          },
          {
            key: "health",
            header: "Health",
            cell: (r) => (
              <StatusPill tone={healthTone[r.condition]}>
                {r.condition}
              </StatusPill>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => (
              <StatusPill tone={statusTone[r.status]}>{r.status}</StatusPill>
            ),
          },
          {
            key: "mortality",
            header: "Mortality",
            cell: (r) => r.condition === "deceased" ? `Deceased (${r.deceasedAt ? fmtDate(r.deceasedAt) : "Date unknown"})` : "Alive",
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) =>
              isManagerRole ? (
                <RowActions
                  onView={() => openView(r)}
                  onEdit={can.edit ? () => openCoordEdit(r) : undefined}
                  onDelete={can.delete ? () => openDelete(r) : undefined}
                />
              ) : (
                <div className="flex items-center justify-end gap-1">
                  <IconButton
                    icon={Eye}
                    label="View"
                    onClick={() => openView(r)}
                  />
                  {can.edit && (
                    <IconButton
                      icon={UserPlus}
                      label="Assign"
                      onClick={() => openAssign(r)}
                    />
                  )}
                  {can.edit && (
                    <IconButton
                      icon={HeartPulse}
                      label="Update Health"
                      onClick={() => openStatus(r)}
                    />
                  )}
                </div>
              ),
          },
        ]}
      />

      {coordModal && isManagerRole && (
        <LivestockModal
          mode={coordModal.mode}
          initial={coordModal.data}
          onClose={() => setCoordModal(null)}
          onSave={() => setCoordModal(null)}
        />
      )}
      {assignRow && can.edit && !isManagerRole && (
        <AssignModal
          row={assignRow}
          options={farmerOptions}
          loading={farmersLoading}
          onClose={() => setAssignRow(null)}
          onSave={handleAssign}
        />
      )}
      {statusRow && can.edit && !isManagerRole && (
        <StatusUpdateModal
          row={statusRow}
          onClose={() => setStatusRow(null)}
          onSave={handleStatusUpdate}
          entityLabel="Livestock"
          fieldLabel="Health Status"
          statusField="condition"
          options={LIVESTOCK_HEALTH_OPTIONS}
        />
      )}
      {deleteRow && can.delete && isManagerRole && (
        <DeleteConfirmModal
          row={deleteRow}
          onCancel={() => setDeleteRow(null)}
          onConfirm={handleDelete}
        />
      )}
      {drawerId && (
        <LivestockDrawer key={drawerId} row={rows.find((row) => row._id === drawerId) ?? { _id: drawerId }} onClose={closeView} />
      )}
    </div>
  );
}
````

## Tests

### backend/test/livestock-offspring.test.js

````js
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
````

### backend/test/livestock-offspring.integration.test.js

````js
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
````

