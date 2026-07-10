import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

export function ReviewConfirmModal({ row, action, onCancel, onConfirm }) {
  const isApprove = action === "approve";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-surface border border-border shadow-xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`mx-auto mb-4 grid h-12 w-12 place-items-center ${
            isApprove
              ? "bg-success/10 text-success"
              : "bg-danger-10 text-danger"
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          {isApprove ? "Approve Request?" : "Deny Request?"}
        </h3>
        <p className="text-sm text-secondary mb-6">
          {isApprove ? (
            <>
              Mark{" "}
              <strong className="text-foreground">
                {row.id} — {row.title}
              </strong>{" "}
              as approved?
            </>
          ) : (
            <>
              Mark{" "}
              <strong className="text-foreground">
                {row.id} — {row.title}
              </strong>{" "}
              as rejected?
            </>
          )}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={isApprove ? "accent" : "danger"} onClick={onConfirm}>
            {isApprove ? "Confirm Approve" : "Confirm Deny"}
          </Button>
        </div>
      </div>
    </div>
  );
}
