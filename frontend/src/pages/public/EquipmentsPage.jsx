import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  X,
  Search,
  ChevronDown,
  User,
  Calendar,
  Activity,
  Info,
  AlertTriangle,
} from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, Select } from "@/components/ui";
import { EQUIPMENTS } from "@/constants/data";

const FARMERS = [
  "Lina Okoro",
  "Samuel Mwangi",
  "Aisha Bello",
  "Chidi Okafor",
  "Joseph Kamau",
  "Fatou Diop",
  "Grace Mensah",
  "Ibrahim Sow",
  "Helen Adeyemi",
  "Ravi Patel",
];

const CONDITION_OPTIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "maintenance", label: "Maintenance" },
  { value: "damaged", label: "Damaged" },
];
const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "repair", label: "Repair" },
];

const condTone = {
  excellent: "success",
  good: "info",
  maintenance: "warning",
  damaged: "danger",
};
const statusTone = {
  available: "success",
  assigned: "info",
  repair: "warning",
};
const condLabel = {
  excellent: "Excellent",
  good: "Good",
  maintenance: "Maintenance",
  damaged: "Damaged",
};
const statusLabel = {
  available: "Available",
  assigned: "Assigned",
  repair: "Repair",
};

const blankForm = {
  id: "",
  name: "",
  condition: "excellent",
  status: "available",
  farmer: "",
  acquisitionDate: "",
};

