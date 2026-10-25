import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalShell } from "./ModalShell";
import { Field, TextInput, SingleSelect, Button } from "@/components/ui";
import { useLookups, lookupOptions, referenceId } from "@/hooks/useLookups";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function MaintenanceModal({ config, initial, onClose, onSave }) {
  const [submitError, setSubmitError] = useState(null);
  const { data: lookups = {}, isLoading, isError, error } = useLookups();
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(config.schema),
    defaultValues: { name: initial?.name ?? "", ...(config.parent ? { [config.parent]: referenceId(initial?.[config.parent]) } : {}) },
  });
  const mutation = config.useMutation(config.type);
  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      await mutation.mutateAsync({ ...values, ...(initial ? { id: initial._id } : {}) });
      onSave();
    } catch (err) { setSubmitError(getErrorMessage(err)); }
  };
  return (
    <ModalShell title={`${initial ? "Edit" : "Add"} ${config.label}`} eyebrow="Maintenance" onClose={onClose}
      footer={<><Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button><Button variant="accent" type="submit" form="maintenance-form" disabled={mutation.isPending || isLoading || isError}>{mutation.isPending ? "Saving…" : "Save"}</Button></>}>
      <form id="maintenance-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
        {(submitError || isError) && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{submitError || getErrorMessage(error)}</div>}
        {config.fields.map((item) => <Field key={item.key} label={item.label} error={errors[item.key]?.message}>
          {item.type === "text" ? <TextInput {...register(item.key)} /> : <Controller name={item.key} control={control} render={({ field }) => <SingleSelect value={field.value} onChange={field.onChange} options={lookupOptions(lookups[item.lookup], field.value === initial?.[item.key]?._id ? initial?.[item.key] : undefined)} placeholder={`Select ${item.label.toLowerCase()}…`} searchPlaceholder="Search…" allowCreate={false} />} />}
        </Field>)}
      </form>
    </ModalShell>
  );
}
