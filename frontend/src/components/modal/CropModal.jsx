import { useState } from "react";
import { X } from "lucide-react";
import { Button, Field, TextInput, SingleSelect } from "@/components/ui";
import { FARMER_OPTIONS } from "@/constants/data";

export function CropModal({ mode, initial, onClose, onSave }) {
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
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden bg-surface border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="label-eyebrow mb-1">Crop</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Crop" : `Edit ${initial.name}`}
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
          <div className="grid grid-cols-1 gap-4">
            <Field label="Crop Name">
              <TextInput
                value={form.name}
                onChange={(v) => set("name", v)}
                placeholder="Maize"
              />
            </Field>
            <Field label="Kilogram">
              <TextInput
                type="number"
                value={form.kilos}
                onChange={(v) => set("kilos", v)}
                placeholder="e.g. 1200"
              />
            </Field>
            <Field label="Assign Farmer">
              <SingleSelect
                value={form.farmer}
                onChange={(v) => set("farmer", v)}
                options={FARMER_OPTIONS}
                placeholder="Select farmer…"
                searchPlaceholder="Search farmer…"
              />
            </Field>
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add Crop" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
