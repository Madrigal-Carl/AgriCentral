import { useState } from "react";
import useAuth from "@/hooks/useAuth";
import {
  Button,
  Field,
  SingleSelect,
  TextInput,
  FullSelect,
} from "@/components/ui";
import {
  GENDER_OPTIONS,
  ASSOCIATION_OPTIONS,
  POSITION_OPTIONS,
} from "@/constants/data";
import { FileUploader } from "@/components/public";
import { ModalShell } from "./ModalShell";

export function FarmerModal({ mode, initial, onClose, onSave }) {
  const { role } = useAuth();
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    onSave(form);
  };

  return (
    <ModalShell
      title={mode === "add" ? "Add New Farmer" : `Edit ${initial.name}`}
      eyebrow="Farmer"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" type="submit" form="farmer-form">
            {mode === "add" ? "Add Farmer" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="farmer-form" onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name" full>
            <TextInput
              value={form.name}
              onChange={(v) => set("name", v)}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Contact Number">
            <TextInput
              value={form.contact}
              onChange={(v) => set("contact", v)}
              placeholder="+254 700 000 000"
            />
          </Field>
          <Field label="Email Address">
            <TextInput
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              placeholder="name@email.com"
            />
          </Field>
          <Field label="Gender">
            <FullSelect
              value={form.gender}
              onChange={(v) => set("gender", v)}
              options={GENDER_OPTIONS}
            />
          </Field>
          <Field label="Birth Date">
            <TextInput
              type="date"
              value={form.dob}
              onChange={(v) => set("dob", v)}
            />
          </Field>
          <Field label="Address" full>
            <TextInput
              value={form.address}
              onChange={(v) => set("address", v)}
              placeholder="Street, City"
            />
          </Field>
          {role !== "far" && (
            <Field label="Association" full>
              <SingleSelect
                value={form.association}
                onChange={(v) => set("association", v)}
                options={ASSOCIATION_OPTIONS}
                placeholder="Select association…"
                searchPlaceholder="Search association…"
              />
            </Field>
          )}

          {role === "far" && (
            <Field label="Position" full>
              <FullSelect
                value={form.position}
                onChange={(v) => set("position", v)}
                options={POSITION_OPTIONS}
              />
            </Field>
          )}

          <Field label="Attachments" full>
            <FileUploader
              value={form.files}
              onChange={(v) => set("files", v)}
            />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
