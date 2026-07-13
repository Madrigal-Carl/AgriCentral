import { useState } from "react";
import { Button, Field, SingleSelect } from "@/components/ui";
import { ModalShell } from "./ModalShell";

export function AssignModal({ row, options = [], loading, onClose, onSave }) {
  const [farmer, setFarmer] = useState(row.assignedFarmer?._id || "");

  const submit = (e) => {
    e.preventDefault();
    if (!farmer) return;
    onSave(farmer);
  };

  return (
    <ModalShell
      eyebrow={`Equipment · ${row.tag}`}
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
            options={options}
            disabled={loading}
            placeholder={loading ? "Loading farmers…" : "Select farmer…"}
            searchPlaceholder="Search farmer…"
          />
        </Field>
      </form>
    </ModalShell>
  );
}
