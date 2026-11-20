import { Wheat, Users, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueries } from "@tanstack/react-query";
import {
  Field,
  TextInput,
  FullSelect,
  MultiSelect,
  Select,
  SingleSelect,
  Button,
} from "@/components/ui";
import {
  CROP_STAGE_LABEL,
  STORED_CROP_STAGES,
  newlyPlantedQuantity,
  stageQuantityTotal,
} from "@/constants/data";
import { LocationPicker, FarmerOwnedBadge } from "@/components/public";
import { ModalShell } from "./ModalShell";
import { LocationFields } from "./LocationFields";
import { referenceId, useLookups, lookupOptions } from "@/hooks/useLookups";
import { useFarmers, farmerKeys } from "@/hooks/useFarmers";
import { useCreateFarmerOwnedCrop } from "@/hooks/useCrops";
import { getCropsByFarmerId } from "@/services/farmer.service";
import { useAssociations } from "@/hooks/useAssociations";
import useAuth from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/getErrorMessage";
import {
  farmFormSchema,
  farmUpdateSchema,
  FARMER_CLASSIFICATION_OPTIONS,
} from "@/schemas/farm.schema";

// An entry is finished once everything planted has been harvested or
// damaged. Entries with nothing planted yet stay editable.
const isFinishedEntry = (quantities) => {
  const q = quantities ?? {};
  const planted = q.planted ?? 0;
  return planted > 0 && planted - (q.harvested ?? 0) - (q.damaged ?? 0) <= 0;
};

// Highest value a stage input accepts: whatever the planted count leaves
// after the other stages. Stages are recorded only against a planted
// quantity that is already saved, so the cap is the lower of the saved and
// the current planted value. Planted itself is a free value for every crop;
// the farm record never moves crop stock.
const getQuantityMax = (key, quantities, savedPlanted) => {
  const q = quantities ?? {};
  if (key === "planted") return undefined;
  const others = stageQuantityTotal(q) - (Number(q[key]) || 0);
  const planted = Math.min(Number(q.planted) || 0, savedPlanted);
  return Math.max(planted - others, 0);
};

// Inline form for a crop the farmer owns: crop type, one of the farm's
// assigned farmers, and an optional name. Lives inside the farm <form>, so
// every button is type="button" and Enter never submits the farm.
function FarmerCropForm({ farmerOptions, onCancel, onCreated }) {
  const { data: lookups, isPending: lookupsLoading } = useLookups();
  const [cropType, setCropType] = useState("");
  const [farmer, setFarmer] = useState(
    farmerOptions.length === 1 ? farmerOptions[0].value : "",
  );
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const { mutate, isPending } = useCreateFarmerOwnedCrop({
    onSuccess: (data) => onCreated(data.crop),
    onError: (err) => setError(getErrorMessage(err, "Could not add the crop")),
  });

  const submit = () => {
    if (!cropType) return setError("Select a crop type");
    if (!farmerOptions.some((o) => o.value === farmer)) {
      return setError("Select one of the farm's farmers");
    }
    setError(null);
    mutate({ cropType, assignedFarmer: farmer, name: name.trim() || undefined });
  };

  return (
    <div className="sm:col-span-2 space-y-3 border border-dashed border-border bg-muted-30 p-3">
      <div className="text-sm font-semibold text-foreground">Add farmer's crop</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Crop type">
          <SingleSelect
            value={cropType}
            onChange={setCropType}
            options={lookupOptions(lookups?.crops)}
            disabled={lookupsLoading}
            placeholder={lookupsLoading ? "Loading…" : "Select crop type…"}
            searchPlaceholder="Search…"
          />
        </Field>
        <Field label="Farmer">
          <SingleSelect
            value={farmer}
            onChange={setFarmer}
            options={farmerOptions}
            placeholder="Select farmer…"
            searchPlaceholder="Search farmer…"
          />
        </Field>
        <Field label="Name (optional)">
          <TextInput
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="e.g. Backyard rice"
          />
        </Field>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button variant="accent" type="button" onClick={submit} disabled={isPending}>
          {isPending ? "Adding…" : "Add crop"}
        </Button>
      </div>
    </div>
  );
}

const blankForm = {
  id: "",
  address: "",
  size: "",
  latitude: "",
  longitude: "",
  assignedFarmers: [],
  association: "",
  crops: [],
};

