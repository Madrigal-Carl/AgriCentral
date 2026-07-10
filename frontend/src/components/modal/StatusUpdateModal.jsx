import { useState } from "react";
import { Button, Field, FullSelect } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { EQUIPMENT_CONDITION_OPTIONS } from "@/constants/data";

export function StatusUpdateModal({ row, onClose, onSave }) {
  const [condition, setCondition] = useState(row.condition);
  const submit = (e) => {
    e.preventDefault();
    onSave(condition);
  };
  return (
    <ModalShell
      eyebrow={`Equipment · ${row.id}`}
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
        <Field label="Condition">
          <FullSelect
            value={condition}
            onChange={setCondition}
            options={EQUIPMENT_CONDITION_OPTIONS}
          />
        </Field>
      </form>
    </ModalShell>
  );
}
