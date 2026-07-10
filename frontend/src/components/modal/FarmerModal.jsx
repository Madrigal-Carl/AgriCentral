import { useState } from "react";
import { X } from "lucide-react";
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden bg-surface border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="label-eyebrow mb-1">Farmer</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Farmer" : `Edit ${initial.name}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center text-secondary hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5">
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

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add Farmer" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
