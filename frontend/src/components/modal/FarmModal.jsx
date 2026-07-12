import { Wheat } from "lucide-react";
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

  const { data: farmersData, isLoading: farmersLoading } = useFarmers({
    all: true,
  });
  // Crops shown here are scoped to the farm itself: the backend resolves
  // farmId -> farm.assignedFarmers -> crops whose assignedFarmer is one of
  // those farmers. Only relevant in edit mode (see isEdit gate on the
  // Crops field below) since a brand-new farm has no id yet to scope by.
  const { data: cropsData, isLoading: cropsLoading } = useCropsByFarmId(
    initial?.id,
  );

  const farmerOptions = (farmersData?.farmers ?? []).map((f) => ({
    value: f._id,
    label: f.fullName,
  }));
  const cropOptions = (cropsData?.crops ?? []).map((c) => ({
    value: c._id,
    label: c.name,
  }));

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
      latitude: "",
      longitude: "",
      ...initial,
    },
  });

  const crops = watch("crops") || [];
  const latitude = watch("latitude");
  const longitude = watch("longitude");

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
