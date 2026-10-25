import { IconButton } from "@/components/ui";
import {
  Eye,
  Pencil,
  Archive,
  Check,
  X as XIcon,
  PackageCheck,
  Undo2,
} from "lucide-react";

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
      <div className="flex items-center justify-end gap-1">
        {onView && <IconButton icon={Eye} label="View" onClick={onView} />}
        {onApprove && (
          <IconButton
            icon={Check}
            label="Approve"
            tone="success"
            onClick={onApprove}
          />
        )}
        {onDeny && (
          <IconButton
            icon={XIcon}
            label="Deny"
            tone="danger"
            onClick={onDeny}
          />
        )}
        {onRelease && (
          <IconButton
            icon={PackageCheck}
            label="Release"
            tone="success"
            onClick={onRelease}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {onView && <IconButton icon={Eye} label="View" onClick={onView} />}
      {onEdit && <IconButton icon={Pencil} label="Edit" onClick={onEdit} />}
      {onChangeDecision && <IconButton icon={Undo2} label="Change decision" onClick={onChangeDecision} />}
      {onRestore && <IconButton icon={Undo2} label="Restore" onClick={onRestore} />}
      {onRelease && (
        <IconButton
          icon={PackageCheck}
          label="Release"
          tone="success"
          onClick={onRelease}
        />
      )}
      {onDelete && (
        <IconButton
          icon={Archive}
          label="Archive"
          tone="danger"
          onClick={onDelete}
        />
      )}
    </div>
  );
}
