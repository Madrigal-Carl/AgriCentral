import { IconButton } from "@/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Builds a compact page list with ellipsis, e.g.:
// [1, 2, 3, 4, 5], [1, '...', 4, 5, 6, '...', 10], [1, '...', 9, 10]
function getPageNumbers(page, totalPages) {
  const delta = 1; // pages to show on each side of current page
  const range = [];

  for (
    let i = Math.max(2, page - delta);
    i <= Math.min(totalPages - 1, page + delta);
    i++
  ) {
    range.push(i);
  }

  if (page - delta > 2) {
    range.unshift("...");
  }
  if (page + delta < totalPages - 1) {
    range.push("...");
  }

  range.unshift(1);
  if (totalPages > 1) range.push(totalPages);

  return [...new Set(range)];
}

export function Pagination({ page, pageSize, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = getPageNumbers(page, totalPages);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div className="flex items-center justify-end gap-1 border-t border-border px-4 py-3 text-sm">
      <span
        className={isFirst ? "pointer-events-none opacity-40" : undefined}
        aria-disabled={isFirst}
      >
        <IconButton
          icon={ChevronLeft}
          label="Previous"
          disabled={isFirst}
          onClick={() => {
            if (isFirst) return;
            onPage(page - 1);
          }}
        />
      </span>

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-sm text-secondary">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={`grid h-8 w-8 place-items-center text-sm font-semibold transition-colors ${
                p === page
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ),
        )}
      </div>

      <span
        className={isLast ? "pointer-events-none opacity-40" : undefined}
        aria-disabled={isLast}
      >
        <IconButton
          icon={ChevronRight}
          label="Next"
          disabled={isLast}
          onClick={() => {
            if (isLast) return;
            onPage(page + 1);
          }}
        />
      </span>
    </div>
  );
}
