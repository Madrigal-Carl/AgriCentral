import { useState } from "react";
import {
  Button,
  Field,
  FullSelect,
  TextInput,
  SingleSelect,
} from "@/components/ui";
import { ModalShell } from "./ModalShell";
import {
  ANIMAL_OPTIONS,
  LIVESTOCK_CATALOG,
  GENDER_OPTIONS,
} from "@/constants/data";

export function ManagerLivestockModal({
  mode,
  initial,
  animalCatalog,
  breedCatalog,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e?.preventDefault();
    if (!form.tag || !form.animal || !form.breed) return;
    onSave(form);
  };

  return (
    <ModalShell
      eyebrow={`Livestock · ${form.id || "New"}`}
      title={mode === "add" ? "Add New Livestock" : `Edit ${initial.id}`}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add Livestock" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Livestock Tag ID" full>
          <TextInput
            value={form.tag}
            onChange={(v) => set("tag", v)}
            placeholder="e.g. Cow #A-204"
          />
        </Field>
        <Field label="Animal Type">
          <SingleSelect
            value={form.animal}
            onChange={(v) => set("animal", v)}
            options={animalCatalog}
            placeholder="Select animal type…"
            searchPlaceholder="Search or add animal type…"
            allowCreate
          />
        </Field>
        <Field label="Breed">
          <SingleSelect
            value={form.breed}
            onChange={(v) => set("breed", v)}
            options={breedCatalog}
            placeholder="Select breed…"
            searchPlaceholder="Search or add breed…"
            allowCreate
          />
        </Field>
        <Field label="Gender">
          <FullSelect
            value={form.gender}
            onChange={(v) => set("gender", v)}
            options={GENDER_OPTIONS}
          />
        </Field>
        <Field label="Date of Birth">
          <TextInput
            type="date"
            value={form.dob}
            onChange={(v) => set("dob", v)}
          />
        </Field>
        <Field label="Color">
          <TextInput
            value={form.color}
            onChange={(v) => set("color", v)}
            placeholder="e.g. Brown & White"
          />
        </Field>
        <Field label="Weight (kg)">
          <TextInput
            min="0"
            step="0.1"
            value={form.weight}
            onChange={(v) => set("weight", v)}
            placeholder="0.0"
          />
        </Field>
      </form>
    </ModalShell>
  );
}