export default function EquipmentsPage() {
  const [rows, setRows] = useState(EQUIPMENTS);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () =>
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `EQ-${String(rows.length + 1).padStart(3, "0")}`,
      },
    });
  const openEdit = (row) => setModal({ mode: "edit", data: { ...row } });
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => setConfirmDelete(row);
  const confirmRemove = () => {
    if (!confirmDelete) return;
    setRows((r) => r.filter((x) => x.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  const handleSave = (data) => {
    setRows((r) => {
      const exists = r.some((x) => x.id === data.id);
      if (exists) {
        return r.map((x) =>
          x.id === data.id
            ? {
                ...x,
                ...data,
                history:
                  x.name !== data.name && data.name
                    ? [
                        ...(x.history || []),
                        {
                          name: data.name,
                          date:
                            data.acquisitionDate ||
                            new Date().toISOString().slice(0, 10),
                        },
                      ]
                    : x.history,
              }
            : x,
        );
      }
      return [
        ...r,
        {
          ...data,
          history: data.name
            ? [
                {
                  name: data.name,
                  date:
                    data.acquisitionDate ||
                    new Date().toISOString().slice(0, 10),
                },
              ]
            : [],
        },
      ];
    });
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Equipment"
        subtitle="Fleet & tools across all farms."
        action={
          <Button variant="primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Equipment
          </Button>
        }
      />
      <DataTable
        searchPlaceholder="Search equipment…"
        data={rows}
        filters={[
          {
            key: "condition",
            label: "Condition",
            options: CONDITION_OPTIONS,
            predicate: (r, v) => r.condition === v,
          },
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            predicate: (r, v) => r.status === v,
          },
        ]}
        columns={[
          {
            key: "id",
            header: "Equipment ID",
            sortable: true,
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.id}</div>
                <div className="text-xs text-secondary">{r.name}</div>
              </div>
            ),
          },
          {
            key: "farmer",
            header: "Assigned Farmer",
            sortable: true,
            cell: (r) => r.farmer || "—",
          },
          {
            key: "condition",
            header: "Condition",
            cell: (r) => (
              <StatusPill tone={condTone[r.condition]}>
                {condLabel[r.condition]}
              </StatusPill>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => (
              <StatusPill tone={statusTone[r.status]}>
                {statusLabel[r.status]}
              </StatusPill>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => (
              <RowActions
                onView={() => openView(r)}
                onEdit={() => openEdit(r)}
                onDelete={() => askDelete(r)}
              />
            ),
          },
        ]}
      />

      {modal && (
        <EquipmentModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && (
        <EquipmentDrawer row={drawer} onClose={() => setDrawer(null)} />
      )}
      {confirmDelete && (
        <DeleteConfirmModal
          id={confirmDelete.id}
          name={confirmDelete.name}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}

/* ---------------- Modal ---------------- */
function EquipmentModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    onSave(form);
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
            <div className="label-eyebrow mb-1">Equipment</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Equipment" : `Edit ${initial.id}`}
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
            <Field label="Equipment ID">
              <TextInput
                value={form.id}
                onChange={(v) => set("id", v)}
                placeholder="EQ-001"
              />
            </Field>
            <Field label="Name">
              <TextInput
                value={form.name}
                onChange={(v) => set("name", v)}
                placeholder="Tractor T-204"
              />
            </Field>
            <Field label="Condition">
              <FullSelect
                value={form.condition}
                onChange={(v) => set("condition", v)}
                options={CONDITION_OPTIONS}
              />
            </Field>
            <Field label="Status">
              <FullSelect
                value={form.status}
                onChange={(v) => set("status", v)}
                options={STATUS_OPTIONS}
              />
            </Field>
            <Field label="Assigned Farmer" full>
              <FarmerSelect
                value={form.farmer}
                onChange={(v) => set("farmer", v)}
              />
            </Field>
            <Field label="Acquisition Date" full>
              <TextInput
                type="date"
                value={form.acquisitionDate}
                onChange={(v) => set("acquisitionDate", v)}
              />
            </Field>
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} type="submit">
            {mode === "add" ? "Add Equipment" : "Save Changes"}
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
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-danger/10 text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          Delete Equipment?
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
    <div className="[&>div]:w-full">
      <Select value={value} onChange={onChange} options={options} />
    </div>
  );
}

/* ---------------- Farmer searchable select ---------------- */
function FarmerSelect({ value, onChange }) {
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
    () => FARMERS.filter((f) => f.toLowerCase().includes(q.toLowerCase())),
    [q],
  );
  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between border border-border bg-surface px-3 py-2.5 text-left text-sm hover:border-foreground/30"
      >
        <span className={value ? "text-foreground" : "text-secondary"}>
          {value || "Select farmer…"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-secondary transition-transform ${open ? "rotate-180" : ""}`}
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
              placeholder="Search farmer…"
              className="w-full bg-surface py-2.5 pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-secondary">
                No farmers found.
              </li>
            ) : (
              filtered.map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(f);
                      setOpen(false);
                      setQ("");
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                      f === value ? "bg-accent-soft font-semibold" : ""
                    }`}
                  >
                    {f}
                    {f === value && <span className="h-1.5 w-1.5 bg-accent" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- Drawer (view) ---------------- */
function EquipmentDrawer({ row, onClose }) {
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
            <div className="min-w-0">
              <div className="label-eyebrow mb-1">Equipment · {row.id}</div>
              <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                {row.name}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill tone={condTone[row.condition]}>
                  {condLabel[row.condition]}
                </StatusPill>
                <StatusPill tone={statusTone[row.status]}>
                  {statusLabel[row.status]}
                </StatusPill>
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
                ["Equipment ID", row.id],
                ["Name", row.name],
                ["Condition", condLabel[row.condition]],
                ["Status", statusLabel[row.status]],
                ["Acquisition Date", fmtDate(row.acquisitionDate)],
              ]}
            />
          </Section>

          <Section icon={User} title="Assigned Farmer">
            {row.farmer ? (
              <div className="flex items-center gap-3 border border-border bg-muted/40 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-primary font-display text-sm text-accent">
                  {row.farmer[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">
                    {row.farmer}
                  </div>
                  <div className="text-xs text-secondary">
                    Since {fmtDate(row.acquisitionDate)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-secondary">No farmer assigned.</div>
            )}
          </Section>

          <Section icon={Activity} title="Condition Records">
            <DefList
              items={[
                ["Current Condition", condLabel[row.condition]],
                ["Status", statusLabel[row.status]],
                [
                  "Last Updated",
                  fmtDate(new Date().toISOString().slice(0, 10)),
                ],
              ]}
            />
          </Section>

          <Section icon={Calendar} title="Activity Timeline">
            {row.history && row.history.length > 0 ? (
              <ol className="relative ml-2 border-l border-border">
                {row.history.map((h, i) => (
                  <li key={i} className="relative pl-5 pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                    <div className="font-semibold text-sm text-foreground">
                      {h.name}
                    </div>
                    <div className="text-xs text-secondary">
                      Acquired · {fmtDate(h.date)}
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
