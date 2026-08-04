import { useMemo, useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Tractor,
  Beef,
  Wheat,
  Leaf,
  Download,
  Search,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/public";
import { Button, Select } from "@/components/ui";
import { useAnalytics, downloadAnalyticsPdf } from "@/hooks/useAnalytics";
import { useAssociations } from "@/hooks/useAssociations";
import {
  ANALYTICS_CHART_COLORS,
  ANALYTICS_PERIOD_OPTIONS,
  ANALYTICS_MONTH_LABELS,
  ALL_ASSOCIATIONS_OPTION,
} from "@/constants/data";

/* ---------------- Helpers ---------------- */
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Pivots the backend's long-format monthly rows into the wide shape
// LineChart expects: one row per month, one key per farm. Farms with no
// harvest logged in a given month are filled with 0 rather than left
// undefined, so lines stay continuous instead of showing gaps.
function buildMonthlyChartData(monthlyYieldRows, farmNames) {
  const byMonth = new Map();
  for (let m = 1; m <= 12; m++) {
    const row = { month: ANALYTICS_MONTH_LABELS[m - 1] };
    for (const farm of farmNames) row[farm] = 0;
    byMonth.set(m, row);
  }
  for (const r of monthlyYieldRows) {
    const entry = byMonth.get(r.month);
    if (entry) entry[r.farm] = r.harvested;
  }
  return Array.from(byMonth.values());
}

function ChartCard({ title, subtitle, children, height = 280 }) {
  return (
    <div className="border border-border bg-surface p-5">
      <div className="mb-4">
        <h3 className="font-display text-base tracking-tight text-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-secondary">{subtitle}</p>
        )}
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

// value/options now work off association id (null = "All Associations")
// instead of raw display strings, since the backend needs a real ObjectId.
function AssociationFilter({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = options.find((o) => o.id === value) ?? options[0];

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={rootRef} className="relative w-full sm:w-64">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border border-border bg-surface px-3 py-2 text-sm text-foreground hover:border-foreground"
      >
        <span className="truncate">{selected?.name}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-secondary" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full border border-border bg-surface shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-secondary" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search association…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-secondary"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-secondary">
                No matches found.
              </li>
            )}
            {filtered.map((option) => (
              <li key={option.id ?? "all"}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <span className="truncate">{option.name}</span>
                  {option.id === value && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FilterBar({
  period,
  onPeriodChange,
  association,
  onAssociationChange,
  associationOptions,
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="w-full sm:w-48">
        <Select
          value={period}
          onChange={onPeriodChange}
          options={ANALYTICS_PERIOD_OPTIONS}
        />
      </div>
      <AssociationFilter
        value={association}
        onChange={onAssociationChange}
        options={associationOptions}
      />
    </div>
  );
}

function ExportButton({ onClick, isExporting }) {
  return (
    <Button variant="outline" onClick={onClick} disabled={isExporting}>
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isExporting ? "Exporting…" : "Export"}
    </Button>
  );
}

function SectionHeader({ icon: Icon, title, onExport, isExporting }) {
  return (
    <div className="mb-4 mt-8 flex items-center justify-between gap-3 first:mt-0">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center bg-accent-soft text-foreground">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h2 className="font-display text-xl tracking-tight text-foreground">
            {title}
          </h2>
        </div>
      </div>
      {onExport && (
        <ExportButton onClick={onExport} isExporting={isExporting} />
      )}
    </div>
  );
}

function DualSectionHeader({ left, right }) {
  return (
    <div className="mb-4 mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 first:mt-0">
      {[left, right].map((section, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center bg-accent-soft text-foreground">
              <section.icon className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="font-display text-xl tracking-tight text-foreground">
                {section.title}
              </h2>
            </div>
          </div>
          {section.onExport && (
            <ExportButton
              onClick={section.onExport}
              isExporting={section.isExporting}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Page ---------------- */
export function AnalyticsPage() {
  const [period, setPeriod] = useState("month");
  const [associationId, setAssociationId] = useState(null); // null = All Associations

  // Tracks which section's PDF is currently rendering — null when none is.
  // "all" | "equipment" | "livestock" | "farm" | null
  const [exportingSection, setExportingSection] = useState(null);

  const { data: associationsRes } = useAssociations({ all: true });

  const associationOptions = useMemo(() => {
    const list = associationsRes?.associations ?? [];
    return [
      ALL_ASSOCIATIONS_OPTION,
      ...list.map((a) => ({ id: a._id, name: a.name })),
    ];
  }, [associationsRes]);

  const filters = useMemo(
    () => ({
      period,
      ...(associationId && { association: associationId }),
    }),
    [period, associationId],
  );

  const { data: analyticsRes, isLoading, isError } = useAnalytics(filters);
  const analytics = analyticsRes?.data;

  const equipmentStatus = useMemo(
    () =>
      (analytics?.equipment?.statusDistribution ?? []).map((s) => ({
        name: capitalize(s.name),
        value: s.value,
      })),
    [analytics],
  );

  const livestockHealth = useMemo(
    () =>
      (analytics?.livestock?.healthStatus ?? []).map((s) => ({
        name: capitalize(s.name),
        value: s.value,
      })),
    [analytics],
  );

  const cropStatus = useMemo(
    () =>
      (analytics?.farm?.cropStatus ?? []).map((s) => ({
        name: capitalize(s.name),
        value: s.value,
      })),
    [analytics],
  );

  const yieldPerFarm = analytics?.farm?.yieldPerFarm ?? [];

  const monthlyYieldRows = analytics?.farm?.monthlyYieldTrend ?? [];
  const farmNames = useMemo(
    () => Array.from(new Set(monthlyYieldRows.map((r) => r.farm))),
    [monthlyYieldRows],
  );
  const monthlyFarmYield = useMemo(
    () => buildMonthlyChartData(monthlyYieldRows, farmNames),
    [monthlyYieldRows, farmNames],
  );

  const kpis = analytics?.kpis ?? {
    equipment: 0,
    livestock: 0,
    farm: 0,
    cropYield: 0,
  };

  // Single handler for every export button — section decides which PDF
  // the backend builds. Guards against double-clicks while one is running.
  const handleExportPdf = async (section) => {
    if (exportingSection) return;
    setExportingSection(section);
    try {
      await downloadAnalyticsPdf(filters, section);
    } catch (err) {
      console.error("Failed to export PDF:", err);
    } finally {
      setExportingSection(null);
    }
  };

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Analytics"
          subtitle="Consolidated report across equipment, livestock, farms, and crops."
        />
        <p className="mt-6 text-sm text-secondary">
          Couldn't load analytics data. Try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Consolidated report across equipment, livestock, farms, and crops."
        action={
          <Button
            variant="accent"
            onClick={() => handleExportPdf("all")}
            disabled={isLoading || !!exportingSection}
          >
            {exportingSection === "all" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exportingSection === "all" ? "Exporting…" : "Export Report"}
          </Button>
        }
      />

      <FilterBar
        period={period}
        onPeriodChange={setPeriod}
        association={associationId}
        onAssociationChange={setAssociationId}
        associationOptions={associationOptions}
      />

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div role="status" className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
            <p className="text-sm text-secondary">Loading analytics…</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Equipment" value={kpis.equipment} icon={Tractor} />
            <StatCard label="Livestock" value={kpis.livestock} icon={Beef} />
            <StatCard label="Farms" value={kpis.farm} icon={Wheat} />
            <StatCard
              label="Crop Yield"
              value={kpis.cropYield.toLocaleString()}
              icon={Leaf}
            />
          </div>

          {/* Equipment + Livestock, side by side */}
          <DualSectionHeader
            left={{
              icon: Tractor,
              title: "Equipment",
              onExport: () => handleExportPdf("equipment"),
              isExporting: exportingSection === "equipment",
            }}
            right={{
              icon: Beef,
              title: "Livestock",
              onExport: () => handleExportPdf("livestock"),
              isExporting: exportingSection === "livestock",
            }}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Status Distribution"
              subtitle="Current fleet condition."
            >
              <PieChart>
                <Pie
                  data={equipmentStatus}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                >
                  {equipmentStatus.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ANALYTICS_CHART_COLORS[
                          i % ANALYTICS_CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartCard>
            <ChartCard
              title="Health Status"
              subtitle="Livestock health status."
            >
              <PieChart>
                <Pie
                  data={livestockHealth}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  label
                >
                  {livestockHealth.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ANALYTICS_CHART_COLORS[
                          i % ANALYTICS_CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartCard>
          </div>

          {/* Farm */}
          <SectionHeader
            icon={Wheat}
            title="Farm"
            onExport={() => handleExportPdf("farm")}
            isExporting={exportingSection === "farm"}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Yield per Farm"
              subtitle="Quantity harvested per farm."
            >
              <BarChart data={yieldPerFarm}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="farm" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "quantity",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} (${props.payload.size} ha)`,
                    "Harvested",
                  ]}
                />
                <Bar
                  dataKey="harvested"
                  fill="#166534"
                  name="Harvested (quantity)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartCard>
            <ChartCard
              title="Crop Status"
              subtitle="Distribution across lifecycle."
            >
              <PieChart>
                <Pie
                  data={cropStatus}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                >
                  {cropStatus.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ANALYTICS_CHART_COLORS[
                          i % ANALYTICS_CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartCard>
          </div>
          <div className="mt-4">
            <ChartCard
              title="Monthly Yield Trend"
              subtitle="Quantity harvested per month, by farm (full current year)."
              height={320}
            >
              <LineChart data={monthlyFarmYield}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {farmNames.map((farm, i) => (
                  <Line
                    key={farm}
                    type="monotone"
                    dataKey={farm}
                    stroke={
                      ANALYTICS_CHART_COLORS[i % ANALYTICS_CHART_COLORS.length]
                    }
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
