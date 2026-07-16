import { useState } from "react";
import { AlertTriangle, PackageCheck } from "lucide-react";
import { Button, Field } from "@/components/ui";
import { denyRemarksSchema } from "@/schemas/request.schema";

const VARIANTS = {
  approve: {
    icon: AlertTriangle,
    iconClass: "bg-success/10 text-success",
    title: "Approve Request?",
    verb: "approved",
    buttonVariant: "accent",
    buttonLabel: "Confirm Approve",
  },
  deny: {
    icon: AlertTriangle,
    iconClass: "bg-danger-10 text-danger",
    title: "Deny Request?",
    verb: "rejected",
    buttonVariant: "danger",
    buttonLabel: "Confirm Deny",
  },
  release: {
    icon: PackageCheck,
    iconClass: "bg-success/10 text-success",
    title: "Release Items?",
    verb: "released",
    buttonVariant: "accent",
    buttonLabel: "Confirm Release",
  },
};

export function ReviewConfirmModal({ row, action, onCancel, onConfirm }) {
  const variant = VARIANTS[action] ?? VARIANTS.approve;
  const Icon = variant.icon;
  const isDeny = action === "deny";

  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState(null);

  const handleConfirm = () => {
    if (!isDeny) {
      onConfirm();
      return;
    }

    const result = denyRemarksSchema.safeParse({ remarks });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Remarks are required");
      return;
    }

    setError(null);
    onConfirm(result.data.remarks);
  };

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
          className={`mx-auto mb-4 grid h-12 w-12 place-items-center ${variant.iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          {variant.title}
        </h3>
        <p className="text-sm text-secondary mb-4">
          Mark <strong className="text-foreground">{row.title}</strong> as{" "}
          {variant.verb}?
        </p>

        {isDeny && (
          <div className="mb-4 text-left">
            <Field label="Reason for denial" error={error}>
              <textarea
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Explain why this request is being denied…"
                rows={3}
                className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground resize-y"
              />
            </Field>
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={variant.buttonVariant} onClick={handleConfirm}>
            {variant.buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
