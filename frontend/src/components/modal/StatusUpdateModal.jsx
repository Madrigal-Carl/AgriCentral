import { useState } from "react";
import { Button, Field, FullSelect } from "@/components/ui";
import { ModalShell } from "./ModalShell";

export function StatusUpdateModal({
  row,
  onClose,
  onSave,
  entityLabel = "Item",
  fieldLabel = "Status",
  statusField = "status",
  options,
}) {
  const [value, setValue] = useState(row[statusField]);

  const submit = (e) => {
    e.preventDefault();
    onSave(value);
  };

  return (
    <ModalShell
      eyebrow={`${entityLabel} · ${row.id}`}
      title={`Update Status — ${row.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <Field label={fieldLabel}>
          <FullSelect value={value} onChange={setValue} options={options} />
        </Field>
      </form>
    </ModalShell>
  );
}
