import { useState } from "react";
import { X } from "lucide-react";
import {
  Button,
  Field,
  FullSelect,
  SingleSelect,
  TextInput,
} from "@/components/ui";
import {
  EQUIPMENTS,
  LIVESTOCKS,
  TYPE_OPTIONS,
  SEVERITY_OPTIONS,
  LIVESTOCK_LIST,
  EQUIPMENT_CATALOG,
} from "@/constants/data";

export function RequestModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const itemOptions =
    form.type === "equipment" ? EQUIPMENT_CATALOG : LIVESTOCK_LIST;

  const onTypeChange = (v) => {
    setForm((f) => ({ ...f, type: v, itemId: "", itemLabel: "" }));
  };

  const onItemChange = (id) => {
    const opt = itemOptions.find((o) => o.value === id);
    setForm((f) => ({ ...f, itemId: id, itemLabel: opt ? opt.label : "" }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.title || !form.itemId) return;
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
            <div className="label-eyebrow mb-1">Request</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Request" : `Edit ${initial.id}`}
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
            <Field label="Title" full>
              <TextInput
                value={form.title}
                onChange={(v) => set("title", v)}
                placeholder="Short summary"
              />
            </Field>
            <Field label="Type">
              <FullSelect
                value={form.type}
                onChange={onTypeChange}
                options={TYPE_OPTIONS}
              />
            </Field>
            <Field label="Severity">
              <FullSelect
                value={form.severity}
                onChange={(v) => set("severity", v)}
                options={SEVERITY_OPTIONS}
              />
            </Field>
            <Field label="Date">
              <TextInput
                type="date"
                value={form.date}
                onChange={(v) => set("date", v)}
              />
            </Field>
            <Field label="Quantity">
              <TextInput
                value={form.quantity}
                onChange={(v) => set("quantity")}
              />
            </Field>
            <Field
              label={form.type === "equipment" ? "Equipment" : "Livestock"}
              full
            >
              <SingleSelect
                value={form.itemId}
                onChange={onItemChange}
                options={itemOptions}
                placeholder={`Select ${form.type}…`}
                searchPlaceholder={`Search ${form.type}…`}
              />
            </Field>
            <Field label="Details" full>
              <textarea
                value={form.details}
                onChange={(e) => set("details", e.target.value)}
                placeholder="Describe the request…"
                rows={5}
                className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground resize-y"
              />
            </Field>
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add Request" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
