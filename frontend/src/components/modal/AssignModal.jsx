import { useState } from "react";
import { Button, Field, SingleSelect } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { assignmentReason } from "@/utils/assignment";
import { z } from "zod";

export function AssignModal({ row, options = [], loading, onClose, onSave }) {
  const [farmer, setFarmer] = useState(row.assignedFarmer?._id || "");
  const reason = assignmentReason(row.animal ? "livestock" : "equipment", row.condition);

  const submit = (e) => {
    e.preventDefault();
    if (!z.string().min(1).refine(() => !reason).safeParse(farmer).success) return;
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
          <Button variant="accent" onClick={submit} type="submit" disabled={!!reason || loading}>
            Assign
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <Field label="Assigned Farmer" error={reason}>
          <SingleSelect
            value={farmer}
            onChange={setFarmer}
            options={options}
            disabled={loading || !!reason}
            placeholder={loading ? "Loading farmers…" : "Select farmer…"}
            searchPlaceholder="Search farmer…"
          />
        </Field>
      </form>
    </ModalShell>
  );
}
