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
  Wheat,
  Beef,
  Tractor,
  Upload,
  FileText,
  Check,
} from "lucide-react";

import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, Select } from "@/components/ui";

import { FARMERS } from "@/constants/data";
/* ---------------- Reference data ---------------- */
const FARM_OPTIONS = [
  "Greenfield Farm",
  "Sunrise Acres",
  "Riverbend Estate",
  "Highland Pastures",
  "Maple Hollow",
  "Cedar Ridge",
  "Willow Creek",
  "Goldenrod Plains",
];

const LIVESTOCK_OPTIONS = [
  "LS-001 · Cow #A-204",
  "LS-002 · Goat #G-12",
  "LS-003 · Sheep #S-08",
  "LS-004 · Cow #A-117",
  "LS-005 · Pig #P-22",
  "LS-006 · Chicken #C-90",
];

const EQUIPMENT_OPTIONS = [
  "EQ-001 · Tractor T-204",
  "EQ-002 · Harvester H-12",
  "EQ-003 · Plow P-08",
  "EQ-004 · Sprayer S-31",
  "EQ-005 · Seeder SE-14",
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

const statusTone = {
  active: "success",
  inactive: "neutral",
  pending: "warning",
};
const statusLabel = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
};

const blankForm = {
  id: "",
  name: "",
  contact: "",
  email: "",
  gender: "female",
  dob: "",
  address: "",
  farms: [],
  livestock: [],
  equipment: [],
  files: [],
};

