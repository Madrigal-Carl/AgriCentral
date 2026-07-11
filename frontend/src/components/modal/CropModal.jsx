import { useState } from "react";
import { X } from "lucide-react";
import { Button, Field, TextInput, SingleSelect } from "@/components/ui";
import useAuth from "@/hooks/useAuth"; // adjust to your actual auth hook/context
import { useFarmerByUserId } from "@/hooks/useFarmers";
import { useCreateCrop, useUpdateCrop } from "@/hooks/useCrops";

export function CropModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [submitError, setSubmitError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Only the farmer(s) assigned to the current user — via GET /farmers/:userId —
  // rather than every farmer in the system.
  const { user } = useAuth();
  const { data: farmersData, isLoading: farmersLoading } = useFarmerByUserId(
    user?._id,
  );
  const farmerOptions = (farmersData?.farmers ?? []).map((f) => ({
    value: f._id,
    label: f.fullName,
  }));

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateCrop({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateCrop({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const busy = isCreating || isUpdating;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.name || !form.assignedFarmer) return;

    const payload = {
      name: form.name,
      kilo: Number(form.kilo) || 0,
      assignedFarmer: form.assignedFarmer,
      status: form.status,
    };

    try {
      if (mode === "add") {
        const { crop } = await createMutateAsync(payload);
        onSave?.(crop);
      } else {
        const { crop } = await updateMutateAsync({
          id: initial.id,
          ...payload,
        });
        onSave?.(crop);
      }
    } catch (err) {
      setSubmitError(err.message || "Failed to save crop");
    }
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
          {submitError && (
            <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {submitError}
            </div>
          )}
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
                value={form.kilo}
                onChange={(v) => set("kilo", v)}
                placeholder="e.g. 1200"
              />
            </Field>
            <Field label="Assign Farmer">
              <SingleSelect
                value={form.assignedFarmer}
                onChange={(v) => set("assignedFarmer", v)}
                options={farmerOptions}
                placeholder={
                  farmersLoading ? "Loading farmers…" : "Select farmer…"
                }
                searchPlaceholder="Search farmer…"
              />
            </Field>
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            type="button"
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={submit}
            type="submit"
            disabled={busy}
          >
            {busy ? "Saving…" : mode === "add" ? "Add Crop" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
