import { Users, Wheat, Tractor, Beef, Building2 } from "lucide-react";
import { PageHeader, StatCard } from "@/components/public";
import { FARMERS, FARMS, LIVESTOCKS, EQUIPMENTS } from "@/constants/data";
import useAuth from "@/hooks/useAuth";

// ─── Association count (hardcoded for now — will come from Association collection) ───
const ASSOCIATION_COUNT = 8;

const STATUS_TONES = {
  healthy: "bg-accent",
  pregnant: "bg-[#a855f7]",
  sick: "bg-[#f59e0b]",
  injured: "bg-[#ef4444]",
  deceased: "bg-[#94a3b8]",
};

const STATUS_HEX = {
  healthy: "#00e676",
  pregnant: "#a855f7",
  sick: "#f59e0b",
  injured: "#ef4444",
  deceased: "#94a3b8",
};

// ─── Equipment condition (hardcoded for now — mirrors Equipment.condition enum) ───
const EQUIPMENT_TONES = {
  excellent: "bg-accent",
  good: "bg-[#3b82f6]",
  maintenance: "bg-[#f59e0b]",
  damaged: "bg-[#ef4444]",
  unusable: "bg-[#64748b]",
};

const EQUIPMENT_HEX = {
  excellent: "#00e676",
  good: "#3b82f6",
  maintenance: "#f59e0b",
  damaged: "#ef4444",
  unusable: "#64748b",
};

const EQUIPMENT_CONDITION = [
  { key: "excellent", label: "Excellent", value: 14 },
  { key: "good", label: "Good", value: 27 },
  { key: "maintenance", label: "Maintenance", value: 7 },
  { key: "damaged", label: "Damaged", value: 3 },
  { key: "unusable", label: "Unusable", value: 1 },
].map((s) => ({
  ...s,
  tone: EQUIPMENT_TONES[s.key],
  hex: EQUIPMENT_HEX[s.key],
}));

// ─── Farm harvest totals (hardcoded for now — will sum Harvest.quantity per farm) ───
const FARM_PALETTE = [
  "#00a86b",
  "#3b82f6",
  "#f59e0b",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
];

const FARM_HARVEST = [
  { label: "Farm 01 · Rosario", value: 4820, unit: "kg" },
  { label: "Farm 04 · Sta. Cruz", value: 3960, unit: "kg" },
  { label: "Farm 02 · San Isidro", value: 3410, unit: "kg" },
  { label: "Farm 07 · Del Pilar", value: 2680, unit: "kg" },
  { label: "Farm 05 · Malaya", value: 1975, unit: "kg" },
  { label: "Farm 03 · Bagong Silang", value: 1240, unit: "kg" },
]
  .sort((a, b) => b.value - a.value)
  .map((d, i) => ({ ...d, color: FARM_PALETTE[i % FARM_PALETTE.length] }));

const LIVESTOCK_STATUSES = [
  "healthy",
  "pregnant",
  "sick",
  "injured",
  "deceased",
];

function buildLivestockStatus() {
  const counts = new Map(LIVESTOCK_STATUSES.map((k) => [k, 0]));
  for (const l of LIVESTOCKS) {
    const key = l.condition || l.health;
    if (counts.has(key)) {
      counts.set(key, counts.get(key) + 1);
    }
  }
  return LIVESTOCK_STATUSES.map((k) => ({
    label: k.charAt(0).toUpperCase() + k.slice(1),
    value: counts.get(k),
    tone: STATUS_TONES[k],
    hex: STATUS_HEX[k],
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
  const { role } = useAuth();
  const showAssociations = role !== "far";

  const LIVESTOCK_STATUS = buildLivestockStatus();
  const ACTIVITIES = buildActivities();

  const totalLivestock = LIVESTOCK_STATUS.reduce((s, x) => s + x.value, 0);
  const totalEquipment = EQUIPMENT_CONDITION.reduce((s, x) => s + x.value, 0);
  const maxHarvest = Math.max(1, ...FARM_HARVEST.map((d) => d.value));

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Live operational view of your farm network."
      />

      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
          showAssociations ? "xl:grid-cols-5" : "xl:grid-cols-4"
        }`}
      >
        {showAssociations && (
          <StatCard
            label="Total Associations"
            value={ASSOCIATION_COUNT.toLocaleString()}
            icon={Building2}
          />
        )}
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

      {/* ─── Graphs: Livestock health · Equipment condition · Farm harvest ─── */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="bg-surface border border-border p-6 rounded-lg">
          <div className="mb-6">
            <div className="label-eyebrow">Top Farms</div>
            <h3 className="font-display mt-1 text-xl text-foreground">
              Total harvested
            </h3>
          </div>
          <div className="space-y-4">
            {FARM_HARVEST.map((d) => (
              <div key={d.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-semibold text-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    {d.label}
                  </span>
                  <span className="text-secondary">
                    {d.value.toLocaleString()} {d.unit}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(d.value / maxHarvest) * 100}%`,
                      backgroundColor: d.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border p-6 rounded-lg">
          <div className="mb-6">
            <div className="label-eyebrow">Livestock</div>
            <h3 className="font-display mt-1 text-xl text-foreground">
              Health status
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

        <div className="bg-surface border border-border p-6 rounded-lg">
          <div className="mb-6">
            <div className="label-eyebrow">Equipment</div>
            <h3 className="font-display mt-1 text-xl text-foreground">
              Condition overview
            </h3>
          </div>
          <div className="flex flex-col items-center">
            <Donut data={EQUIPMENT_CONDITION} total={totalEquipment} />
            <ul className="mt-6 w-full space-y-2">
              {EQUIPMENT_CONDITION.map((s) => (
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

      {/* ─── Recent activities (unchanged) ─── */}
      <div className="mt-6 bg-surface border border-border p-6 rounded-lg">
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
