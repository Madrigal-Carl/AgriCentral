export function StatusPill({ tone = "neutral", children }) {
  const map = {
    success: "bg-accent-soft text-foreground border-accent",
    warning: "bg-[#fff7e6] text-foreground border-[#f59e0b]",
    danger: "bg-[#ffecec] text-foreground border-danger",
    neutral: "bg-muted text-foreground border-border",
    info: "bg-[#e8f1ff] text-foreground border-[#3b82f6]",
    assigned: "bg-[#e8f1ff] text-foreground border-[#3b82f6]",
    available: "bg-muted text-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-l-2 px-2.5 py-1 text-xs font-semibold capitalize ${map[tone]}`}
    >
      <span
        className={`h-1.5 w-1.5 ${
          tone === "success"
            ? "bg-accent"
            : tone === "warning"
              ? "bg-[#f59e0b]"
              : tone === "danger"
                ? "bg-danger"
                : tone === "info"
                  ? "bg-[#3b82f6]"
                  : "bg-secondary"
        }`}
      />
      {children}
    </span>
  );
}
