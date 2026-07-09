import { useEffect, useMemo, useRef, useState } from "react";
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
} from "lucide-react";
import { PageHeader } from "@/components/public";
import { Button, Select } from "@/components/ui";
import useAuth from "@/hooks/useAuth";

/* ---------------- Mock analytics data ---------------- */
const equipmentStatus = [
  { name: "Operational", value: 42 },
  { name: "Maintenance", value: 9 },
  { name: "Repair", value: 5 },
  { name: "Idle", value: 12 },
];

const equipmentByType = [
  { type: "Tractor", count: 14 },
  { type: "Harvester", count: 6 },
  { type: "Plow", count: 11 },
  { type: "Sprayer", count: 8 },
  { type: "Irrigation", count: 15 },
  { type: "Trailer", count: 14 },
];

const livestockByCategory = [
  { category: "Cattle", count: 128 },
  { category: "Goats", count: 84 },
  { category: "Sheep", count: 52 },
  { category: "Poultry", count: 640 },
  { category: "Swine", count: 46 },
];

const livestockHealth = [
  { name: "Healthy", value: 812 },
  { name: "Under Watch", value: 92 },
  { name: "Sick", value: 34 },
  { name: "Quarantined", value: 12 },
];

const farmSizeYield = [
  { farm: "South Farm", size: 12, yield: 8400 },
  { farm: "Boac South", size: 8, yield: 5200 },
  { farm: "North Farm", size: 15, yield: 11800 },
  { farm: "West Farm", size: 6, yield: 3900 },
  { farm: "East Farm", size: 10, yield: 7100 },
  { farm: "Central Farm", size: 18, yield: 13600 },
];

const cropYield = [
  { crop: "Rice", yield: 18400 },
  { crop: "Corn", yield: 12300 },
  { crop: "Coconut", yield: 9800 },
  { crop: "Banana", yield: 7600 },
  { crop: "Cassava", yield: 5400 },
  { crop: "Coffee", yield: 3200 },
];

const cropStatus = [
  { name: "Planted", value: 24 },
  { name: "Growing", value: 38 },
  { name: "Harvested", value: 28 },
  { name: "Fallow", value: 10 },
];

const monthlyYield = [
  { month: "Jan", rice: 1400, corn: 900, coconut: 700 },
  { month: "Feb", rice: 1600, corn: 950, coconut: 720 },
  { month: "Mar", rice: 1800, corn: 1100, coconut: 800 },
  { month: "Apr", rice: 1500, corn: 1300, coconut: 780 },
  { month: "May", rice: 2100, corn: 1250, coconut: 860 },
  { month: "Jun", rice: 2400, corn: 1400, coconut: 900 },
  { month: "Jul", rice: 2200, corn: 1500, coconut: 950 },
  { month: "Aug", rice: 2000, corn: 1600, coconut: 980 },
];

const farmPerformance = [
  { metric: "Yield", value: 82 },
  { metric: "Efficiency", value: 74 },
  { metric: "Health", value: 88 },
  { metric: "Utilization", value: 69 },
  { metric: "Coverage", value: 91 },
];

/* ---------------- Colors (semantic tokens) ---------------- */
const COLORS = [
  "#166534",
  "#65a30d",
  "#ca8a04",
  "#dc2626",
  "#2563eb",
  "#7c3aed",
];

/* ---------------- Filter options ---------------- */
const PERIOD_OPTIONS = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

const ASSOCIATIONS = [
  "All Associations",
  "Boac, Marinduque",
  "Mogpog, Marinduque",
  "Santa Cruz, Marinduque",
  "Torrijos, Marinduque",
  "Buenavista, Marinduque",
  "Gasan, Marinduque",
];

