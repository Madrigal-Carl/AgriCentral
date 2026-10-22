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
