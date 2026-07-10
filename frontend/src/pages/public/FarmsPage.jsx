import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  X,
  Search,
  ChevronDown,
  Calendar,
  Activity,
  Info,
  AlertTriangle,
  Wheat,
  Users,
  MapPin,
  Scale,
  Crosshair,
  ExternalLink,
} from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, Select } from "@/components/ui";

import {
  FARMS,
  BOAC_CENTER,
  CROP_OPTIONS,
  CROP_STATUS_TONE,
  CROP_STATUS_LABEL,
} from "@/constants/data";
import { usePermissions } from "@/constants/permissions";

/* ---------------- Reference data ---------------- */
const FARMER_OPTIONS = [
  "FR-001 · Lina Okoro",
  "FR-002 · Samuel Mwangi",
  "FR-003 · Aisha Bello",
  "FR-004 · Chidi Okafor",
  "FR-005 · Joseph Kamau",
  "FR-006 · Mariam Diallo",
];

const CROP_STATUS_OPTIONS = [
  { value: "planted", label: "Planted" },
  { value: "growing", label: "Growing" },
  { value: "harvested", label: "Harvested" },
  { value: "fallow", label: "Fallow" },
];

const blankForm = {
  id: "",
  address: "",
  size: "",
  location: null,
  farmers: [],
  crops: [],
  yieldKg: "",
};

