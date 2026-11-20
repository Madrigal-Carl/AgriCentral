import { TextButton } from "@/components/ui";

// Right-aligned container that wraps the buttons on narrow screens.
const ROW_ACTIONS_CLASS = "flex flex-wrap items-center justify-end gap-1";

export function RowActions({
  onView,
  onEdit,
  onDelete,
  onApprove,
  onDeny,
  onRelease,
  onChangeDecision,
  onRestore,
}) {
  const isReview = Boolean(onApprove || onDeny);

  if (isReview) {
    return (
      <div className={ROW_ACTIONS_CLASS}>
        {onView && <TextButton label="View" onClick={onView} />}
        {onApprove && (
          <TextButton label="Approve" tone="success" onClick={onApprove} />
        )}
        {onDeny && <TextButton label="Deny" tone="danger" onClick={onDeny} />}
        {onRelease && (
          <TextButton label="Release" tone="success" onClick={onRelease} />
        )}
      </div>
    );
  }

  return (
    <div className={ROW_ACTIONS_CLASS}>
      {onView && <TextButton label="View" onClick={onView} />}
      {onEdit && <TextButton label="Edit" onClick={onEdit} />}
      {onChangeDecision && (
        <TextButton label="Change decision" onClick={onChangeDecision} />
      )}
      {onRestore && <TextButton label="Restore" onClick={onRestore} />}
      {onRelease && (
        <TextButton label="Release" tone="success" onClick={onRelease} />
      )}
      {onDelete && (
        <TextButton label="Archive" tone="danger" onClick={onDelete} />
      )}
    </div>
  );
}
