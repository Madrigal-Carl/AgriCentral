export function RowActions({ onView, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <IconButton icon={Eye} label="View" onClick={onView} />
      <IconButton icon={Pencil} label="Edit" onClick={onEdit} />
      <IconButton
        icon={Trash2}
        label="Delete"
        tone="danger"
        onClick={onDelete}
      />
    </div>
  );
}
