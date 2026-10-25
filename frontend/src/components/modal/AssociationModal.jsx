import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, TextInput } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { LocationFields } from "./LocationFields";
import { referenceId } from "@/hooks/useLookups";
import {
  associationFormSchema,
  associationUpdateSchema,
} from "@/schemas/association.schema";

export function AssociationModal({
  mode,
  initial,
  submitError,
  busy,
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      isEdit ? associationUpdateSchema : associationFormSchema,
    ),
    defaultValues: {
      name: initial?.name ?? "",
      municipality: referenceId(initial?.municipality),
      barangay: referenceId(initial?.barangay),
    },
  });

  const onSubmit = (values) => {
    onSave(values);
  };

  return (
    <ModalShell
      eyebrow="Association"
      title={mode === "add" ? "Add New Association" : `Edit ${initial.name}`}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="accent"
            type="submit"
            form="association-form"
            disabled={busy}
          >
            {busy
              ? "Saving…"
              : mode === "add"
                ? "Add Association"
                : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="association-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
        {submitError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <Field label="Association Name" error={errors.name?.message}>
          <TextInput
            autoFocus
            {...register("name")}
            placeholder="Association name"
          />
        </Field>
        <LocationFields control={control} setValue={setValue} register={register} initial={initial} errors={errors} />
      </form>
    </ModalShell>
  );
}
