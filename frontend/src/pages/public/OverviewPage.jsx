import { Users, Wheat, Tractor, Beef, Building2 } from "lucide-react";
import { PageHeader, StatCard } from "@/components/public";
import { useOverview } from "@/hooks/useAnalytics";
import {
  LIVESTOCK_STATUS_TONES,
  LIVESTOCK_STATUS_HEX,
  LIVESTOCK_STATUS_ORDER,
  EQUIPMENT_CONDITION_TONES,
  EQUIPMENT_CONDITION_HEX,
  EQUIPMENT_CONDITION_CHART_ORDER,
  FARM_HARVEST_PALETTE,
} from "@/constants/data";

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

export function OverviewPage() {
  const { data, isLoading, isError } = useOverview();

  const overview = data?.data;
  const showAssociations = typeof overview?.kpis?.associations === "number";

  // ─── Livestock: reorder backend rows into LIVESTOCK_STATUS_ORDER, attach tone/hex ───
  const livestockRows = overview?.livestock?.healthStatus ?? [];
  const livestockByName = new Map(livestockRows.map((r) => [r.name, r.value]));
  const LIVESTOCK_STATUS = LIVESTOCK_STATUS_ORDER.map((key) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: livestockByName.get(key) ?? 0,
    tone: LIVESTOCK_STATUS_TONES[key],
    hex: LIVESTOCK_STATUS_HEX[key],
  }));
  const totalLivestock = LIVESTOCK_STATUS.reduce((s, x) => s + x.value, 0);

  // ─── Equipment: reorder backend rows into EQUIPMENT_CONDITION_CHART_ORDER, attach tone/hex ───
  const equipmentRows = overview?.equipment?.statusDistribution ?? [];
  const equipmentByName = new Map(equipmentRows.map((r) => [r.name, r.value]));
  const EQUIPMENT_CONDITION = EQUIPMENT_CONDITION_CHART_ORDER.map((key) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: equipmentByName.get(key) ?? 0,
    tone: EQUIPMENT_CONDITION_TONES[key],
    hex: EQUIPMENT_CONDITION_HEX[key],
  }));
  const totalEquipment = EQUIPMENT_CONDITION.reduce((s, x) => s + x.value, 0);

  // ─── Farms: already sorted desc by the backend, just attach a palette color ───
  const FARM_HARVEST = (overview?.farm?.topHarvested ?? []).map((d, i) => ({
    label: d.farm,
    value: d.harvested,
    unit: "kg",
    color: FARM_HARVEST_PALETTE[i % FARM_HARVEST_PALETTE.length],
  }));
  const maxHarvest = Math.max(1, ...FARM_HARVEST.map((d) => d.value));

  // ─── Recent activities ───
  const ACTIVITIES = (overview?.activities ?? []).map((a) => ({
    title: a.message,
    desc: a.entityType
      ? a.entityType.charAt(0).toUpperCase() + a.entityType.slice(1)
      : "",
    time: relativeTime(a.createdAt),
  }));

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Live operational view of your farm network."
      />

      {isError ? (
        <div className="mt-6 bg-surface border border-border p-6 rounded-lg text-sm text-secondary">
          Couldn't load the overview right now. Please try again shortly.
        </div>
      ) : (
        <>
          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
              showAssociations ? "xl:grid-cols-5" : "xl:grid-cols-4"
            }`}
          >
            {showAssociations && (
              <StatCard
                label="Total Associations"
                value={
                  isLoading ? "—" : overview.kpis.associations.toLocaleString()
                }
                icon={Building2}
              />
            )}
            <StatCard
              label="Total Farmers"
              value={
                isLoading
                  ? "—"
                  : (overview?.kpis?.farmers ?? 0).toLocaleString()
              }
              icon={Users}
            />
            <StatCard
              label="Total Farms"
              value={
                isLoading ? "—" : (overview?.kpis?.farms ?? 0).toLocaleString()
              }
              icon={Wheat}
            />
            <StatCard
              label="Total Equipment"
              value={
                isLoading
                  ? "—"
                  : (overview?.kpis?.equipment ?? 0).toLocaleString()
              }
              icon={Tractor}
            />
            <StatCard
              label="Total Livestock"
              value={
                isLoading
                  ? "—"
                  : (overview?.kpis?.livestock ?? 0).toLocaleString()
              }
              icon={Beef}
            />
          </div>

          {/* ─── Graphs: Farm harvest · Livestock health · Equipment condition ─── */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="bg-surface border border-border p-6 rounded-lg">
              <div className="mb-6">
                <div className="label-eyebrow">Top Farms</div>
                <h3 className="font-display mt-1 text-xl text-foreground">
                  Total harvested
                </h3>
              </div>
              {isLoading ? (
                <div className="text-sm text-secondary">Loading…</div>
              ) : FARM_HARVEST.length === 0 ? (
                <div className="text-sm text-secondary">
                  No harvest data recorded.
                </div>
              ) : (
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
              )}
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

          {/* ─── Recent activities ─── */}
          <div className="mt-6 bg-surface border border-border p-6 rounded-lg">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="label-eyebrow">Recent activities</div>
                <h3 className="font-display mt-1 text-xl text-foreground">
                  Latest events
                </h3>
              </div>
            </div>
            {isLoading ? (
              <div className="text-sm text-secondary">Loading…</div>
            ) : ACTIVITIES.length === 0 ? (
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
        </>
      )}
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
