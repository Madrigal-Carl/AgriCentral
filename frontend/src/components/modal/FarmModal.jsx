import { Field, TextInput, FullSelect, MultiSelect } from "@/components/ui";
import { useState } from "react";
import { X, Wheat } from "lucide-react";
import {
  FARMER_OPTIONS,
  CROP_OPTIONS,
  CROP_STATUS_OPTIONS,
} from "@/constants/data";
import { Button } from "@/components/ui";
import { LocationPicker } from "@/components/public";

export function FarmModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.address) return;
    onSave(form);
  };

  const cropNames = form.crops.map((c) => c.crop);
  const onCropsChange = (next) => {
    const map = new Map(form.crops.map((c) => [c.crop, c.status]));
    const merged = next.map((name) => ({
      crop: name,
      status: map.get(name) ?? "planted",
    }));
    set("crops", merged);
  };
  const setCropStatus = (crop, status) => {
    set(
      "crops",
      form.crops.map((c) => (c.crop === crop ? { ...c, status } : c)),
    );
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
            <div className="label-eyebrow mb-1">Farm</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Farm" : `Edit ${initial.address}`}
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
            <Field label="Farm Tag ID" full>
              <TextInput
                value={form.id}
                onChange={(v) => set("id", v)}
                placeholder="FM-001"
              />
            </Field>
            <Field label="Address" full>
              <TextInput
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="Nakuru, KE"
              />
            </Field>
            <Field label="Assign Farmers" full>
              <MultiSelect
                values={form.farmers}
                onChange={(v) => set("farmers", v)}
                options={FARMER_OPTIONS}
                placeholder="Select farmers…"
                searchPlaceholder="Search farmer…"
              />
            </Field>
            <Field label="Geotag Location" full>
              <LocationPicker
                value={form.location}
                onChange={(v) => set("location", v)}
              />
            </Field>
            <Field label="Crops" full>
              <MultiSelect
                values={cropNames}
                onChange={onCropsChange}
                options={CROP_OPTIONS}
                placeholder="Select crops…"
                searchPlaceholder="Search crop…"
              />
            </Field>
            {form.crops.length > 0 && (
              <div className="sm:col-span-2 space-y-2">
                {form.crops.map((c) => (
                  <div
                    key={c.crop}
                    className="flex flex-col gap-2 bg-surface border border-border px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Wheat className="h-4 w-4 text-accent" />
                        {c.crop}
                      </div>
                      <FullSelect
                        value={c.status}
                        onChange={(v) => setCropStatus(c.crop, v)}
                        options={CROP_STATUS_OPTIONS}
                      />
                    </div>
                    {c.status === "harvested" && (
                      <TextInput
                        type="number"
                        value={c.yieldKg ?? ""}
                        onChange={(v) => setCropYield(c.crop, v)}
                        placeholder="Yield (kg)"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add Farm" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
