import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, FullSelect, TextInput } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { LookupSelect } from "@/components/ui/LookupSelect";
import { referenceId } from "@/hooks/useLookups";
import { EQUIPMENT_CONDITION_OPTIONS } from "@/constants/data";
import { useAssociations } from "@/hooks/useAssociations";
import { useCreateEquipment, useUpdateEquipment } from "@/hooks/useEquipments";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { assignmentReason } from "@/utils/assignment";
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
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver((isEdit ? equipmentUpdateSchema : equipmentFormSchema).superRefine((values, ctx) => {
      const reason = assignmentReason("equipment", values.condition);
      if (reason && values.associationId && (!isEdit || values.associationId !== initial.associationId)) {
        ctx.addIssue({ code: "custom", message: reason, path: ["associationId"] });
      }
    })),
    defaultValues: {
      propertyNumber: initial.id,
      equipmentType: referenceId(initial.equipmentType),
      condition: initial.condition,
      associationId: initial.associationId || "",
    },
  });

  const { data: associationsData } = useAssociations({ all: true });

  const associationOptions = [
    { value: "", label: "No Association (Return Equipment)" },
    ...(associationsData?.associations ?? []).map((a) => ({
      value: a._id,
      label: a.name,
    })),
  ];

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

    const clearingAssociation = isEdit && !values.associationId;
    const derivedStatus = values.associationId ? "assigned" : "available";

    const payload = {
      propertyNumber: values.propertyNumber,
      equipmentType: values.equipmentType,
      condition: values.condition,
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
      const message = getErrorMessage(err, "Failed to save equipment");
      if (message === "Property number is already in use") {
        setError("propertyNumber", { type: "server", message });
      }
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
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
        <Field label="Property Number" error={errors.propertyNumber?.message}>
          <TextInput {...register("propertyNumber")} placeholder="EQ-001" />
        </Field>
        <LookupSelect control={control} name="equipmentType" type="equipments" label="Equipment" saved={initial.equipmentType} error={errors.equipmentType?.message} />
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
        {!initial.reservedBy && (
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
        )}
      </form>
    </ModalShell>
  );
}
