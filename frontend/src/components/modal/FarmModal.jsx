import { Wheat, Users } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueries } from "@tanstack/react-query";
import {
  Field,
  TextInput,
  FullSelect,
  MultiSelect,
  Button,
} from "@/components/ui";
import { CROP_STATUS_OPTIONS } from "@/constants/data";
import { LocationPicker } from "@/components/public";
import { ModalShell } from "./ModalShell";
import { useFarmers, farmerKeys } from "@/hooks/useFarmers";
import { getCropsByFarmerId } from "@/services/farmer.service";
import { useAssociations } from "@/hooks/useAssociations";
import useAuth from "@/hooks/useAuth";
import {
  farmFormSchema,
  farmUpdateSchema,
  FARMER_CLASSIFICATION_OPTIONS,
} from "@/schemas/farm.schema";

const inferCropStage = (quantities) => {
  const q = quantities ?? {};
  return q.growing != null ? "growing" : "planted";
};

const TERMINAL_STATUSES = ["withered", "harvested", "damaged"];

const getAvailableQuantity = (quantities, status, plantableCeiling) => {
  const q = quantities ?? {};
  if (status === "planted") return plantableCeiling ?? null;

  const planted = q.planted ?? 0;
  const claimedByTerminals = TERMINAL_STATUSES.filter(
    (s) => s !== status,
  ).reduce((sum, s) => sum + (q[s] ?? 0), 0);

  return Math.max(planted - claimedByTerminals, 0);
};

