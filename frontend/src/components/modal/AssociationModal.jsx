import { useState } from "react";
import { Button } from "@/components/ui";
import { ModalShell } from "./ModalShell";

export function AssociationModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const isValid = form.name.trim().length > 0;

  const submit = (e) => {
    e.preventDefault();
    if (!isValid) {
      setTouched(true);
      return;
    }
    onSave(form);
  };

  return (
    <ModalShell
      eyebrow="Association"
      title={mode === "add" ? "Add New Association" : `Edit ${initial.id}`}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" type="submit" form="association-form">
            {mode === "add" ? "Add Association" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="association-form" onSubmit={submit}>
        <label className="label-eyebrow mb-1.5 block">Association Name</label>
        <input
          autoFocus
          value={form.name}
          onChange={(e) => {
            set("name", e.target.value);
            if (touched) setTouched(false);
          }}
          placeholder="e.g. Boac, Marinduque"
          className={`w-full border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground ${
            touched && !isValid ? "border-danger" : "border-border"
          }`}
        />
        {touched && !isValid && (
          <p className="mt-1 text-xs text-danger">
            Association name is required.
          </p>
        )}
      </form>
    </ModalShell>
  );
}
