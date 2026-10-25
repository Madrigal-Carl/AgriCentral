import { Controller } from "react-hook-form";
import { SingleSelect } from "./SingleSelect";
import { Field } from "./Field";
import { useLookups, lookupOptions } from "@/hooks/useLookups";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function LookupSelect({ control, name, type, label, saved, parent, disabled, error, onChange, full }) {
  const lookups = useLookups();
  return <Field label={label} full={full} error={error || (lookups.isError ? getErrorMessage(lookups.error, "Failed to load dropdown options") : undefined)}>
    <Controller control={control} name={name} render={({ field }) => <SingleSelect value={field.value} onChange={(value) => { if (value !== field.value) onChange?.(value); field.onChange(value); }} options={lookupOptions(lookups.data?.[type], field.value === saved?._id ? saved : undefined, parent)} disabled={disabled || lookups.isPending || lookups.isError} allowCreate={false} placeholder={lookups.isPending ? "Loading…" : `Select ${label.toLowerCase()}…`} searchPlaceholder="Search…" />} />
  </Field>;
}
