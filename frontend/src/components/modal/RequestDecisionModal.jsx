import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { revertRequestApprovalSchema } from "@/schemas/request.schema";
import { useRevertRequestApproval } from "@/hooks/useRequests";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { statusLabel } from "@/utils/request";

export function RequestDecisionModal({ row, role, onClose, onSave }) {
  const current = row.approvalStatus[role].status;
  const status = current === "approved" ? "denied" : "approved";
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(revertRequestApprovalSchema),
    defaultValues: { status, reason: "" },
  });
  const { mutate, isPending, error } = useRevertRequestApproval({ onSuccess: onSave });

  return (
    <ModalShell eyebrow="Request" title="Change decision" onClose={onClose} maxWidth="max-w-lg"
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button variant={status === "denied" ? "danger" : "accent"} type="submit" form="decision-form" disabled={isPending}>
          {isPending ? "Saving…" : "Change decision"}
        </Button>
      </>}>
      <form id="decision-form" onSubmit={handleSubmit((values) => mutate({ id: row._id, ...values }))} className="space-y-4">
        <p className="text-sm text-foreground">{row.title}</p>
        <p className="text-sm text-secondary">Current decision: <strong>{statusLabel[current]}</strong><br />New decision: <strong>{statusLabel[status]}</strong></p>
        <Field label="Reason" error={errors.reason?.message}>
          <textarea {...register("reason")} required minLength={5} maxLength={500} rows={4}
            className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-foreground resize-y" />
        </Field>
        {error && <p role="alert" className="text-sm text-red-600">{getErrorMessage(error, "Failed to change decision")}</p>}
      </form>
    </ModalShell>
  );
}
