export function Pagination({ page, pageSize, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-end gap-1 border-t border-border px-4 py-3 text-sm">
      <IconButton
        icon={ChevronLeft}
        label="Previous"
        onClick={() => onPage(Math.max(1, page - 1))}
      />
      <span className="px-3 text-sm font-semibold text-foreground">
        {page} / {totalPages}
      </span>
      <IconButton
        icon={ChevronRight}
        label="Next"
        onClick={() => onPage(Math.min(totalPages, page + 1))}
      />
    </div>
  );
}
