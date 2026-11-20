import { Controller } from "react-hook-form";
import { SingleSelect } from "./SingleSelect";
import { Field } from "./Field";
import { useLookups } from "@/hooks/useLookups";
import { getErrorMessage } from "@/utils/getErrorMessage";

// Searchable title dropdown fed by the maintained request/report titles
// (`type` is "requestTitles" or "reportTitles"). Titles are stored by name,
// so a saved title no longer in the list (archived or legacy free text)
// stays selectable while editing that record.
export function TitleSelect({ control, name = "title", type, saved, error, label = "Title", full = true }) {
  const lookups = useLookups();
  const options = (lookups.data?.[type] ?? []).map((item) => ({ value: item.name, label: item.name }));
  if (saved && !options.some((option) => option.value === saved)) options.unshift({ value: saved, label: `${saved} (not in list)` });
  return (
    <Field label={label} full={full} error={error || (lookups.isError ? getErrorMessage(lookups.error, "Failed to load titles") : undefined)}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <SingleSelect
            value={field.value}
            onChange={field.onChange}
            options={options}
            disabled={lookups.isPending || lookups.isError}
            allowCreate={false}
            placeholder={lookups.isPending ? "Loading…" : options.length ? "Select a title…" : "No titles available"}
            searchPlaceholder="Search titles…"
          />
        )}
      />
    </Field>
  );
}