/* ---------------- Page ---------------- */
export default function FarmersPage() {
  const [rows, setRows] = useState(FARMERS);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () =>
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `FR-${String(rows.length + 1).padStart(3, "0")}`,
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

  const diff = (next, prev) => {
    const added = next.filter((x) => !prev.includes(x));
    const removed = prev.filter((x) => !next.includes(x));
    return { added, removed };
  };

  const handleSave = (data) => {
    setRows((r) => {
      const exists = r.find((x) => x.id === data.id);
      const today = new Date().toISOString().slice(0, 10);
      if (exists) {
        const ls = diff(data.livestock, exists.livestock);
        const eq = diff(data.equipment, exists.equipment);
        const newEvents = [
          ...ls.added.map((i) => ({
            kind: "livestock",
            action: "Received",
            item: i,
            date: today,
          })),
          ...ls.removed.map((i) => ({
            kind: "livestock",
            action: "Released",
            item: i,
            date: today,
          })),
          ...eq.added.map((i) => ({
            kind: "equipment",
            action: "Received",
            item: i,
            date: today,
          })),
          ...eq.removed.map((i) => ({
            kind: "equipment",
            action: "Returned",
            item: i,
            date: today,
          })),
        ];
        return r.map((x) =>
          x.id === data.id
            ? { ...x, ...data, history: [...(x.history || []), ...newEvents] }
            : x,
        );
      }
      const initialHistory = [
        ...data.livestock.map((i) => ({
          kind: "livestock",
          action: "Received",
          item: i,
          date: today,
        })),
        ...data.equipment.map((i) => ({
          kind: "equipment",
          action: "Received",
          item: i,
          date: today,
        })),
      ];
      return [...r, { ...data, history: initialHistory }];
    });
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Farmers"
        subtitle="All registered farmers and their portfolio."
        action={
          <Button variant="primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Farmer
          </Button>
        }
      />
      <DataTable
        searchPlaceholder="Search farmer by name…"
        data={rows}
        filters={[
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            predicate: (r, v) => r.status === v,
          },
          {
            key: "farms",
            label: "Farms",
            allLabel: "Any Farm Count",
            options: [
              { value: "0", label: "0 farms" },
              { value: "1-2", label: "1–2 farms" },
              { value: "3+", label: "3+ farms" },
            ],
            predicate: (r, v) => {
              const n = r.farms.length;
              if (v === "0") return n === 0;
              if (v === "1-2") return n >= 1 && n <= 2;
              return n >= 3;
            },
          },
        ]}
        columns={[
          {
            key: "name",
            header: "Name",
            sortable: true,
            cell: (r) => (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center bg-primary font-display text-xs text-accent">
                  {r.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{r.name}</div>
                  <div className="text-xs text-secondary">{r.id}</div>
                </div>
              </div>
            ),
          },
          {
            key: "farms",
            header: "Farms",
            sortable: true,
            accessor: (r) => r.farms.length,
            cell: (r) => r.farms.length,
          },
          {
            key: "livestock",
            header: "Livestock",
            sortable: true,
            accessor: (r) => r.livestock.length,
            cell: (r) => r.livestock.length,
          },
          {
            key: "equipment",
            header: "Equipment",
            sortable: true,
            accessor: (r) => r.equipment.length,
            cell: (r) => r.equipment.length,
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
        <FarmerModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && <FarmerDrawer row={drawer} onClose={() => setDrawer(null)} />}
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
function FarmerModal({ mode, initial, onClose, onSave }) {
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
            <div className="label-eyebrow mb-1">Farmer</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Farmer" : `Edit ${initial.name}`}
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
            <Field label="Full Name" full>
              <TextInput
                value={form.name}
                onChange={(v) => set("name", v)}
                placeholder="Jane Doe"
              />
            </Field>
            <Field label="Contact Number">
              <TextInput
                value={form.contact}
                onChange={(v) => set("contact", v)}
                placeholder="+254 700 000 000"
              />
            </Field>
            <Field label="Email Address">
              <TextInput
                type="email"
                value={form.email}
                onChange={(v) => set("email", v)}
                placeholder="name@email.com"
              />
            </Field>
            <Field label="Gender">
              <FullSelect
                value={form.gender}
                onChange={(v) => set("gender", v)}
                options={GENDER_OPTIONS}
              />
            </Field>
            <Field label="Birth Date">
              <TextInput
                type="date"
                value={form.dob}
                onChange={(v) => set("dob", v)}
              />
            </Field>
            <Field label="Address" full>
              <TextInput
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="Street, City"
              />
            </Field>

            {mode === "edit" && (
              <>
                <Field label="Assign Farms" full>
                  <MultiSelect
                    values={form.farms}
                    onChange={(v) => set("farms", v)}
                    options={FARM_OPTIONS}
                    placeholder="Select farms…"
                    searchPlaceholder="Search farm…"
                  />
                </Field>
                <Field label="Assign Livestock" full>
                  <MultiSelect
                    values={form.livestock}
                    onChange={(v) => set("livestock", v)}
                    options={LIVESTOCK_OPTIONS}
                    placeholder="Select livestock…"
                    searchPlaceholder="Search livestock…"
                  />
                </Field>
                <Field label="Assign Equipment" full>
                  <MultiSelect
                    values={form.equipment}
                    onChange={(v) => set("equipment", v)}
                    options={EQUIPMENT_OPTIONS}
                    placeholder="Select equipment…"
                    searchPlaceholder="Search equipment…"
                  />
                </Field>
              </>
            )}

            <Field label="Attachments" full>
              <FileUploader
                value={form.files}
                onChange={(v) => set("files", v)}
              />
            </Field>
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} type="submit">
            {mode === "add" ? "Add Farmer" : "Save Changes"}
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
          Delete Farmer?
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

/* ---------------- MultiSelect (search + multiple) ---------------- */
function MultiSelect({
  values,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
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
  const toggle = (o) => {
    if (values.includes(o)) onChange(values.filter((v) => v !== o));
    else onChange([...values, o]);
  };
  const remove = (o) => onChange(values.filter((v) => v !== o));

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 border border-border bg-surface px-3 py-2.5 text-left text-sm hover:border-foreground/30"
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
              placeholder={searchPlaceholder}
              className="w-full bg-surface py-2.5 pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-auto">
            {filtered.length === 0 ? (
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
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- FileUploader ---------------- */
function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function FileUploader({ value = [], onChange }) {
  const files = value;
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  const setFiles = (updater) =>
    onChange(
      typeof updater === "function" ? updater(filesRef.current) : updater,
    );
  const inputRef = useRef(null);

  const startUpload = (id) => {
    const tick = () => {
      let stillRunning = false;
      setFiles((prev) => {
        const next = prev.map((f) => {
          if (f.id !== id || f.progress >= 100) return f;
          const inc = Math.floor(Math.random() * 18) + 7;
          const np = Math.min(100, f.progress + inc);
          if (np < 100) stillRunning = true;
          return {
            ...f,
            progress: np,
            status: np >= 100 ? "done" : "uploading",
          };
        });
        return next;
      });
      if (stillRunning) setTimeout(tick, 250);
    };
    setTimeout(tick, 200);
  };

  const onPick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const mapped = picked.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
      progress: 0,
      status: "uploading",
    }));
    setFiles((prev) => [...prev, ...mapped]);
    mapped.forEach((m) => startUpload(m.id));
    e.target.value = "";
  };

  const remove = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-1.5 border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-secondary hover:border-foreground-40 hover:bg-muted/40"
      >
        <Upload className="h-5 w-5" />
        <span className="font-medium text-foreground">
          Click to upload files
        </span>
        <span className="text-xs">You can select multiple files</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={onPick}
      />
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 border border-border bg-surface px-3 py-2.5"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center bg-muted text-secondary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm font-medium text-foreground hover:underline"
                  >
                    {f.name}
                  </a>
                  <span className="shrink-0 text-xs text-secondary">
                    {formatBytes(f.size)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-muted">
                    <div
                      className={`h-full transition-all ${
                        f.status === "done" ? "bg-success" : "bg-accent"
                      }`}
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-secondary">
                    {f.status === "done" ? (
                      <Check className="ml-auto h-3.5 w-3.5 text-success" />
                    ) : (
                      `${f.progress}%`
                    )}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="grid h-7 w-7 shrink-0 place-items-center text-secondary hover:bg-muted hover:text-foreground"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Drawer (view) ---------------- */
function FarmerDrawer({ row, onClose }) {
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
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-primary font-display text-base text-accent">
                {row.name[0]}
              </div>
              <div className="min-w-0">
                <div className="label-eyebrow mb-1">Farmer · {row.id}</div>
                <h2 className="font-display text-2xl tracking-tight text-foreground truncate">
                  {row.name}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill tone={statusTone[row.status]}>
                    {statusLabel[row.status]}
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
                ["Farmer ID", row.id],
                ["Full Name", row.name],
                ["Contact Number", row.contact || "—"],
                ["Email Address", row.email || "—"],
                ["Gender", row.gender === "male" ? "Male" : "Female"],
                ["Birth Date", fmtDate(row.dob)],
                ["Address", row.address || "—"],
                ["Status", statusLabel[row.status]],
              ]}
            />
          </Section>

          <Section icon={Wheat} title="Assigned Farms">
            <ItemList items={row.farms} empty="No farms assigned." />
          </Section>

          <Section icon={Beef} title="Assigned Livestock">
            <ItemList items={row.livestock} empty="No livestock assigned." />
          </Section>

          <Section icon={Tractor} title="Assigned Equipment">
            <ItemList items={row.equipment} empty="No equipment assigned." />
          </Section>

          <Section icon={Calendar} title="Activity Timeline">
            {row.history && row.history.length > 0 ? (
              <ol className="relative ml-2 border-l border-border">
                {row.history.map((h, i) => (
                  <li key={i} className="relative pl-5 pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                    <div className="font-semibold text-sm text-foreground">
                      {h.action} {h.kind}: {h.item}
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

          <Section icon={FileText} title="Uploaded Files">
            {row.files && row.files.length > 0 ? (
              <ul className="space-y-2">
                {row.files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 border border-border bg-muted/40 px-3 py-2"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center bg-surface text-secondary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm font-medium text-foreground hover:underline"
                      >
                        {f.name}
                      </a>
                      <div className="text-xs text-secondary">
                        {formatBytes(f.size)}
                      </div>
                    </div>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-secondary">No files uploaded.</div>
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
          className="flex items-center justify-between border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground"
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
