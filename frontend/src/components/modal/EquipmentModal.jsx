import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, FullSelect, TextInput } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { EQUIPMENT_CONDITION_OPTIONS } from "@/constants/data";
import { useAssociations } from "@/hooks/useAssociations";
import { useCreateEquipment, useUpdateEquipment } from "@/hooks/useEquipments";
import {
  equipmentFormSchema,
  equipmentUpdateSchema,
} from "@/schemas/equipment.schema";

export function EquipmentModal({ mode, initial, onClose, onSave }) {
  const isEdit = mode === "edit";
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? equipmentUpdateSchema : equipmentFormSchema),
    defaultValues: {
      tag: initial.id,
      name: initial.name,
      condition: initial.condition,
      associationId: initial.associationId || "",
    },
  });

  const { data: associationsData } = useAssociations({ all: true });
  const associationOptions = (associationsData?.associations ?? []).map(
    (a) => ({ value: a._id, label: a.name }),
  );

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateEquipment({
      onError: (err) =>
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        ),
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateEquipment({
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
    const derivedStatus = initial.farmer ? "assigned" : "available";

    const payload = {
      tag: values.tag,
      name: values.name,
      condition: values.condition,
      status: derivedStatus,
      ...(values.associationId ? { associationId: values.associationId } : {}),
      ...(isEdit
        ? { assignedFarmer: initial.farmer || null }
        : initial.farmer
          ? { assignedFarmer: initial.farmer }
          : {}),
    };

    try {
      if (mode === "add") {
        const { equipment } = await createMutateAsync(payload);
        onSave?.(equipment);
      } else {
        const { equipment } = await updateMutateAsync({
          id: initial._id,
          ...payload,
        });
        onSave?.(equipment);
      }
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to save equipment",
      );
    }
  };

  return (
    <ModalShell
      eyebrow={`Equipment · ${initial.id || "New"}`}
      title={mode === "add" ? "Add New Equipment" : `Edit ${initial.id}`}
      onClose={onClose}
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
            form="equipment-form"
            disabled={busy}
          >
            {busy
              ? "Saving…"
              : mode === "add"
                ? "Add Equipment"
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
        id="equipment-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <Field label="Equipment Tag ID" error={errors.tag?.message}>
          <TextInput {...register("tag")} placeholder="EQ-001" />
        </Field>
        <Field label="Equipment Name" error={errors.name?.message}>
          <TextInput
            {...register("name")}
            placeholder="Tractor, Plough, Harvester…"
          />
        </Field>
        <Field label="Condition" error={errors.condition?.message}>
          <Controller
            name="condition"
            control={control}
            render={({ field }) => (
              <FullSelect
                value={field.value}
                onChange={field.onChange}
                options={EQUIPMENT_CONDITION_OPTIONS}
              />
            )}
          />
        </Field>
        <Field label="Association" error={errors.associationId?.message}>
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
      </form>
    </ModalShell>
  );
}
