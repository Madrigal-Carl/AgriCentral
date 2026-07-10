import { useState } from "react";
import { Button, Field, FullSelect, TextInput } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { EQUIPMENT_CONDITION_OPTIONS, STATUS_OPTIONS } from "@/constants/data";

export function ManagerEquipmentModal({
  mode,
  initial,
  catalog,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.id || !form.name) return;
    onSave(form);
  };

  return (
    <ModalShell
      eyebrow={`Equipment · ${form.id || "New"}`}
      title={mode === "add" ? "Add New Equipment" : `Edit ${initial.id}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add Equipment" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Equipment Tag ID">
          <TextInput
            value={form.id}
            onChange={(v) => set("id", v)}
            placeholder="EQ-001"
          />
        </Field>
        <Field label="Equipment Name">
          <TextInput
            value={form.name}
            onChange={(v) => set("name", v)}
            placeholder="Tractor, Plough, Harvester…"
          />
        </Field>
        <Field label="Condition">
          <FullSelect
            value={form.condition}
            onChange={(v) => set("condition", v)}
            options={EQUIPMENT_CONDITION_OPTIONS}
          />
        </Field>
      </form>
    </ModalShell>
  );
}
