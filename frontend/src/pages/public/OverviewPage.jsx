import { Users, Wheat, Tractor, Beef, Activity } from "lucide-react";
import { PageHeader, StatCard } from "@/components/public";
import { FARMERS, FARMS, LIVESTOCKS, EQUIPMENTS } from "@/constants/data";

const STATUS_TONES = {
  active: "bg-accent",
  sold: "bg-primary",
  quarantine: "bg-[#f59e0b]",
  inactive: "bg-[#94a3b8]",
};
const STATUS_HEX = {
  active: "#00e676",
  sold: "#0e1016",
  quarantine: "#f59e0b",
  inactive: "#94a3b8",
};

function buildFarmDistribution() {
  const counts = new Map();
  for (const f of FARMS) {
    for (const c of f.crops || []) {
      counts.set(c.crop, (counts.get(c.crop) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function buildLivestockStatus() {
  const counts = new Map();
  for (const l of LIVESTOCKS) {
    const key = l.status || "active";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].map(([k, v]) => ({
    label: k.charAt(0).toUpperCase() + k.slice(1),
    value: v,
    tone: STATUS_TONES[k] || "bg-secondary",
    hex: STATUS_HEX[k] || "#64748b",
  }));
}

function relativeTime(dateStr) {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return dateStr;
  const diff = Date.now() - then;
  const day = 86400000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 30 * day) return `${Math.floor(diff / day)} days ago`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))} mo ago`;
  return `${Math.floor(diff / (365 * day))} yr ago`;
}

function buildActivities() {
  const events = [];
  for (const fr of FARMERS) {
    for (const h of fr.history || []) {
      events.push({
        date: h.date,
        title: `${fr.name} ${h.action.toLowerCase()} ${h.kind}`,
        desc: `${h.item}`,
      });
    }
  }
  for (const fm of FARMS) {
    for (const h of fm.history || []) {
      events.push({
        date: h.date,
        title: `Farm ${fm.id} · ${h.action} ${h.item}`,
        desc: `${fm.address} · ${fm.size} ha`,
      });
    }
  }
  for (const ls of LIVESTOCKS) {
    events.push({
      date: ls.acquisitionDate,
      title: `Livestock acquired · ${ls.tag}`,
      desc: `${ls.breed} ${ls.animal} → ${ls.farmer}`,
    });
  }
  for (const eq of EQUIPMENTS) {
    events.push({
      date: eq.acquisitionDate,
      title: `Equipment acquired · ${eq.name}`,
      desc: eq.farmer ? `Assigned to ${eq.farmer}` : `Status: ${eq.status}`,
    });
  }
  return events
    .filter((e) => e.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)
    .map((e) => ({ ...e, time: relativeTime(e.date) }));
}

export function OverviewPage() {
  const FARM_DISTRIBUTION = buildFarmDistribution();
  const LIVESTOCK_STATUS = buildLivestockStatus();
  const ACTIVITIES = buildActivities();

  const totalLivestock = LIVESTOCK_STATUS.reduce((s, x) => s + x.value, 0);
  const maxDist = Math.max(1, ...FARM_DISTRIBUTION.map((d) => d.value));

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Live operational view of your farm network."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Farmers"
          value={FARMERS.length.toLocaleString()}
          icon={Users}
        />
        <StatCard
          label="Total Farms"
          value={FARMS.length.toLocaleString()}
          icon={Wheat}
        />
        <StatCard
          label="Total Equipment"
          value={EQUIPMENTS.length.toLocaleString()}
          icon={Tractor}
        />
        <StatCard
          label="Total Livestock"
          value={LIVESTOCKS.length.toLocaleString()}
          icon={Beef}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="bg-surface border border-border p-6 lg:col-span-2">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="label-eyebrow">Farm distribution</div>
              <h3 className="font-display mt-1 text-xl text-foreground">
                By crop type
              </h3>
            </div>
            <Activity className="h-4 w-4 text-secondary" />
          </div>
          {FARM_DISTRIBUTION.length === 0 ? (
            <div className="text-sm text-secondary">No crops recorded.</div>
          ) : (
            <div className="space-y-4">
              {FARM_DISTRIBUTION.map((d) => (
                <div key={d.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {d.label}
                    </span>
                    <span className="text-secondary">
                      {d.value} {d.value === 1 ? "farm" : "farms"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(d.value / maxDist) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border p-6">
          <div className="mb-6">
            <div className="label-eyebrow">Livestock status</div>
            <h3 className="font-display mt-1 text-xl text-foreground">
              Distribution
            </h3>
          </div>
          <div className="flex flex-col items-center">
            <Donut data={LIVESTOCK_STATUS} total={totalLivestock} />
            <ul className="mt-6 w-full space-y-2">
              {LIVESTOCK_STATUS.map((s) => (
                <li
                  key={s.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 ${s.tone}`} />
                    <span className="text-foreground">{s.label}</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {s.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-surface border border-border p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="label-eyebrow">Recent activities</div>
            <h3 className="font-display mt-1 text-xl text-foreground">
              Latest events
            </h3>
          </div>
        </div>
        {ACTIVITIES.length === 0 ? (
          <div className="text-sm text-secondary">No recent activity.</div>
        ) : (
          <ol className="relative space-y-5 border-l-2 border-border pl-6">
            {ACTIVITIES.map((a, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[31px] top-1.5 grid h-4 w-4 place-items-center bg-surface">
                  <span className="h-2 w-2 bg-accent" />
                </span>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-semibold text-foreground capitalize">
                    {a.title}
                  </div>
                  <div className="text-xs text-secondary">{a.time}</div>
                </div>
                <div className="text-sm text-secondary">{a.desc}</div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function Donut({ data, total }) {
  if (!total) {
    return (
      <div className="relative h-44 w-44 bg-muted">
        <div className="absolute inset-6 grid place-items-center bg-surface">
          <div className="text-center">
            <div className="label-eyebrow !text-[10px]">Total</div>
            <div className="font-display text-2xl text-foreground">0</div>
          </div>
        </div>
      </div>
    );
  }
  let acc = 0;
  const stops = data.map((d) => {
    const start = (acc / total) * 360;
    acc += d.value;
    const end = (acc / total) * 360;
    return `${d.hex} ${start}deg ${end}deg`;
  });
  return (
    <div
      className="relative h-44 w-44"
      style={{ background: `conic-gradient(${stops.join(",")})` }}
    >
      <div className="absolute inset-6 grid place-items-center bg-surface">
        <div className="text-center">
          <div className="label-eyebrow !text-[10px]">Total</div>
          <div className="font-display text-2xl text-foreground">{total}</div>
        </div>
      </div>
    </div>
  );
}
