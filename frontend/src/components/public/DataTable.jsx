import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Pagination } from "./";
import { Select } from "@/components/ui";

export function DataTable({
  columns,
  data,
  searchPlaceholder = "Search…",
  filters = [],
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters or add a new record.",
  loading = false,
  rightAction,
}) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState(() =>
    Object.fromEntries(filters.map((f) => [f.key, "all"])),
  );
  const [sort, setSort] = useState({
    key: null,
    dir: "asc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filtered = useMemo(() => {
    let rows = data;
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter((r) =>
        columns.some((c) => {
          const v = c.accessor ? c.accessor(r) : r[c.key];
          return String(v ?? "")
            .toLowerCase()
            .includes(q);
        }),
      );
    }
    for (const f of filters) {
      const v = filterValues[f.key];
      if (v && v !== "all") rows = rows.filter((r) => f.predicate(r, v));
    }
    if (sort.key) {
      const col = columns.find((c) => c.key === sort.key);
      rows = [...rows].sort((a, b) => {
        const av = col?.accessor ? col.accessor(a) : a[sort.key];
        const bv = col?.accessor ? col.accessor(b) : b[sort.key];
        if (av === bv) return 0;
        const res = av > bv ? 1 : -1;
        return sort.dir === "asc" ? res : -res;
      });
    }
    return rows;
  }, [data, query, filterValues, sort, columns, filters]);
  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );
  useEffect(() => {
    setPage(1);
  }, [query, filterValues, pageSize]);
  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  return (
    <div className="bg-surface border border-border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground"
          />
        </div>
        {filters.map((f) => (
          <Select
            key={f.key}
            value={filterValues[f.key]}
            onChange={(v) => setFilterValues((s) => ({ ...s, [f.key]: v }))}
            options={[
              { value: "all", label: f.allLabel ?? `All ${f.label}` },
              ...f.options,
            ]}
          />
        ))}
        {rightAction}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="sticky top-0 bg-muted">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`label-eyebrow !text-[10px] px-4 py-3 text-left ${c.sortable ? "cursor-pointer select-none" : ""} ${c.align === "right" ? "text-right" : ""}`}
                  onClick={() => c.sortable && toggleSort(c.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortable &&
                      sort.key === c.key &&
                      (sort.dir === "asc" ? (
                        <ChevronUp className="h-3 w-3 text-accent" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-accent" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-4">
                      <div className="h-3 w-24 animate-pulse bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="mx-auto max-w-sm">
                    <div className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-muted">
                      <Search className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="font-display text-base text-foreground">
                      {emptyTitle}
                    </div>
                    <div className="mt-1 text-sm text-secondary">
                      {emptyDescription}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  className="border-t border-border transition-colors hover:bg-muted/60"
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3.5 text-foreground ${c.align === "right" ? "text-right" : ""}`}
                    >
                      {c.cell
                        ? c.cell(row)
                        : c.accessor
                          ? c.accessor(row)
                          : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onPage={setPage}
      />
    </div>
  );
}
