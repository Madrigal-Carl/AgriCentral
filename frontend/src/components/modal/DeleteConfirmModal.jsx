import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

export function DeleteConfirmModal({ name, error, busy, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-surface border border-border shadow-xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center text-danger bg-danger-10">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          Delete Farmer?
        </h3>
        <p className="text-sm text-secondary mb-4">
          Are you sure you want to delete{" "}
          <strong className="text-foreground">{name}</strong>? This action
          cannot be undone.
        </p>
        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
