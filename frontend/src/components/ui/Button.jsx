export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}) {
  const styles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90",
    outline: "border border-border bg-surface text-foreground hover:bg-muted",
    ghost: "text-secondary hover:bg-muted hover:text-foreground",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
