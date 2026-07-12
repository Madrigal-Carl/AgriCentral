import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Plus } from "lucide-react";

export function MultiSelect({
  values,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  allowCreate = false,
  onCreate,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  const selectedOptions = useMemo(
    () => values.map((v) => options.find((o) => o.value === v)).filter(Boolean),
    [values, options],
  );

  const filtered = useMemo(
    () =>
      options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())),
    [q, options],
  );

  const trimmed = q.trim();
  const exactMatch = useMemo(
    () => options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase()),
    [options, trimmed],
  );
  // Only offer "create" once search has genuinely turned up nothing.
  const canCreate =
    allowCreate && trimmed.length > 0 && filtered.length === 0 && !exactMatch;

  const toggle = (o) => {
    if (values.includes(o.value)) onChange(values.filter((v) => v !== o.value));
    else onChange([...values, o.value]);
  };

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate?.(trimmed);
    if (!values.includes(trimmed)) onChange([...values, trimmed]);
    setQ("");
  };

  const remove = (value) => onChange(values.filter((v) => v !== value));

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 border border-border bg-surface px-3 py-2.5 text-left text-sm hover:border-foreground-40"
      >
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {selectedOptions.length === 0 ? (
            <span className="text-secondary">{placeholder}</span>
          ) : (
            selectedOptions.map((o) => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1 border border-border bg-accent-soft px-2 py-0.5 text-xs font-semibold text-foreground"
              >
                {o.label}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(o.value);
                  }}
                  className="cursor-pointer text-secondary hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 border border-border bg-surface shadow-lg">
          <div className="relative border-b border-border">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCreate) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-surface py-2.5 pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-auto">
            {filtered.length === 0 && !canCreate ? (
              <li className="px-3 py-3 text-sm text-secondary">No results.</li>
            ) : (
              filtered.map((o) => {
                const selected = values.includes(o.value);
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      onClick={() => toggle(o)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                        selected ? "bg-accent-soft font-semibold" : ""
                      }`}
                    >
                      {o.label}
                      {selected && <span className="h-1.5 w-1.5 bg-accent" />}
                    </button>
                  </li>
                );
              })
            )}
            {canCreate && (
              <li className="border-t border-border">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-accent hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                  Add &ldquo;{trimmed}&rdquo;
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