export function FarmModal({
  mode,
  initial,
  submitError,
  busy,
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit";
  const { role } = useAuth();
  const isFar = role === "far";
  const [farmerCropOpen, setFarmerCropOpen] = useState(false);
  // Farmer-owned crops created in this modal session (not yet on the farm).
  const [createdCrops, setCreatedCrops] = useState([]);

  // FAR users pick individual farmers to assign; everyone else assigns the
  // farm to an association instead. Only fetch whichever list is relevant.
  const { data: farmersData, isLoading: farmersLoading } = useFarmers({
    all: true,
    enabled: isFar,
  });

  const { data: associationsData, isLoading: associationsLoading } =
    useAssociations({ all: true }, { enabled: !isFar });

  const farmerOptions = (farmersData?.farmers ?? []).map((f) => ({
    value: f._id,
    label: f.fullName,
  }));

  const associationOptions = (associationsData?.associations ?? []).map(
    (a) => ({ value: a._id, label: a.name }),
  );

  // A crop entry stays editable here until everything planted on it has
  // been harvested or damaged (see isFinishedEntry). Finished entries drop
  // out ("frozen"), since there's nothing left to manage on them — a fresh
  // selection of the same crop starts a brand-new entry instead.
  const editableInitialCrops = useMemo(
    () => (initial?.crops ?? []).filter((c) => !isFinishedEntry(c.quantities)),
    [initial],
  );

  // The farm object returned by the backend has assignedFarmers[].farmer/
  // crops.crop/association populated (full objects), but the form + Select
  // components work with plain id strings. Normalize before handing to
  // useForm so all downstream comparisons (.includes(id), Map lookups,
  // etc.) work. assignedFarmers keeps its {farmer, classification} shape —
  // just unwraps the farmer object down to its id. `_id`
  // (the crop-entry id, distinct from the crop id) is carried through so
  // the backend can tell "this is the same entry, edited" apart from "this
  // is a new entry" when the crops array is submitted.
  const normalizedInitial = useMemo(() => {
    if (!initial) return initial;
    return {
      ...initial,
      municipality: referenceId(initial.municipality),
      barangay: referenceId(initial.barangay),
      street: initial.street ?? "",
      assignedFarmers: (initial.assignedFarmers ?? []).map((a) => ({
        farmer: typeof a.farmer === "string" ? a.farmer : a.farmer._id,
        classification: a.classification ?? "farm_worker",
      })),
      crops: editableInitialCrops.map((c) => ({
        _id: c._id,
        crop: typeof c.crop === "string" ? c.crop : c.crop._id,
        quantities: c.quantities ?? {},
      })),
      association:
        initial.association == null
          ? initial.association
          : typeof initial.association === "string"
            ? initial.association
            : initial.association._id,
    };
  }, [initial, editableInitialCrops]);

  // crop._id -> { _id, quantities }, sourced ONLY from editableInitialCrops
  // (open entries), not all of the farm's crops. This is deliberate: if a
  // crop's only existing entry is already finished (fully harvested/
  // damaged), it has no entry here, so re-selecting that crop in
  // the MultiSelect below starts a genuinely new, blank entry — a fresh
  // planting cycle — instead of resuming the finished one's cumulative
  // numbers. A crop that still has an open entry, on the other hand, keeps
  // resuming that same entry (same _id, same quantities) as before.
  const initialEntryByCropId = useMemo(() => {
    const map = new Map();
    editableInitialCrops.forEach((c) => {
      const cropId = typeof c.crop === "string" ? c.crop : c.crop._id;
      map.set(cropId, { _id: c._id, quantities: c.quantities ?? {} });
    });
    return map;
  }, [editableInitialCrops]);

  // Planted quantity already saved on this form row's entry; 0 for a new
  // entry. Planting comes first: stages unlock only once this is above 0.
  const getSavedPlanted = (row) => {
    if (!row._id) return 0;
    const entry = initialEntryByCropId.get(row.crop);
    return entry && entry._id === row._id ? Number(entry.quantities?.planted) || 0 : 0;
  };

  // crop._id -> crop name, sourced ONLY from editableInitialCrops (open
  // entries). Kept separate from quantity now — the quantity part of the
  // label is computed dynamically below (see getDisplayUnplanted) instead
  // of being baked into a static string, since the same crop can need to
  // display a different number depending on whether it's an open entry on
  // this farm or a fresh pick.
  const initialCropNameById = useMemo(() => {
    const map = new Map();
    editableInitialCrops.forEach((c) => {
      if (typeof c.crop === "string" || !c.crop) return; // unpopulated, no name to grab
      map.set(c.crop._id, c.crop.name);
    });
    return map;
  }, [editableInitialCrops]);

  // Farmer-owned crops known to this modal (already on the farm, or created
  // in this session): crop._id -> crop doc. They have no stock, so they
  // never come back from the farmer "available crops" query below.
  const farmerOwnedCropById = useMemo(() => {
    const map = new Map();
    (initial?.crops ?? []).forEach((c) => {
      if (c.crop && typeof c.crop !== "string" && c.crop.ownership === "farmer") {
        map.set(c.crop._id, c.crop);
      }
    });
    createdCrops.forEach((c) => map.set(c._id, c));
    return map;
  }, [initial, createdCrops]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? farmUpdateSchema : farmFormSchema),
    defaultValues: {
      address: "",
      size: "",
      assignedFarmers: [],
      crops: [],
      association: "",
      latitude: "",
      longitude: "",
      ...normalizedInitial,
    },
  });

  const crops = watch("crops") || [];
  const assignedFarmers = watch("assignedFarmers") || [];
  const assignedFarmerIds = useMemo(
    () => assignedFarmers.map((a) => a.farmer),
    [assignedFarmers],
  );
  const latitude = watch("latitude");
  const longitude = watch("longitude");

  // Crops are now farmer-scoped (not farm-scoped): fetch each currently
  // assigned farmer's available crops in parallel and union the results.
  // Each query's data is already filtered server-side to that farmer's own
  // crops, so no cross-checking against assignedFarmerIds is needed here.
  const cropQueries = useQueries({
    queries: assignedFarmerIds.map((farmerId) => ({
      queryKey: farmerKeys.crops(farmerId),
      queryFn: () => getCropsByFarmerId(farmerId),
      enabled: isFar && !!farmerId,
    })),
  });

  const cropsLoading = cropQueries.some((q) => q.isLoading);

  const allCrops = useMemo(
    () => cropQueries.flatMap((q) => q.data?.crops ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cropQueries.map((q) => q.dataUpdatedAt).join(",")],
  );

  // crop._id -> assignedFarmer id, so we can tell which farmer "owns" a
  // crop and strip crops when that farmer is unassigned.
  const cropOwnerMap = useMemo(() => {
    const map = new Map();
    [...allCrops, ...farmerOwnedCropById.values()].forEach((c) => {
      map.set(c._id, c.assignedFarmer?._id ?? c.assignedFarmer);
    });
    return map;
  }, [allCrops, farmerOwnedCropById]);

  // crop._id -> live unplanted stock (informational only: the farm record
  // never moves stock). Sourced from the farmer-scoped "available crops"
  // query (allCrops), falling back to the farm's own populated crop docs
  // (initial.crops) for crops that dropped out of that query.
  const cropUnplantedById = useMemo(() => {
    const map = new Map();
    allCrops.forEach((c) => map.set(c._id, c.unplanted));
    (initial?.crops ?? []).forEach((c) => {
      if (typeof c.crop === "string" || !c.crop) return;
      if (c.crop.ownership === "farmer") return; // no stock to cap planted
      if (!map.has(c.crop._id)) map.set(c.crop._id, c.crop.unplanted);
    });
    return map;
  }, [allCrops, initial]);

  // crop._id -> quantity given to the farmer (government crops only).
  const cropQuantityById = useMemo(() => {
    const map = new Map();
    allCrops.forEach((c) => map.set(c._id, c.quantity));
    (initial?.crops ?? []).forEach((c) => {
      if (typeof c.crop === "string" || !c.crop || c.crop.ownership === "farmer") return;
      if (!map.has(c.crop._id)) map.set(c.crop._id, c.crop.quantity);
    });
    return map;
  }, [allCrops, initial]);

  // crop._id -> crop name, unioning the live farmer-scoped query with the
  // fallback name map for crops that dropped out of that query (already
  // fully committed elsewhere, or tied up in this farm's own entry).
  const cropNameById = useMemo(() => {
    const map = new Map();
    allCrops.forEach((c) => map.set(c._id, c.name));
    initialCropNameById.forEach((name, id) => {
      if (!map.has(id)) map.set(id, name);
    });
    farmerOwnedCropById.forEach((c, id) => {
      if (!map.has(id)) map.set(id, c.name ?? c.cropType?.name);
    });
    return map;
  }, [allCrops, initialCropNameById, farmerOwnedCropById]);

  // A government crop's live unplanted stock, or null when unknown.
  const getDisplayUnplanted = (cropId) => cropUnplantedById.get(cropId) ?? null;

  // allCrops is the union of the currently assigned farmers' *available*
  // crops. Crops already on this farm that dropped out of that query are
  // backfilled from cropNameById/getDisplayUnplanted.
  const cropOptions = useMemo(() => {
    const fromQuery = allCrops.map((c) => ({
      value: c._id,
      label: `${c.unplanted} ${c.name}`,
    }));

    // Farmer-owned crops whose farmer is still assigned stay selectable.
    const farmerOwned = [...farmerOwnedCropById.values()]
      .filter((c) =>
        assignedFarmerIds.includes(c.assignedFarmer?._id ?? c.assignedFarmer),
      )
      .map((c) => ({
        value: c._id,
        label: `${c.name ?? c.cropType?.name} · Farmer-owned`,
      }));

    const selectedIds = new Set(crops.map((c) => c.crop));
    const known = new Set([...fromQuery, ...farmerOwned].map((o) => o.value));
    const missing = [...selectedIds]
      .filter((id) => !known.has(id) && cropNameById.has(id))
      .map((id) => {
        const displayQty = getDisplayUnplanted(id);
        const name = cropNameById.get(id);
        return {
          value: id,
          label: displayQty != null ? `${displayQty} ${name}` : name,
        };
      });

    return [...fromQuery, ...farmerOwned, ...missing];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCrops, crops, cropNameById, cropUnplantedById, farmerOwnedCropById, assignedFarmerIds]);

  // Keep track of the previous assignedFarmer ids so we only react to
  // actual removals (avoids stripping crops on unrelated re-renders).
  const prevAssignedFarmerIdsRef = useRef(assignedFarmerIds);

  useEffect(() => {
    const prev = prevAssignedFarmerIdsRef.current;
    const removedFarmerIds = prev.filter(
      (id) => !assignedFarmerIds.includes(id),
    );

    if (removedFarmerIds.length > 0) {
      const currentCrops = watch("crops") || [];
      const filtered = currentCrops.filter((c) => {
        const ownerId = cropOwnerMap.get(c.crop);
        // Keep the crop if we don't know its owner (safe default) or its
        // owner is still assigned; drop it only if the owner was just removed.
        return !ownerId || !removedFarmerIds.includes(ownerId);
      });

      if (filtered.length !== currentCrops.length) {
        setValue("crops", filtered, { shouldValidate: true });
      }
    }

    prevAssignedFarmerIdsRef.current = assignedFarmerIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedFarmerIds, cropOwnerMap]);

  // Bridges MultiSelect (plain id array) with the form's {farmer,
  // classification}[] shape — preserves each farmer's existing
  // classification, defaults new ones to "farm_worker".
  const onAssignedFarmersChange = (nextIds) => {
    const existing = new Map(assignedFarmers.map((a) => [a.farmer, a]));
    setValue(
      "assignedFarmers",
      nextIds.map((id) => ({
        farmer: id,
        classification: existing.get(id)?.classification ?? "farm_worker",
      })),
      { shouldValidate: true },
    );
  };

  const setFarmerClassification = (farmerId, classification) => {
    setValue(
      "assignedFarmers",
      assignedFarmers.map((a) =>
        a.farmer === farmerId ? { ...a, classification } : a,
      ),
      { shouldValidate: true },
    );
  };

  // Writes one stored quantity (planted or a stage). Newly planted is
  // derived from these on render and never written.
  const setCropQuantity = (cropId, key, rawValue) => {
    const value = rawValue === "" ? null : Number(rawValue);
    setValue(
      "crops",
      crops.map((c) =>
        c.crop === cropId
          ? { ...c, quantities: { ...c.quantities, [key]: value } }
          : c,
      ),
      { shouldValidate: true },
    );
  };

  // crop._id -> stage keys picked from "Add stage…" this session. A stage
  // that already holds a count is shown regardless.
  const [shownStages, setShownStages] = useState({});
  // Focuses the input of the stage just picked.
  const addedStageRef = useRef(null);

  const addStage = (cropId, key) => {
    addedStageRef.current = `${cropId}:${key}`;
    setShownStages((prev) => ({
      ...prev,
      [cropId]: [...(prev[cropId] ?? []), key],
    }));
  };

  const removeStage = (cropId, key) => {
    addedStageRef.current = null;
    setShownStages((prev) => ({
      ...prev,
      [cropId]: (prev[cropId] ?? []).filter((k) => k !== key),
    }));
    setCropQuantity(cropId, key, "");
  };

  // A newly created farmer-owned crop joins the farm's crop list right away.
  const onFarmerCropCreated = (crop) => {
    setCreatedCrops((prev) => [...prev, crop]);
    setValue(
      "crops",
      [...(getValues("crops") || []), { crop: crop._id, quantities: {} }],
      { shouldValidate: true },
    );
    setFarmerCropOpen(false);
  };

  const assignedFarmerOptions = farmerOptions.filter((o) =>
    assignedFarmerIds.includes(o.value),
  );

  // LocationPicker/LeafletMap work with a single {lat,lng} object, but the
  // form stores separate latitude/longitude fields — bridge the two here.
  const location =
    latitude !== "" && longitude !== "" && latitude != null && longitude != null
      ? { lat: Number(latitude), lng: Number(longitude) }
      : null;
  const onLocationChange = (next) => {
    if (!next) {
      setValue("latitude", "", { shouldValidate: true });
      setValue("longitude", "", { shouldValidate: true });
      return;
    }
    setValue("latitude", next.lat, { shouldValidate: true });
    setValue("longitude", next.lng, { shouldValidate: true });
  };

  // Crops with nothing left to manage (see editableInitialCrops) are hidden
  // from the form, but they still need to ride along in the submitted
  // payload unchanged. Farm.crops is replaced wholesale on update, so any
  // crop entry missing from the payload reads to the backend as "this
  // entry was removed" — which is wrong for an entry that's simply fully
  // harvested/damaged, not actually deleted. Each one keeps its `_id` so
  // the backend matches it back to the same entry rather than treating it
  // as new.
  const frozenCrops = useMemo(
    () =>
      (initial?.crops ?? [])
        .filter((c) => isFinishedEntry(c.quantities))
        .map((c) => ({
          _id: c._id,
          crop: typeof c.crop === "string" ? c.crop : c.crop._id,
          quantities: c.quantities ?? {},
        })),
    [initial],
  );

  const onSubmit = (values) => {
    // frozenCrops (finished entries, untouched) and values.crops (open
    // entries the user is actively managing, plus any brand-new entries
    // they just added) are always disjoint by construction now: a crop can
    // legitimately appear in both — e.g. an old finished entry sitting in
    // frozenCrops alongside a fresh new entry for the same crop in
    // values.crops. That's the whole point (see initialEntryByCropId
    // above), so no id-collision filtering is needed here anymore. The
    // backend matches by each entry's own `_id`.
    onSave({
      id: initial.id,
      ...values,
      crops: [...values.crops, ...frozenCrops],
    });
  };

  const locationError = errors.latitude?.message || errors.longitude?.message;

  return (
    <ModalShell
      title={mode === "add" ? "Add New Farm" : `Edit ${initial.tag}`}
      eyebrow="Farm"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="accent"
            type="submit"
            form="farm-form"
            disabled={busy}
          >
            {busy ? "Saving…" : mode === "add" ? "Add Farm" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="farm-form" onSubmit={handleSubmit(onSubmit)}>
        {submitError && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LocationFields control={control} setValue={setValue} register={register} initial={initial} errors={errors} street />

          <Field label="Size (hectares)" full error={errors.size?.message}>
            <TextInput
              type="number"
              step="0.01"
              {...register("size")}
              placeholder="2.5"
            />
          </Field>

          {isFar ? (
            <>
              <Field
                label="Assign Farmers"
                full
                error={errors.assignedFarmers?.message}
              >
                <Controller
                  name="assignedFarmers"
                  control={control}
                  render={() => (
                    <MultiSelect
                      values={assignedFarmerIds}
                      onChange={onAssignedFarmersChange}
                      options={farmerOptions}
                      placeholder={
                        farmersLoading ? "Loading farmers…" : "Select farmers…"
                      }
                      searchPlaceholder="Search farmer…"
                    />
                  )}
                />
              </Field>

              {assignedFarmers.length > 0 && (
                <div className="sm:col-span-2 space-y-2">
                  {assignedFarmers.map((a) => {
                    const label =
                      farmerOptions.find((o) => o.value === a.farmer)?.label ??
                      a.farmer;
                    return (
                      <div
                        key={a.farmer}
                        className="flex items-center justify-between gap-3 w-full bg-surface border border-border px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Users className="h-4 w-4 text-accent" />
                          {label}
                        </div>
                        <FullSelect
                          value={a.classification}
                          onChange={(v) => setFarmerClassification(a.farmer, v)}
                          options={FARMER_CLASSIFICATION_OPTIONS}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <>
                <Field label="Crops" full error={errors.crops?.message}>
                  <Controller
                    name="crops"
                    control={control}
                    render={({ field }) => {
                      const cropIds = field.value.map((c) => c.crop);
                      const onCropsChange = (requestedIds) => {
                        const existing = new Map(
                          field.value.map((c) => [c.crop, c]),
                        );
                        field.onChange(
                          requestedIds.map((id) => {
                            const prior = existing.get(id);
                            // Already present in the form (open entry being
                            // edited this session, or a re-selection within
                            // this session) — keep it exactly as-is,
                            // including its _id.
                            if (prior) return prior;

                            // Not currently in the form. If this crop still
                            // has an OPEN entry from the initial load,
                            // resume that same entry (same _id, same
                            // quantities). If it only has a finished entry
                            // (or none at all), initialEntryByCropId has
                            // nothing for it — this becomes a brand-new
                            // entry with no _id and blank quantities, which
                            // is exactly what we want for "replant after
                            // harvest".
                            const openEntry = initialEntryByCropId.get(id);
                            return {
                              _id: openEntry?._id,
                              crop: id,
                              quantities: openEntry?.quantities ?? {},
                            };
                          }),
                        );
                      };
                      return (
                        <MultiSelect
                          values={cropIds}
                          onChange={onCropsChange}
                          options={cropOptions}
                          placeholder={
                            assignedFarmerIds.length === 0
                              ? "Select a farmer first…"
                              : cropsLoading
                                ? "Loading crops…"
                                : "Select crops…"
                          }
                          searchPlaceholder="Search crop…"
                        />
                      );
                    }}
                  />
                </Field>

                <div className="sm:col-span-2 -mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setFarmerCropOpen(true)}
                    disabled={assignedFarmerIds.length === 0 || farmerCropOpen}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add farmer's crop
                  </button>
                </div>

                {farmerCropOpen && (
                  <FarmerCropForm
                    farmerOptions={assignedFarmerOptions}
                    onCancel={() => setFarmerCropOpen(false)}
                    onCreated={onFarmerCropCreated}
                  />
                )}

                {crops.length > 0 && (
                  <div className="sm:col-span-2 space-y-2">
                    {crops.map((c, index) => {
                      const farmerOwned = farmerOwnedCropById.has(c.crop);
                      const q = c.quantities ?? {};
                      // Government crops show their remaining stock for
                      // reference; farmer-owned crops have none.
                      const displayQty = farmerOwned
                        ? null
                        : getDisplayUnplanted(c.crop);
                      const cropName = cropNameById.get(c.crop);
                      const label = cropName
                        ?? cropOptions.find((o) => o.value === c.crop)?.label
                        ?? c.crop;
                      const staged = stageQuantityTotal(q);
                      const savedPlanted = getSavedPlanted(c);
                      const stagesLocked = savedPlanted <= 0;
                      // A stage input shows once it holds a count or the
                      // user picked it; the picker offers the rest.
                      const picked = shownStages[c.crop] ?? [];
                      const visibleStages = STORED_CROP_STAGES.filter(
                        (key) => (Number(q[key]) || 0) > 0 || picked.includes(key),
                      );
                      const stageOptions = STORED_CROP_STAGES
                        .filter((key) => !visibleStages.includes(key))
                        .map((key) => ({ value: key, label: CROP_STAGE_LABEL[key] }));
                      // A government crop can be planted only up to what was
                      // given to the farmer: what this entry already planted
                      // plus the batch's unplanted stock, and never more
                      // than the quantity given (the server checks the
                      // planted total across every farm).
                      const givenQty = farmerOwned ? null : cropQuantityById.get(c.crop) ?? null;
                      const maxPlanted =
                        farmerOwned || displayQty == null
                          ? undefined
                          : Math.min(savedPlanted + displayQty, givenQty ?? Infinity);
                      const rowError =
                        errors.crops?.[index]?.quantities?.planted?.message ??
                        (maxPlanted != null && (Number(q.planted) || 0) > maxPlanted
                          ? `Only ${givenQty ?? maxPlanted} ${label} ${givenQty === 1 ? "was" : "were"} given to the farmer, so this farm can plant at most ${maxPlanted.toLocaleString()}`
                          : null) ??
                        (staged > (q.planted ?? 0)
                          ? `Stage quantities (${staged}) exceed planted (${q.planted ?? 0})`
                          : staged > savedPlanted
                            ? `Stage quantities (${staged}) exceed the saved planted quantity (${savedPlanted})`
                            : null);

                      return (
                        <div
                          key={c.crop}
                          className="w-full space-y-2 border border-border bg-surface px-3 py-2"
                        >
                          {/* Crop name on the left, planted quantity on the right. */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                              <Wheat className="h-4 w-4 shrink-0 text-accent" />
                              <span className="truncate">{label}</span>
                              {farmerOwned && <FarmerOwnedBadge />}
                            </div>
                            <label className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-secondary">
                                Planted
                              </span>
                              <TextInput
                                type="number"
                                min={0}
                                step={1}
                                max={maxPlanted}
                                value={q.planted ?? ""}
                                onChange={(e) => setCropQuantity(c.crop, "planted", e.target.value)}
                                placeholder={maxPlanted != null ? `Max ${maxPlanted}` : "0"}
                                className="w-28 px-2 py-1.5"
                              />
                            </label>
                          </div>

                          {stagesLocked ? (
                            <p className="text-[11px] text-secondary">
                              Save the farm with the planted quantity first. You can then record its stages when you edit it.
                              {maxPlanted != null && ` Given to the farmer and still unplanted: ${maxPlanted.toLocaleString()}.`}
                            </p>
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-secondary">
                                <span>
                                  {CROP_STAGE_LABEL.newly_planted}:{" "}
                                  <span className="font-semibold text-foreground">
                                    {newlyPlantedQuantity({ ...q, planted: Math.min(Number(q.planted) || 0, savedPlanted) }).toLocaleString()}
                                  </span>
                                  {" · "}Stages total {staged.toLocaleString()} of{" "}
                                  {Math.min(Number(q.planted) || 0, savedPlanted).toLocaleString()} planted
                                </span>
                                {!farmerOwned && displayQty != null && (
                                  <span>Unplanted stock: {displayQty.toLocaleString()}</span>
                                )}
                              </div>

                              {visibleStages.length > 0 && (
                                <div className="space-y-1.5">
                                  {visibleStages.map((key) => {
                                    const max = getQuantityMax(key, q, savedPlanted);
                                    return (
                                      <div key={key} className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium text-foreground">
                                          {CROP_STAGE_LABEL[key]}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <TextInput
                                            type="number"
                                            min={0}
                                            step={1}
                                            max={max}
                                            value={q[key] ?? ""}
                                            onChange={(e) => setCropQuantity(c.crop, key, e.target.value)}
                                            placeholder={`Max ${max}`}
                                            className="w-28 px-2 py-1.5"
                                            autoFocus={addedStageRef.current === `${c.crop}:${key}`}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeStage(c.crop, key)}
                                            className="p-1 text-secondary hover:text-red-600"
                                            aria-label={`Remove ${CROP_STAGE_LABEL[key]}`}
                                            title={`Remove ${CROP_STAGE_LABEL[key]}`}
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {stageOptions.length > 0 && (
                                <div className="flex justify-end">
                                  <Select
                                    value=""
                                    onChange={(key) => addStage(c.crop, key)}
                                    options={stageOptions}
                                    placeholder="Add stage…"
                                  />
                                </div>
                              )}
                            </>
                          )}
                          {rowError && (
                            <p className="text-xs text-red-600">{rowError}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            </>
          ) : (
            <Field label="Association" full error={errors.association?.message}>
              <Controller
                name="association"
                control={control}
                render={({ field }) => (
                  <FullSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={associationOptions}
                    placeholder={
                      associationsLoading
                        ? "Loading associations…"
                        : "Select association…"
                    }
                  />
                )}
              />
            </Field>
          )}

          <Field label="Geotag Location" full error={locationError}>
            <LocationPicker value={location} onChange={onLocationChange} />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
