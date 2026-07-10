import { useState } from "react";
import { Button, Field, SingleSelect } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { FARMER_OPTIONS } from "@/constants/data";

export function AssignModal({ row, onClose, onSave }) {
  const [farmer, setFarmer] = useState(row.farmer || "");
  const submit = (e) => {
    e.preventDefault();
    if (!farmer) return;
    onSave(farmer);
  };
  return (
    <ModalShell
      eyebrow={`Equipment · ${row.id}`}
      title={`Assign ${row.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            Assign
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <Field label="Assigned Farmer">
          <SingleSelect
            value={farmer}
            onChange={setFarmer}
            options={FARMER_OPTIONS}
            placeholder="Select farmer…"
            searchPlaceholder="Search farmer…"
          />
        </Field>
      </form>
    </ModalShell>
  );
}