/* ---------------- CSV export helper ---------------- */
function exportCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- Small UI helpers ---------------- */
function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="border border-border bg-surface p-4">
      <div className="flex items-center gap-2 label-eyebrow">
        <Icon className="h-3.5 w-3.5 text-accent" />
        {label}
      </div>
      <div className="mt-2 font-display text-2xl tracking-tight text-foreground">
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-secondary">{sub}</div>}
    </div>
  );
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

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={rootRef} className="relative w-full sm:w-64">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border border-border bg-surface px-3 py-2 text-sm text-foreground hover:border-foreground"
      >
        <span className="truncate">{value}</span>
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
              <li key={option}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <span className="truncate">{option}</span>
                  {option === value && (
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
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="w-full sm:w-48">
        <Select
          value={period}
          onChange={onPeriodChange}
          options={PERIOD_OPTIONS}
        />
      </div>
      <AssociationFilter
        value={association}
        onChange={onAssociationChange}
        options={ASSOCIATIONS}
      />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, onExport }) {
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
          {subtitle && <p className="text-xs text-secondary">{subtitle}</p>}
        </div>
      </div>
      {onExport && (
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      )}
    </div>
  );
}

/* ---------------- Page ---------------- */
export function AnalyticsPage() {
  const { user } = useAuth();
  const isGovernor = user?.role === "governor";

  // Filters (period defaults to "This Month"; association defaults to "All")
  const [period, setPeriod] = useState("month");
  const [association, setAssociation] = useState("All Associations");

  const totalEquipment = equipmentByType.reduce((s, i) => s + i.count, 0);
  const totalLivestock = livestockByCategory.reduce((s, i) => s + i.count, 0);
  const totalYield = cropYield.reduce((s, i) => s + i.yield, 0);
  const totalFarmArea = farmSizeYield.reduce((s, i) => s + i.size, 0);

  const equipmentMaintenance =
    equipmentStatus.find((s) => s.name === "Maintenance")?.value ?? 0;
  const equipmentGoodCondition =
    equipmentStatus.find((s) => s.name === "Operational")?.value ?? 0;
  const equipmentNotAssigned =
    equipmentStatus.find((s) => s.name === "Idle")?.value ?? 0;

  const handleExport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Equipment", totalEquipment],
      ["Operational Equipment", equipmentStatus[0].value],
      ...(isGovernor
        ? [
            ["Equipment Maintenance", equipmentMaintenance],
            ["Equipment Good Condition", equipmentGoodCondition],
            ["Equipment Not Assigned", equipmentNotAssigned],
          ]
        : [
            ["Livestock", totalLivestock],
            ["Healthy Livestock", livestockHealth[0].value],
            ["Farm", totalFarmArea],
            ["Farms", farmSizeYield.length],
            ["Crop Yield (kg)", totalYield],
          ]),
    ];
    exportCsv("agricentral-analytics.csv", rows);
  };

  const handleExportEquipment = () => {
    const rows = [
      ["Type", "Count"],
      ...equipmentByType.map((e) => [e.type, e.count]),
      [],
      ["Status", "Count"],
      ...equipmentStatus.map((e) => [e.name, e.value]),
    ];
    exportCsv("agricentral-equipment.csv", rows);
  };

  const handleExportLivestock = () => {
    const rows = [
      ["Category", "Count"],
      ...livestockByCategory.map((l) => [l.category, l.count]),
      [],
      ["Health Status", "Count"],
      ...livestockHealth.map((l) => [l.name, l.value]),
    ];
    exportCsv("agricentral-livestock.csv", rows);
  };

  const handleExportFarms = () => {
    const rows = [
      ["Farm", "Size (ha)", "Yield (kg)"],
      ...farmSizeYield.map((f) => [f.farm, f.size, f.yield]),
      [],
      ["Metric", "Score"],
      ...farmPerformance.map((f) => [f.metric, f.value]),
    ];
    exportCsv("agricentral-farms.csv", rows);
  };

  const handleExportCrops = () => {
    const rows = [
      ["Crop", "Yield (kg)"],
      ...cropYield.map((c) => [c.crop, c.yield]),
      [],
      ["Status", "Count"],
      ...cropStatus.map((c) => [c.name, c.value]),
      [],
      ["Month", "Rice", "Corn", "Coconut"],
      ...monthlyYield.map((m) => [m.month, m.rice, m.corn, m.coconut]),
    ];
    exportCsv("agricentral-crops.csv", rows);
  };

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle={
          isGovernor
            ? "Equipment report."
            : "Consolidated report across equipment, livestock, farms, and crops."
        }
        action={
          <Button variant="accent" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        }
      />

      <FilterBar
        period={period}
        onPeriodChange={setPeriod}
        association={association}
        onAssociationChange={setAssociation}
      />

      {/* KPI row */}
      <div
        className={`grid grid-cols-2 gap-3 ${isGovernor ? "lg:grid-cols-4" : "lg:grid-cols-4"}`}
      >
        <StatCard
          icon={Tractor}
          label="Equipment"
          value={totalEquipment}
          sub={`${equipmentStatus[0].value} operational`}
        />
        {isGovernor ? (
          <>
            <StatCard
              icon={Tractor}
              label="Under Maintenance"
              value={equipmentMaintenance}
              sub="currently being serviced"
            />
            <StatCard
              icon={Tractor}
              label="Good Condition"
              value={equipmentGoodCondition}
              sub="operational units"
            />
            <StatCard
              icon={Tractor}
              label="Not Assigned"
              value={equipmentNotAssigned}
              sub="idle / unassigned units"
            />
          </>
        ) : (
          <>
            <StatCard
              icon={Beef}
              label="Livestock"
              value={totalLivestock.toLocaleString()}
              sub={`${livestockHealth[0].value} healthy`}
            />
            <StatCard
              icon={Wheat}
              label="Farm"
              value={`${totalFarmArea}`}
              sub={`${farmSizeYield.length} farms`}
            />
            <StatCard
              icon={Leaf}
              label="Crop Yield"
              value={`${(totalYield / 1000).toFixed(1)}t`}
              sub="last season"
            />
          </>
        )}
      </div>

      {/* Equipment */}
      <SectionHeader
        icon={Tractor}
        title="Equipment"
        subtitle="Fleet composition and status."
        onExport={handleExportEquipment}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="By Type"
          subtitle="Number of units per equipment type."
        >
          <BarChart data={equipmentByType}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="type" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#166534" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
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
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ChartCard>
      </div>

      {!isGovernor && (
        <>
          {/* Livestock */}
          <SectionHeader
            icon={Beef}
            title="Livestock"
            subtitle="Population by category and overall health."
            onExport={handleExportLivestock}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Population by Category">
              <BarChart data={livestockByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#ca8a04" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartCard>
            <ChartCard title="Health Status">
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
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartCard>
          </div>

          {/* Farms */}
          <SectionHeader
            icon={Wheat}
            title="Farms"
            subtitle="Area, yield, and operational performance."
            onExport={handleExportFarms}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Yield per Farm"
              subtitle="Kilograms harvested per farm."
            >
              <BarChart data={farmSizeYield}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="farm" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "kg",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 11,
                  }}
                />
                <Tooltip />
                <Bar
                  dataKey="yield"
                  fill="#166534"
                  name="Yield (kg)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartCard>
            <ChartCard
              title="Performance Index"
              subtitle="Composite score across farms."
            >
              <RadarChart data={farmPerformance}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#166534"
                  fill="#166534"
                  fillOpacity={0.35}
                />
                <Tooltip />
              </RadarChart>
            </ChartCard>
          </div>

          {/* Crops */}
          <SectionHeader
            icon={Leaf}
            title="Crops"
            subtitle="Yield, status, and monthly trends."
            onExport={handleExportCrops}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Yield by Crop"
              subtitle="Total kilograms harvested."
            >
              <BarChart data={cropYield}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="crop" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="yield" fill="#65a30d" radius={[4, 4, 0, 0]} />
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
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
              subtitle="Kilograms harvested per month for top crops."
              height={320}
            >
              <LineChart data={monthlyYield}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rice"
                  stroke="#166534"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="corn"
                  stroke="#ca8a04"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="coconut"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
