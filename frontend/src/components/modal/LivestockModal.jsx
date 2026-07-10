import { useState } from "react";
import {
  Button,
  Field,
  FullSelect,
  TextInput,
  SingleSelect,
} from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { LIVESTOCK_LIST, LIVESTOCK_HEALTH_OPTIONS } from "@/constants/data";

export function LivestockModal({ initial, existingIds, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const available = LIVESTOCK_LIST.filter((c) => !existingIds.includes(c.id));
  const submit = (e) => {
    e?.preventDefault();
    if (!form.catalogId || !form.acquisitionDate) return;
    onSave(form);
  };
  return (
    <ModalShell
      title="Add New Livestock"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            Add Livestock
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Livestock" full>
          <SingleSelect
            value={form.catalogId}
            onChange={(v) => set("catalogId", v)}
            options={available}
            placeholder="Select livestock…"
            searchPlaceholder="Search or add livestock…"
            allowCreate
          />
        </Field>
        <Field label="Status (Health)" full>
          <FullSelect
            value={form.health}
            onChange={(v) => set("health", v)}
            options={LIVESTOCK_HEALTH_OPTIONS}
          />
        </Field>
        <Field label="Acquisition Date" full>
          <TextInput
            type="date"
            value={form.acquisitionDate}
            onChange={(v) => set("acquisitionDate", v)}
          />
        </Field>
      </form>
    </ModalShell>
  );
}
