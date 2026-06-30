import { IconButton } from "@/components/ui";
import { Eye, Pencil, Trash2 } from "lucide-react";

export function RowActions({ onView, onEdit, onDelete }) {
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