/* ---------------- Page ---------------- */
export function FarmsPage() {
  const can = usePermissions("farms");

  const [rows, setRows] = useState(FARMS);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () => {
    if (!can.add) return;
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `FM-${String(rows.length + 1).padStart(3, "0")}`,
      },
    });
  };
  const openEdit = (row) => {
    if (!can.edit) return;
    setModal({ mode: "edit", data: { ...row } });
  };
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => {
    if (!can.delete) return;
    setConfirmDelete(row);
  };
  const confirmRemove = () => {
    if (!confirmDelete || !can.delete) return;
    setRows((r) => r.filter((x) => x.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  const diffNames = (next, prev) => {
    const added = next.filter((x) => !prev.includes(x));
    const removed = prev.filter((x) => !next.includes(x));
    return { added, removed };
  };

  const setCropStatus = (crop, status) => {
    set(
      "crops",
      form.crops.map((c) =>
        c.crop === crop
          ? {
              ...c,
              status,
              yieldKg: status === "harvested" ? (c.yieldKg ?? "") : undefined,
            }
          : c,
      ),
    );
  };

  const setCropYield = (crop, yieldKg) => {
    set(
      "crops",
      form.crops.map((c) => (c.crop === crop ? { ...c, yieldKg } : c)),
    );
  };

  const handleSave = (data) => {
    if (!can.add && !can.edit) return;
    setRows((r) => {
      const exists = r.find((x) => x.id === data.id);
      const today = new Date().toISOString().slice(0, 10);
      const cleaned = {
        ...data,
        size: Number(data.size) || 0,
        yieldKg: Number(data.yieldKg) || 0,
        location: data.location || null,
        crops: (data.crops || []).filter((c) => c.crop),
      };

      if (exists) {
        const prevCrops = exists.crops.map((c) => c.crop);
        const nextCrops = cleaned.crops.map((c) => c.crop);
        const cd = diffNames(nextCrops, prevCrops);
        const harvestedNew = cleaned.crops.filter((c) => {
          const before = exists.crops.find((p) => p.crop === c.crop);
          return (
            c.status === "harvested" &&
            (!before || before.status !== "harvested")
          );
        });
        const newEvents = [
          ...cd.added.map((c) => ({
            action: "Received",
            item: `${c} seeds`,
            date: today,
          })),
          ...harvestedNew.map((c) => ({
            action: "Harvested",
            item: c.crop,
            date: today,
          })),
        ];
        return r.map((x) =>
          x.id === data.id
            ? {
                ...x,
                ...cleaned,
                history: [...(x.history || []), ...newEvents],
              }
            : x,
        );
      }
      const initialHistory = [
        ...cleaned.crops.map((c) => ({
          action: c.status === "harvested" ? "Harvested" : "Received",
          item: c.status === "harvested" ? c.crop : `${c.crop} seeds`,
          date: today,
        })),
      ];
      return [...r, { ...cleaned, history: initialHistory }];
    });
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Farms"
        subtitle="Land assets, sizes, and crop allocations."
        action={
          can.add ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Farm
            </Button>
          ) : null
        }
      />
      <DataTable
        searchPlaceholder="Search by address…"
        data={rows}
        filters={[
          {
            key: "crop",
            label: "Crop",
            options: CROP_OPTIONS.map((c) => ({ value: c, label: c })),
            predicate: (r, v) => r.crops.some((c) => c.crop === v),
          },
        ]}
        columns={[
          {
            key: "address",
            header: "Address",
            sortable: true,
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.address}</div>
                <div className="text-xs text-secondary">{r.id}</div>
              </div>
            ),
          },
          {
            key: "crops",
            header: "Crops",
            sortable: true,
            accessor: (r) => r.crops.length,
            cell: (r) => r.crops.length,
          },
          {
            key: "farmers",
            header: "Farmers",
            sortable: true,
            accessor: (r) => r.farmers.length,
            cell: (r) => r.farmers.length,
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => (
              <RowActions
                onView={() => openView(r)}
                onEdit={can.edit ? () => openEdit(r) : undefined}
                onDelete={can.delete ? () => askDelete(r) : undefined}
              />
            ),
          },
        ]}
      />

      {modal && (can.add || can.edit) && (
        <FarmModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && <FarmDrawer row={drawer} onClose={() => setDrawer(null)} />}
      {confirmDelete && can.delete && (
        <DeleteConfirmModal
          id={confirmDelete.id}
          name={confirmDelete.address}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}

/* ---------------- Modal ---------------- */
function FarmModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.address) return;
    onSave(form);
  };

  const cropNames = form.crops.map((c) => c.crop);
  const onCropsChange = (next) => {
    const map = new Map(form.crops.map((c) => [c.crop, c.status]));
    const merged = next.map((name) => ({
      crop: name,
      status: map.get(name) ?? "planted",
    }));
    set("crops", merged);
  };
  const setCropStatus = (crop, status) => {
    set(
      "crops",
      form.crops.map((c) => (c.crop === crop ? { ...c, status } : c)),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden bg-surface border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="label-eyebrow mb-1">Farm</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Farm" : `Edit ${initial.address}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center text-secondary hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Farm Tag ID" full>
              <TextInput
                value={form.id}
                onChange={(v) => set("id", v)}
                placeholder="FM-001"
              />
            </Field>
            <Field label="Address" full>
              <TextInput
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="Nakuru, KE"
              />
            </Field>
            <Field label="Assign Farmers" full>
              <MultiSelect
                values={form.farmers}
                onChange={(v) => set("farmers", v)}
                options={FARMER_OPTIONS}
                placeholder="Select farmers…"
                searchPlaceholder="Search farmer…"
              />
            </Field>
            <Field label="Geotag Location" full>
              <LocationPicker
                value={form.location}
                onChange={(v) => set("location", v)}
              />
            </Field>
            <Field label="Crops" full>
              <MultiSelect
                values={cropNames}
                onChange={onCropsChange}
                options={CROP_OPTIONS}
                placeholder="Select crops…"
                searchPlaceholder="Search crop…"
              />
            </Field>
            {form.crops.length > 0 && (
              <div className="sm:col-span-2 space-y-2">
                {form.crops.map((c) => (
                  <div
                    key={c.crop}
                    className="flex flex-col gap-2 bg-surface border border-border px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Wheat className="h-4 w-4 text-accent" />
                        {c.crop}
                      </div>
                      <FullSelect
                        value={c.status}
                        onChange={(v) => setCropStatus(c.crop, v)}
                        options={CROP_STATUS_OPTIONS}
                      />
                    </div>
                    {c.status === "harvested" && (
                      <TextInput
                        type="number"
                        value={c.yieldKg ?? ""}
                        onChange={(v) => setCropYield(c.crop, v)}
                        placeholder="Yield (kg)"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add Farm" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Delete Confirmation Modal ---------------- */
function DeleteConfirmModal({ id, name, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-surface border border-border shadow-xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-danger-10 text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          Delete Farm?
        </h3>
        <p className="text-sm text-secondary mb-6">
          Are you sure you want to delete{" "}
          <strong className="text-foreground">
            {id} ({name})
          </strong>
          ? This action cannot be undone.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="label-eyebrow mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, type = "text", ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground"
      {...rest}
    />
  );
}

function FullSelect({ value, onChange, options }) {
  return (
    <div className="[&>div]:w-full sm:[&>div]:w-44">
      <Select value={value} onChange={onChange} options={options} />
    </div>
  );
}

/* ---------------- MultiSelect (search + multiple) ---------------- */
function MultiSelect({
  values,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  allowCreate = false,
  onCreate,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);
  const filtered = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(q.toLowerCase())),
    [q, options],
  );
  const trimmed = q.trim();
  const exactMatch = useMemo(
    () => options.some((o) => o.toLowerCase() === trimmed.toLowerCase()),
    [options, trimmed],
  );
  const canCreate = allowCreate && trimmed.length > 0 && !exactMatch;
  const toggle = (o) => {
    if (values.includes(o)) onChange(values.filter((v) => v !== o));
    else onChange([...values, o]);
  };
  const handleCreate = () => {
    if (!canCreate) return;
    onCreate?.(trimmed);
    if (!values.includes(trimmed)) onChange([...values, trimmed]);
    setQ("");
  };
  const remove = (o) => onChange(values.filter((v) => v !== o));

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 border border-border bg-surface px-3 py-2.5 text-left text-sm hover:border-foreground-40"
      >
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {values.length === 0 ? (
            <span className="text-secondary">{placeholder}</span>
          ) : (
            values.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 border border-border bg-accent-soft px-2 py-0.5 text-xs font-semibold text-foreground"
              >
                {v}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(v);
                  }}
                  className="cursor-pointer text-secondary hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 border border-border bg-surface shadow-lg">
          <div className="relative border-b border-border">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCreate) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-surface py-2.5 pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-auto">
            {filtered.length === 0 && !canCreate ? (
              <li className="px-3 py-3 text-sm text-secondary">No results.</li>
            ) : (
              filtered.map((o) => {
                const selected = values.includes(o);
                return (
                  <li key={o}>
                    <button
                      type="button"
                      onClick={() => toggle(o)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                        selected ? "bg-accent-soft font-semibold" : ""
                      }`}
                    >
                      {o}
                      {selected && <span className="h-1.5 w-1.5 bg-accent" />}
                    </button>
                  </li>
                );
              })
            )}
            {canCreate && (
              <li className="border-t border-border">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-accent hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                  Add &ldquo;{trimmed}&rdquo;
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- Drawer (view) ---------------- */
function FarmDrawer({ row, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground-40" />
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-surface border-l border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-accent-soft rounded-full text-accent">
                <Wheat className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="label-eyebrow mb-1">Farm · {row.id}</div>
                <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                  {row.address}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill tone="info">{row.size} ha</StatusPill>
                  <StatusPill tone="neutral">
                    {row.crops.length} crops
                  </StatusPill>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center text-secondary hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <Section icon={Info} title="Basic Information">
            <DefList
              items={[
                ["Farm Tag ID", row.id],
                ["Address", row.address],
                ["Crops Count", row.crops.length],
                ["Farmer Count", row.farmers.length],
              ]}
            />
          </Section>

          <Section icon={Scale} title="Crop Yield">
            <div className="flex items-center gap-3 border border-border bg-muted-40 px-3 py-2">
              <div className="grid h-8 w-8 place-items-center bg-accent-soft text-foreground">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs text-secondary">Total yield</div>
                <div className="font-display text-xl tracking-tight text-foreground">
                  {(row.yieldKg || 0).toLocaleString()} kg
                </div>
              </div>
            </div>
          </Section>

          <Section icon={Users} title="Assigned Farmers">
            <ItemList items={row.farmers} empty="No farmers assigned." />
          </Section>

          <Section icon={Wheat} title="Crop Information">
            {row.crops.length === 0 ? (
              <div className="text-sm text-secondary">No crops planted.</div>
            ) : (
              <ul className="space-y-2">
                {row.crops.map((c) => (
                  <li
                    key={c.crop}
                    className="flex items-center justify-between border border-border bg-muted-40 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {c.crop}
                    </span>
                    <StatusPill tone={CROP_STATUS_TONE[c.status]}>
                      {CROP_STATUS_LABEL[c.status]}
                    </StatusPill>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section icon={MapPin} title="Geotag Location">
            {row.location ? (
              <LocationMap location={row.location} />
            ) : (
              <div className="text-sm text-secondary">No location pinned.</div>
            )}
          </Section>

          <Section icon={Activity} title="Activity Timeline">
            {row.history && row.history.length > 0 ? (
              <ol className="relative ml-2 border-l border-border">
                {row.history.map((h, i) => (
                  <li key={i} className="relative pl-5 pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                    <div className="font-semibold text-sm text-foreground">
                      {h.action} {h.item}
                    </div>
                    <div className="text-xs text-secondary">
                      {fmtDate(h.date)}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-secondary">No activity yet.</div>
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}

function ItemList({ items, empty }) {
  if (!items || items.length === 0)
    return <div className="text-sm text-secondary">{empty}</div>;
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li
          key={i}
          className="flex items-center justify-between border border-border bg-muted-40 px-3 py-2 text-sm font-medium text-foreground"
        >
          <span className="truncate">{i}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center bg-accent-soft text-foreground">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="font-display text-base tracking-tight text-foreground">
          {title}
        </h3>
      </div>
      <div className="border border-border bg-surface p-4">{children}</div>
    </section>
  );
}

function DefList({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="flex flex-col">
          <dt className="label-eyebrow mb-0.5">{k}</dt>
          <dd className="text-sm font-medium text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ---------------- Location helpers ---------------- */
function fmtCoord(n, pos, neg) {
  const dir = n >= 0 ? pos : neg;
  return `${Math.abs(n).toFixed(4)}° ${dir}`;
}

const MARKER_ICON_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const MARKER_ICON_2X_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const MARKER_SHADOW_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

function LeafletMap({ location, onPick, height = "h-56", interactive = true }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onPickRef = useRef(onPick);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // Mount Leaflet once on the client.
  useEffect(() => {
    let cancelled = false;
    let cleanupFns = [];

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const icon = L.icon({
        iconUrl: MARKER_ICON_URL,
        iconRetinaUrl: MARKER_ICON_2X_URL,
        shadowUrl: MARKER_SHADOW_URL,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const start = location || BOAC_CENTER;
      const zoom = location ? 15 : 13;

      const map = L.map(containerRef.current, {
        center: [start.lat, start.lng],
        zoom,
        scrollWheelZoom: interactive,
        dragging: interactive,
        doubleClickZoom: interactive,
        zoomControl: interactive,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      if (location) {
        markerRef.current = L.marker([location.lat, location.lng], {
          icon,
          draggable: interactive,
        }).addTo(map);
        if (interactive) {
          markerRef.current.on("dragend", (e) => {
            const { lat, lng } = e.target.getLatLng();
            onPickRef.current?.({
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
            });
          });
        }
      }

      if (interactive) {
        map.on("click", (e) => {
          const lat = Number(e.latlng.lat.toFixed(6));
          const lng = Number(e.latlng.lng.toFixed(6));
          if (!markerRef.current) {
            markerRef.current = L.marker([lat, lng], {
              icon,
              draggable: true,
            }).addTo(map);
            markerRef.current.on("dragend", (ev) => {
              const ll = ev.target.getLatLng();
              onPickRef.current?.({
                lat: Number(ll.lat.toFixed(6)),
                lng: Number(ll.lng.toFixed(6)),
              });
            });
          } else {
            markerRef.current.setLatLng([lat, lng]);
          }
          onPickRef.current?.({ lat, lng });
        });
      }

      // Leaflet needs a size recalc when mounted in modals/drawers.
      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(containerRef.current);
      cleanupFns.push(() => ro.disconnect());

      // Initial paint fix.
      setTimeout(() => map.invalidateSize(), 50);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => fn());
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
    // Mount once per instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external location changes (e.g. "Use my location", "Clear").
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!location) {
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
        return;
      }
      const latlng = [location.lat, location.lng];
      if (markerRef.current) {
        markerRef.current.setLatLng(latlng);
      } else {
        const icon = L.icon({
          iconUrl: MARKER_ICON_URL,
          iconRetinaUrl: MARKER_ICON_2X_URL,
          shadowUrl: MARKER_SHADOW_URL,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });
        markerRef.current = L.marker(latlng, {
          icon,
          draggable: interactive,
        }).addTo(map);
        if (interactive) {
          markerRef.current.on("dragend", (e) => {
            const ll = e.target.getLatLng();
            onPickRef.current?.({
              lat: Number(ll.lat.toFixed(6)),
              lng: Number(ll.lng.toFixed(6)),
            });
          });
        }
      }
      map.setView(latlng, Math.max(map.getZoom(), 13));
    })();
  }, [location?.lat, location?.lng, ready, interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative z-0 w-full ${height} border border-border bg-muted`}
    />
  );
}

function LocationMap({ location }) {
  const { lat, lng } = location;
  return (
    <div className="space-y-3">
      <LeafletMap location={location} interactive={false} height="h-56" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-accent" />
          <span className="font-mono text-foreground">
            {fmtCoord(lat, "N", "S")}, {fmtCoord(lng, "E", "W")}
          </span>
        </div>
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
        >
          Open in maps <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function LocationPicker({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    setBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setBusy(false);
      },
      (err) => {
        setError(err.message || "Unable to get current location.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3 border border-border p-3">
      <div className="flex items-start gap-2 text-xs text-secondary">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
        <span>
          Click anywhere on the map to drop a pin. Drag the pin to refine the
          farm's exact location.
        </span>
      </div>

      <LeafletMap location={value} onPick={onChange} height="h-64" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          {value ? (
            <span className="font-mono text-foreground">
              {fmtCoord(value.lat, "N", "S")}, {fmtCoord(value.lng, "E", "W")}
            </span>
          ) : (
            <span className="text-secondary">No pin dropped yet.</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={busy}
            className="inline-flex items-center gap-1.5 border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60"
          >
            <Crosshair className="h-3.5 w-3.5 text-accent" />
            {busy ? "Locating…" : "Use my location"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-secondary hover:text-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-1.5 text-xs text-danger">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
