import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col overflow-hidden bg-surface border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="label-eyebrow mb-1">Association</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Association" : `Edit ${initial.id}`}
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

        <form onSubmit={submit} className="flex-1 px-6 py-5">
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

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add Association" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