const getRemainingQuantity = (quantities) => {
  const q = quantities ?? {};
  const planted = q.planted ?? 0;
  const claimed = (q.withered ?? 0) + (q.harvested ?? 0) + (q.damaged ?? 0);
  return Math.max(planted - claimed, 0);
};

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

  // A crop entry stays editable here as long as it still has unclaimed
  // planted/growing stock (see getRemainingQuantity). Only once
  // withered+harvested+damaged have fully consumed the planted pool does
  // it drop out ("frozen"), since at that point there's nothing left to
  // manage on that specific entry — a fresh selection of the same crop
  // should start a brand-new entry, not resume this one.
  const editableInitialCrops = useMemo(
    () =>
      (initial?.crops ?? []).filter(
        (c) => getRemainingQuantity(c.quantities) > 0,
      ),
    [initial],
  );

  // The farm object returned by the backend has assignedFarmers[].farmer/
  // crops.crop/association populated (full objects), but the form + Select
  // components work with plain id strings. Normalize before handing to
  // useForm so all downstream comparisons (.includes(id), Map lookups,
  // etc.) work. assignedFarmers keeps its {farmer, classification} shape —
  // just unwraps the farmer object down to its id. `status` per crop is
  // freshly inferred here since the backend no longer sends one. `_id`
  // (the crop-entry id, distinct from the crop id) is carried through so
  // the backend can tell "this is the same entry, edited" apart from "this
  // is a new entry" when the crops array is submitted.
  const normalizedInitial = useMemo(() => {
    if (!initial) return initial;
    return {
      ...initial,
      assignedFarmers: (initial.assignedFarmers ?? []).map((a) => ({
        farmer: typeof a.farmer === "string" ? a.farmer : a.farmer._id,
        classification: a.classification ?? "farm_worker",
      })),
      crops: editableInitialCrops.map((c) => ({
        _id: c._id,
        crop: typeof c.crop === "string" ? c.crop : c.crop._id,
        quantities: c.quantities ?? {},
        status: inferCropStage(c.quantities),
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
  // crop's only existing entry is already finished (fully withered/
  // harvested/damaged), it has no entry here, so re-selecting that crop in
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

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
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
    allCrops.forEach((c) => {
      map.set(c._id, c.assignedFarmer?._id ?? c.assignedFarmer);
    });
    return map;
  }, [allCrops]);

  // crop._id -> live unplanted stock. Sourced from two places: the
  // farmer-scoped "available crops" query (allCrops) for crops still
  // selectable there, and the farm's own populated crop docs (initial.crops)
  // for crops that have already been fully used up and dropped out of that
  // query. This alone is the "already subtracted" number — combined with
  // an entry's own committed `planted` via getDisplayUnplanted below, it
  // becomes the "not yet subtracted" ceiling for an in-progress entry.
  // Moved above cropOptions/getDisplayUnplanted since both depend on it.
  const cropUnplantedById = useMemo(() => {
    const map = new Map();
    allCrops.forEach((c) => map.set(c._id, c.unplanted));
    (initial?.crops ?? []).forEach((c) => {
      if (typeof c.crop === "string" || !c.crop) return;
      if (!map.has(c.crop._id)) map.set(c.crop._id, c.crop.unplanted);
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
    return map;
  }, [allCrops, initialCropNameById]);

  // Returns the quantity to DISPLAY for a crop, given how much a specific
  // entry has already committed to `planted`. For an entry that's still
  // in progress on this farm (committedPlanted > 0, carried over from its
  // existing quantities), this adds that commitment back on top of the
  // live unplanted count — so the number reads as the full pool this
  // entry could still be edited up to, not net of its own subtraction.
  // For a brand-new pick (committedPlanted defaults to 0 — nothing of
  // this entry has been planted yet, whether it's a fresh replant on this
  // farm or a pick destined for a different farm), this collapses to the
  // live, already-subtracted number with no special-casing needed.
  const getDisplayUnplanted = (cropId, committedPlanted = 0) => {
    const live = cropUnplantedById.get(cropId);
    return live != null ? live + committedPlanted : null;
  };

  // allCrops is the union of the currently assigned farmers' *available*
  // crops (each per-farmer query is scoped server-side, already net of
  // every commitment). That excludes any crop that's fully tied up on
  // this farm, so we backfill those from cropNameById/getDisplayUnplanted
  // — labeled with the "not yet subtracted" ceiling, since they're already
  // committed to an open entry on this farm and could still be adjusted.
  const cropOptions = useMemo(() => {
    const fromQuery = allCrops.map((c) => ({
      value: c._id,
      label: `${c.unplanted} ${c.name}`,
    }));

    const selectedIds = new Set(crops.map((c) => c.crop));
    const known = new Set(fromQuery.map((o) => o.value));
    const missing = [...selectedIds]
      .filter((id) => !known.has(id) && cropNameById.has(id))
      .map((id) => {
        const committedPlanted =
          crops.find((c) => c.crop === id)?.quantities?.planted ?? 0;
        const displayQty = getDisplayUnplanted(id, committedPlanted);
        const name = cropNameById.get(id);
        return {
          value: id,
          label: displayQty != null ? `${displayQty} ${name}` : name,
        };
      });

    return [...fromQuery, ...missing];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCrops, crops, cropNameById, cropUnplantedById]);

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

  // Purely local — moves the quantity selector to a different slot; never
  // persisted, so this doesn't touch `quantities` at all.
  const setCropStatus = (cropId, status) => {
    setValue(
      "crops",
      crops.map((c) => (c.crop === cropId ? { ...c, status } : c)),
      { shouldValidate: true },
    );
  };

  // Only the field for the currently-selected slot is editable at a time —
  // this always writes into quantities[status], never a different slot, so
  // a crop's history in the other slots is left untouched.
  const setCropQuantity = (cropId, status, rawValue) => {
    const value = rawValue === "" ? null : Number(rawValue);
    setValue(
      "crops",
      crops.map((c) =>
        c.crop === cropId
          ? { ...c, quantities: { ...c.quantities, [status]: value } }
          : c,
      ),
      { shouldValidate: true },
    );
  };

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
  // entry was removed" and gets its planted stock refunded to `unplanted`
  // — which is wrong for an entry that's simply fully harvested/withered/
  // damaged, not actually deleted. Each one keeps its `_id` so the backend
  // matches it back to the same entry rather than treating it as new.
  const frozenCrops = useMemo(
    () =>
      (initial?.crops ?? [])
        .filter((c) => getRemainingQuantity(c.quantities) === 0)
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
          <Field label="Address" full error={errors.address?.message}>
            <TextInput {...register("address")} placeholder="Nakuru, KE" />
          </Field>

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
                      const onCropsChange = (nextIds) => {
                        const existing = new Map(
                          field.value.map((c) => [c.crop, c]),
                        );
                        field.onChange(
                          nextIds.map((id) => {
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
                            const quantities = openEntry?.quantities ?? {};
                            return {
                              _id: openEntry?._id,
                              crop: id,
                              status: inferCropStage(quantities),
                              quantities,
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

                {crops.length > 0 && (
                  <div className="sm:col-span-2 space-y-2">
                    {crops.map((c) => {
                      const committedPlanted = c.quantities?.planted ?? 0;
                      // "Not yet subtracted" for an in-progress entry (has
                      // its own commitment already), naturally becomes the
                      // live subtracted number for a fresh pick (commitment
                      // is 0) — see getDisplayUnplanted above.
                      const displayQty = getDisplayUnplanted(
                        c.crop,
                        committedPlanted,
                      );
                      const cropName = cropNameById.get(c.crop);
                      const label = cropName
                        ? displayQty != null
                          ? `${displayQty} ${cropName}`
                          : cropName
                        : (cropOptions.find((o) => o.value === c.crop)?.label ??
                          c.crop);
                      const statusLabel =
                        CROP_STATUS_OPTIONS.find((o) => o.value === c.status)
                          ?.label ?? c.status;
                      const available = getAvailableQuantity(
                        c.quantities,
                        c.status,
                        displayQty,
                      );
                      const currentQuantity = c.quantities?.[c.status] ?? "";

                      return (
                        <div
                          key={c.crop}
                          className="flex items-center gap-3 w-full bg-surface border border-border px-3 py-2"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground flex-1 min-w-0">
                            <Wheat className="h-4 w-4 shrink-0 text-accent" />
                            <span className="truncate">{label}</span>
                          </div>
                          <FullSelect
                            value={c.status}
                            onChange={(v) => setCropStatus(c.crop, v)}
                            options={CROP_STATUS_OPTIONS}
                          />
                          <div className="w-28 shrink-0">
                            <TextInput
                              type="number"
                              min={0}
                              max={available ?? undefined}
                              value={currentQuantity}
                              onChange={(e) =>
                                setCropQuantity(
                                  c.crop,
                                  c.status,
                                  e.target.value,
                                )
                              }
                              placeholder={
                                available != null
                                  ? `Max ${available}`
                                  : "Quantity"
                              }
                            />
                          </div>
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
