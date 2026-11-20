import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field } from "@/components/ui";
import { FileUploader } from "@/components/public";
import { ModalShell } from "./ModalShell";
import { releaseFormSchema } from "@/schemas/request.schema";
import { useReleaseRequest } from "@/hooks/useRequests";
import { getErrorMessage } from "@/utils/getErrorMessage";

// Coordinator releases a fully approved request's reserved units. Every
// release (partial ones included) needs at least one image as proof.
export function ReleaseModal({ row, onClose, onSave }) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: { files: [] },
  });
  const { mutate, isPending, error } = useReleaseRequest({ onSuccess: onSave });

  const released = new Set((row.releasedIds ?? []).map(String));
  const pending = (row.entities ?? []).filter((entity) => !released.has(String(entity._id)));
  const filesError = errors.files?.message ?? errors.files?.root?.message;

  return (
    <ModalShell
      eyebrow="Request"
      title="Release items"
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="accent" type="submit" form="release-form" disabled={isPending}>
            {isPending ? "Releasing…" : "Confirm Release"}
          </Button>
        </>
      }
    >
      <form
        id="release-form"
        onSubmit={handleSubmit((values) => mutate({ id: row._id, files: values.files }))}
        className="space-y-4"
      >
        <p className="text-sm font-semibold text-foreground">{row.title}</p>
        {pending.length > 0 ? (
          <div>
            <div className="label-eyebrow mb-1">Units to release</div>
            <ul className="space-y-1 text-sm text-foreground">
              {pending.map((entity) => (
                <li key={entity._id}>
                  {entity.propertyNumber} · {row.entityType === "livestock" ? entity.animal : entity.name}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-secondary">
              Units that are not currently releasable stay pending for a later release.
            </p>
          </div>
        ) : (
          <p className="text-sm text-secondary">No reserved units are waiting for release.</p>
        )}
        <Field label="Release images" required error={filesError}>
          <Controller
            name="files"
            control={control}
            render={({ field }) => (
              <FileUploader
                value={field.value}
                onChange={field.onChange}
                accept="image/*"
                invalid={Boolean(filesError)}
              />
            )}
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {getErrorMessage(error, "Failed to release items")}
          </p>
        )}
      </form>
    </ModalShell>
  );
}
