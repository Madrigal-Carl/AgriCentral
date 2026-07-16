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

  // The farm object returned by the backend has assignedFarmers[].farmer/
  // crops.crop/association populated (full objects), but the form + Select
  // components work with plain id strings. Normalize before handing to
  // useForm so all downstream comparisons (.includes(id), Map lookups,
  // etc.) work. assignedFarmers keeps its {farmer, classification} shape —
  // just unwraps the farmer object down to its id.
  const normalizedInitial = useMemo(() => {
    if (!initial) return initial;
    return {
      ...initial,
      assignedFarmers: (initial.assignedFarmers ?? []).map((a) => ({
        farmer: typeof a.farmer === "string" ? a.farmer : a.farmer._id,
        classification: a.classification ?? "farm_worker",
      })),
      crops: (initial.crops ?? []).map((c) => ({
        ...c,
        crop: typeof c.crop === "string" ? c.crop : c.crop._id,
      })),
      association:
        initial.association == null
          ? initial.association
          : typeof initial.association === "string"
            ? initial.association
            : initial.association._id,
    };
  }, [initial]);

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

  // allCrops is already the union of the currently assigned farmers' own
  // crops (each per-farmer query is scoped server-side), so no extra
  // filtering by assignedFarmerIds is needed here.
  const cropOptions = useMemo(() => {
    return allCrops.map((c) => ({
      value: c._id,
      label: `${c.name} (${c.kilo} kg)`,
    }));
  }, [allCrops]);

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
  // classification, defaults new ones to "owner".
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

  const setCropStatus = (cropId, status) => {
    setValue(
      "crops",
      crops.map((c) => (c.crop === cropId ? { ...c, status } : c)),
      { shouldValidate: true },
    );
  };
  const setCropYield = (cropId, yieldValue) => {
    setValue(
      "crops",
      crops.map((c) => (c.crop === cropId ? { ...c, yield: yieldValue } : c)),
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

  const onSubmit = (values) => {
    onSave({ id: initial.id, ...values });
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
                        nextIds.map((id) => ({
                          crop: id,
                          status: existing.get(id)?.status ?? "planted",
                          yield: existing.get(id)?.yield ?? 0,
                        })),
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
                    const label =
                      cropOptions.find((o) => o.value === c.crop)?.label ??
                      c.crop;
                    return (
                      <div
                        key={c.crop}
                        className="flex flex-col gap-2 bg-surface border border-border px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Wheat className="h-4 w-4 text-accent" />
                            {label}
                          </div>
                          <FullSelect
                            value={c.status}
                            onChange={(v) => setCropStatus(c.crop, v)}
                            options={CROP_STATUS_OPTIONS}
                          />
                        </div>
                        {c.status === "harvested" && (
                          <TextInput
                            type="number"
                            value={c.yield ?? 0}
                            onChange={(e) =>
                              setCropYield(c.crop, e.target.value)
                            }
                            placeholder="Yield (kg)"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
