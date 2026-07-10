import { Field, TextInput, FullSelect, MultiSelect } from "@/components/ui";
import { useState } from "react";
import { Wheat } from "lucide-react";
import {
  FARMER_OPTIONS,
  CROP_OPTIONS,
  CROP_STATUS_OPTIONS,
} from "@/constants/data";
import { Button } from "@/components/ui";
import { LocationPicker } from "@/components/public";
import { ModalShell } from "./ModalShell";

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
  const setCropYield = (crop, yieldKg) => {
    set(
      "crops",
      form.crops.map((c) => (c.crop === crop ? { ...c, yieldKg } : c)),
    );
  };

  return (
    <ModalShell
      title={mode === "add" ? "Add New Farm" : `Edit ${initial.address}`}
      eyebrow="Farm"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" type="submit" form="farm-form">
            {mode === "add" ? "Add Farm" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="farm-form" onSubmit={submit}>
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
    </ModalShell>
  );
}
