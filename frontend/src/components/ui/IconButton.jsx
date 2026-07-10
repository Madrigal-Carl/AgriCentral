export function IconButton({ icon: Icon, label, tone = "default", onClick }) {
  const tones = {
    default: "text-secondary hover:bg-muted hover:text-foreground",
    danger: "text-secondary hover:bg-[#ffecec] hover:text-red-500",
  };
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-8 w-8 place-items-center border border-transparent transition-colors hover:border-border ${tones[tone]}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
