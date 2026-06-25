import { ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function Select({ value, onChange, options, placeholder = "Select" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);
  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative w-full sm:w-44">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 border border-border bg-surface px-3 py-2.5 text-left text-sm text-foreground hover:border-foreground/30"
      >
        <span className={current ? "" : "text-secondary"}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto border border-border bg-surface shadow-lg">
          {options.map((o) => (
            <li key={String(o.value)}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${o.value === value ? "bg-accent-soft font-semibold text-foreground" : "text-foreground"}`}
              >
                {o.label}
                {o.value === value && (
                  <span className="h-1.5 w-1.5 bg-accent" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
