import { TrendingDown, TrendingUp } from "lucide-react";

export function StatCard({ label, value, icon: Icon, trend, trendDir = "up" }) {
  const TrendIcon = trendDir === "up" ? TrendingUp : TrendingDown;
  return (
    <div className="group bg-surface border border-border p-5 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(14,16,22,0.18)] rounded-lg">
      <div className="flex items-start justify-between">
        <div className="label-eyebrow">{label}</div>
        <div className="grid h-9 w-9 place-items-center bg-muted text-secondary transition-colors group-hover:bg-accent-soft group-hover:text-foreground">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-5 font-display text-4xl tracking-tight text-foreground">
        {value}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <TrendIcon
            className={`h-3.5 w-3.5 ${trendDir === "up" ? "text-accent" : "text-destructive"}`}
          />
          <span
            className={`font-semibold ${trendDir === "up" ? "text-foreground" : "text-destructive"}`}
          >
            {trend}
          </span>
          <span className="text-secondary">vs last month</span>
        </div>
      )}
    </div>
  );
}
