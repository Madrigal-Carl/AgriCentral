import { useState } from "react";
import { X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, TextInput, SingleSelect } from "@/components/ui";
import useAuth from "@/hooks/useAuth";
import { useFarmersByAssociationId } from "@/hooks/useFarmers";
import { useCreateCrop, useUpdateCrop } from "@/hooks/useCrops";
import { cropFormSchema, cropUpdateSchema } from "@/schemas/crop.schema";

export function CropModal({ mode, initial, onClose, onSave }) {
  const isEdit = mode === "edit";
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? cropUpdateSchema : cropFormSchema),
    defaultValues: initial,
  });

  // Only the farmer(s) that belong to the current user's own association —
  // via GET /farmers/:associationId — rather than every farmer in the system.
  const { user } = useAuth();
  const { data: farmersData, isLoading: farmersLoading } =
    useFarmersByAssociationId(user?.association);
  const farmerOptions = (farmersData?.farmers ?? []).map((f) => ({
    value: f._id,
    label: f.fullName,
  }));

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateCrop({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateCrop({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const busy = isCreating || isUpdating;

  const onSubmit = async (values) => {
    setSubmitError(null);

    const payload = {
      name: values.name,
      kilo: values.kilo,
      assignedFarmer: values.assignedFarmer,
      status: initial.status, // preserved, never user-editable from this modal
    };

    try {
      if (mode === "add") {
        const { crop } = await createMutateAsync(payload);
        onSave?.(crop);
      } else {
        const { crop } = await updateMutateAsync({
          id: initial.id,
          ...payload,
        });
        onSave?.(crop);
      }
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message || err?.message || "Failed to save crop",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden bg-surface border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="label-eyebrow mb-1">Crop</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Crop" : `Edit ${initial.name}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center text-secondary hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          id="crop-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          {submitError && (
            <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <Field label="Crop Name" error={errors.name?.message}>
              <TextInput {...register("name")} placeholder="Maize" />
            </Field>
            <Field label="Kilogram" error={errors.kilo?.message}>
              <TextInput
                type="number"
                step="0.01"
                inputMode="decimal"
                {...register("kilo", { valueAsNumber: true })}
                error={errors.kilo?.message}
                placeholder="e.g. 1200.5"
              />
            </Field>
            <Field label="Assign Farmer" error={errors.assignedFarmer?.message}>
              <Controller
                name="assignedFarmer"
                control={control}
                render={({ field }) => (
                  <SingleSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={farmerOptions}
                    error={errors.assignedFarmer?.message}
                    placeholder={
                      farmersLoading ? "Loading farmers…" : "Select farmer…"
                    }
                    searchPlaceholder="Search farmer…"
                  />
                )}
              />
            </Field>
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
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
            form="crop-form"
            disabled={busy}
          >
            {busy ? "Saving…" : mode === "add" ? "Add Crop" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
