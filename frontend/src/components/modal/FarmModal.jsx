import { Wheat } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useFarmers } from "@/hooks/useFarmers";
import { useCropsByFarmId } from "@/hooks/useCrops";
import { useAssociations } from "@/hooks/useAssociations";
import useAuth from "@/hooks/useAuth";
import { farmFormSchema, farmUpdateSchema } from "@/schemas/farm.schema";

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

  // Crops shown here are scoped to the farm itself: the backend resolves
  // farmId -> farm.assignedFarmers -> crops whose assignedFarmer is one of
  // those farmers. Only relevant in edit mode (see isEdit gate below) since
  // a brand-new farm has no id yet to scope by.
  const { data: cropsData, isLoading: cropsLoading } = useCropsByFarmId(
    initial?.id,
  );

  const farmerOptions = (farmersData?.farmers ?? []).map((f) => ({
    value: f._id,
    label: f.fullName,
  }));

  const associationOptions = (associationsData?.associations ?? []).map(
    (a) => ({ value: a._id, label: a.name }),
  );

  // The farm object returned by the backend has assignedFarmers/crops.crop/
  // association populated (full objects), but the form + Select components
  // work with plain id strings. Normalize before handing to useForm so all
  // downstream comparisons (.includes(id), Map lookups, etc.) work.
  const normalizedInitial = useMemo(() => {
    if (!initial) return initial;
    return {
      ...initial,
      assignedFarmers: (initial.assignedFarmers ?? []).map((f) =>
        typeof f === "string" ? f : f._id,
      ),
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
      tag: "",
      address: "",
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
  const latitude = watch("latitude");
  const longitude = watch("longitude");

  // crop._id -> assignedFarmer id, so we can tell which farmer "owns" a
  // crop and filter/strip crops when that farmer is unassigned.
  const cropOwnerMap = useMemo(() => {
    const map = new Map();
    (cropsData?.crops ?? []).forEach((c) => {
      map.set(c._id, c.assignedFarmer?._id ?? c.assignedFarmer);
    });
    return map;
  }, [cropsData]);

  // Only offer crops whose owner is a farmer currently checked in the form.
  // Recomputes live as assignedFarmers changes, before saving — so
  // unchecking a farmer immediately drops their crops from the options list.
  const cropOptions = useMemo(() => {
    return (cropsData?.crops ?? [])
      .filter((c) => {
        const ownerId = c.assignedFarmer?._id ?? c.assignedFarmer;
        return assignedFarmers.includes(ownerId);
      })
      .map((c) => ({ value: c._id, label: `${c.name} (${c.kilo} kg)` }));
  }, [cropsData, assignedFarmers]);

  // Keep track of the previous assignedFarmers so we only react to actual
  // removals (avoids stripping crops on unrelated re-renders).
  const prevAssignedFarmersRef = useRef(assignedFarmers);

  useEffect(() => {
    const prev = prevAssignedFarmersRef.current;
    const removedFarmerIds = prev.filter((id) => !assignedFarmers.includes(id));

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

    prevAssignedFarmersRef.current = assignedFarmers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedFarmers, cropOwnerMap]);

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
          <Field label="Farm Tag ID" full error={errors.tag?.message}>
            <TextInput {...register("tag")} placeholder="FM-001" />
          </Field>

          <Field label="Address" full error={errors.address?.message}>
            <TextInput {...register("address")} placeholder="Nakuru, KE" />
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
                  render={({ field }) => (
                    <MultiSelect
                      values={field.value}
                      onChange={field.onChange}
                      options={farmerOptions}
                      placeholder={
                        farmersLoading ? "Loading farmers…" : "Select farmers…"
                      }
                      searchPlaceholder="Search farmer…"
                    />
                  )}
                />
              </Field>

              {isEdit && (
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
                            cropsLoading ? "Loading crops…" : "Select crops…"
                          }
                          searchPlaceholder="Search crop…"
                        />
                      );
                    }}
                  />
                </Field>
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

          {isEdit && crops.length > 0 && (
            <div className="sm:col-span-2 space-y-2">
              {crops.map((c) => {
                const label =
                  cropOptions.find((o) => o.value === c.crop)?.label ?? c.crop;
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
                        onChange={(e) => setCropYield(c.crop, e.target.value)}
                        placeholder="Yield (kg)"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Field label="Geotag Location" full error={locationError}>
            <LocationPicker value={location} onChange={onLocationChange} />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
