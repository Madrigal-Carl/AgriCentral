import { IconButton } from "@/components/ui";
import { Eye, Pencil, Trash2, Check, X as XIcon } from "lucide-react";

export function RowActions({ onView, onEdit, onDelete, onApprove, onDeny }) {
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
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {onView && <IconButton icon={Eye} label="View" onClick={onView} />}
      {onEdit && <IconButton icon={Pencil} label="Edit" onClick={onEdit} />}
      {onDelete && (
        <IconButton
          icon={Trash2}
          label="Delete"
          tone="danger"
          onClick={onDelete}
        />
      )}
    </div>
  );
}
