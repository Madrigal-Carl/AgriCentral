// Compact text-only action button for table rows (no icons). Place several
// inside a `flex flex-wrap justify-end` container so they right-align and
// wrap on narrow screens.
export function TextButton({
  label,
  tone = "default",
  onClick,
  className = "",
  type = "button",
  ...rest
}) {
  const tones = {
    default: "text-secondary hover:bg-muted hover:text-foreground",
    success: "text-success hover:bg-muted",
    danger: "text-danger hover:bg-danger-10",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`whitespace-nowrap rounded-md border border-transparent px-2 py-1 text-xs font-semibold transition-colors hover:border-border disabled:opacity-50 ${tones[tone] ?? tones.default} ${className}`}
      {...rest}
    >
      {label}
    </button>
  );
}
