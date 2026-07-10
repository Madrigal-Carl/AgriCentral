import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui";

export function ReturnConfirmModal({ row, onCancel, onConfirm }) {
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
          <Undo2 className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          Return Equipment?
        </h3>
        <p className="text-sm text-secondary mb-6">
          Have you already returned{" "}
          <strong className="text-foreground">
            {row.id} ({row.name})
          </strong>{" "}
          ? It will be removed from your inventory.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirm Return
          </Button>
        </div>
      </div>
    </div>
  );
}
