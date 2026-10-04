const COLORS = {
  green: {
    border: "border-l-[#00A36C]",
    badge: "bg-[#00A36C]/10 text-[#00A36C] group-hover:bg-[#00A36C]/20",
  },
  teal: {
    border: "border-l-teal-500",
    badge: "bg-teal-500/10 text-teal-600 group-hover:bg-teal-500/20",
  },
  lime: {
    border: "border-l-lime-500",
    badge: "bg-lime-500/10 text-lime-700 group-hover:bg-lime-500/20",
  },
  blue: {
    border: "border-l-blue-500",
    badge: "bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20",
  },
  amber: {
    border: "border-l-amber-500",
    badge: "bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20",
  },
  purple: {
    border: "border-l-purple-500",
    badge: "bg-purple-500/10 text-purple-600 group-hover:bg-purple-500/20",
  },
};

export function StatCard({ label, value, icon: Icon, color = "green" }) {
  const c = COLORS[color] ?? COLORS.green;

  return (
    <div
      className={`group bg-surface border border-border border-l-4 ${c.border} p-5 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(14,16,22,0.18)] rounded-lg`}
    >
      <div className="flex items-start justify-between">
        <div className="label-eyebrow">{label}</div>
        <div
          className={`grid h-9 w-9 place-items-center rounded-md transition-colors ${c.badge}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-5 font-display text-4xl tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}
