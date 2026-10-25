import { useWatch } from "react-hook-form";
import { LookupSelect } from "@/components/ui/LookupSelect";
import { Field, TextInput } from "@/components/ui";
import { referenceId } from "@/hooks/useLookups";

export function LocationFields({ control, setValue, register, initial, errors, street = false }) {
  const municipality = useWatch({ control, name: "municipality" });
  return <>
    <LookupSelect control={control} name="municipality" type="municipalities" label="Municipality" saved={initial?.municipality} error={errors.municipality?.message} onChange={() => setValue("barangay", "", { shouldValidate: true })} />
    <LookupSelect control={control} name="barangay" type="barangays" label="Barangay" saved={municipality === referenceId(initial?.municipality) ? initial?.barangay : undefined} parent={municipality} disabled={!municipality} error={errors.barangay?.message} />
    {street && <Field label="Street / Purok (Optional)" error={errors.street?.message} full><TextInput {...register("street")} /></Field>}
  </>;
}
