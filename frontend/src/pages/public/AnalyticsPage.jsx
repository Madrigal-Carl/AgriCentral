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

const monthlyFarmYield = [
  {
    month: "Jan",
    "South Farm": 1050,
    "Boac South": 640,
    "North Farm": 1450,
    "West Farm": 480,
    "East Farm": 870,
    "Central Farm": 1650,
  },
  {
    month: "Feb",
    "South Farm": 1120,
    "Boac South": 660,
    "North Farm": 1520,
    "West Farm": 500,
    "East Farm": 890,
    "Central Farm": 1700,
  },
  {
    month: "Mar",
    "South Farm": 1250,
    "Boac South": 700,
    "North Farm": 1600,
    "West Farm": 520,
    "East Farm": 930,
    "Central Farm": 1800,
  },
  {
    month: "Apr",
    "South Farm": 1180,
    "Boac South": 680,
    "North Farm": 1550,
    "West Farm": 490,
    "East Farm": 900,
    "Central Farm": 1750,
  },
  {
    month: "May",
    "South Farm": 1400,
    "Boac South": 760,
    "North Farm": 1750,
    "West Farm": 560,
    "East Farm": 990,
    "Central Farm": 1980,
  },
  {
    month: "Jun",
    "South Farm": 1520,
    "Boac South": 800,
    "North Farm": 1900,
    "West Farm": 600,
    "East Farm": 1050,
    "Central Farm": 2150,
  },
  {
    month: "Jul",
    "South Farm": 1450,
    "Boac South": 780,
    "North Farm": 1820,
    "West Farm": 580,
    "East Farm": 1020,
    "Central Farm": 2050,
  },
  {
    month: "Aug",
    "South Farm": 1380,
    "Boac South": 750,
    "North Farm": 1750,
    "West Farm": 550,
    "East Farm": 980,
    "Central Farm": 1950,
  },
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

/* Two section headers side-by-side, each with its own export button */
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
              {section.subtitle && (
                <p className="text-xs text-secondary">{section.subtitle}</p>
              )}
            </div>
          </div>
          {section.onExport && (
            <Button variant="outline" onClick={section.onExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Page ---------------- */
export function AnalyticsPage() {
  // Filters (period defaults to "This Month"; association defaults to "All")
  const [period, setPeriod] = useState("month");
  const [association, setAssociation] = useState("All Associations");

  const totalEquipment = equipmentByType.reduce((s, i) => s + i.count, 0);
  const totalLivestock = livestockByCategory.reduce((s, i) => s + i.count, 0);
  const totalYield = cropYield.reduce((s, i) => s + i.yield, 0);
  const totalFarmArea = farmSizeYield.reduce((s, i) => s + i.size, 0);

  const handleExport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Equipment", totalEquipment],
      ["Operational Equipment", equipmentStatus[0].value],
      ["Livestock", totalLivestock],
      ["Healthy Livestock", livestockHealth[0].value],
      ["Farm", totalFarmArea],
      ["Farms", farmSizeYield.length],
      ["Crop Yield (quantity)", totalYield],
    ];
    exportCsv("agricentral-analytics.csv", rows);
  };

  const handleExportEquipment = () => {
    const rows = [
      ["Status", "Count"],
      ...equipmentStatus.map((e) => [e.name, e.value]),
    ];
    exportCsv("agricentral-equipment.csv", rows);
  };

  const handleExportLivestock = () => {
    const rows = [
      ["Health Status", "Count"],
      ...livestockHealth.map((l) => [l.name, l.value]),
    ];
    exportCsv("agricentral-livestock.csv", rows);
  };

  const handleExportFarm = () => {
    const rows = [
      ["Farm", "Size (ha)", "Yield (quantity)"],
      ...farmSizeYield.map((f) => [f.farm, f.size, f.yield]),
      [],
      ["Status", "Count"],
      ...cropStatus.map((c) => [c.name, c.value]),
      [],
      ["Month", ...farmSizeYield.map((f) => f.farm)],
      ...monthlyFarmYield.map((m) => [
        m.month,
        ...farmSizeYield.map((f) => m[f.farm]),
      ]),
    ];
    exportCsv("agricentral-farm.csv", rows);
  };

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Consolidated report across equipment, livestock, farms, and crops."
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Tractor}
          label="Equipment"
          value={totalEquipment}
          sub={`${equipmentStatus[0].value} operational`}
        />
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
      </div>

      {/* Equipment + Livestock, side by side */}
      <DualSectionHeader
        left={{
          icon: Tractor,
          title: "Equipment",
          subtitle: "Current fleet status.",
          onExport: handleExportEquipment,
        }}
        right={{
          icon: Beef,
          title: "Livestock",
          subtitle: "Overall herd health.",
          onExport: handleExportLivestock,
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
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ChartCard>
        <ChartCard title="Health Status" subtitle="Livestock health status.">
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

      {/* Farm (formerly Crops) */}
      <SectionHeader
        icon={Wheat}
        title="Farm"
        subtitle="Yield per farm, crop status, and monthly trends."
        onExport={handleExportFarm}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Yield per Farm"
          subtitle="Quantity harvested per farm."
        >
          <BarChart data={farmSizeYield}>
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
            <Tooltip />
            <Bar
              dataKey="yield"
              fill="#166534"
              name="Yield (quantity)"
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
          subtitle="Quantity harvested per month, by farm."
          height={320}
        >
          <LineChart data={monthlyFarmYield}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {farmSizeYield.map((f, i) => (
              <Line
                key={f.farm}
                type="monotone"
                dataKey={f.farm}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ChartCard>
      </div>
    </div>
  );
}
