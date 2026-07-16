import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, FullSelect, TextInput } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { GENDER_OPTIONS, LIVESTOCK_HEALTH_OPTIONS } from "@/constants/data";
import { useAssociations } from "@/hooks/useAssociations";
import { useCreateLivestock, useUpdateLivestock } from "@/hooks/useLivestocks";
import {
  livestockFormSchema,
  livestockUpdateSchema,
} from "@/schemas/livestock.schema";

export function LivestockModal({ mode, initial, onClose, onSave }) {
  const isEdit = mode === "edit";
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? livestockUpdateSchema : livestockFormSchema),
    defaultValues: {
      propertyNumber: initial.propertyNumber,
      animal: initial.animal,
      breed: initial.breed,
      gender: initial.gender,
      health: initial.health,
      dob: initial.dob,
      color: initial.color,
      weight: initial.weight,
      associationId: initial.associationId || "",
    },
  });

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

    // This modal never touches assignment/status — it mirrors whatever
    // the record already had so those refine rules on the backend
    // (status <-> assignedFarmer) stay satisfied.
    const clearingAssociation = isEdit && !values.associationId;
    const derivedStatus = clearingAssociation
      ? "available"
      : initial.farmer
        ? "assigned"
        : "available";

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
            disabled={busy}
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
        <Field label="Date of Birth" error={errors.dob?.message}>
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
                  onChange={field.onChange}
                  options={associationOptions}
                  defaultValue=""
                />
              )}
            />
          </Field>
        )}
      </form>
    </ModalShell>
  );
}
