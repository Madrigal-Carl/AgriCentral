import { useState, useRef, useMemo, useEffect } from "react";
import { Plus, X, Search, ChevronDown, AlertTriangle } from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button } from "@/components/ui";

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
  { value: "not_planted", label: "Not Planted" },
];

const SEED_CROPS = [
  {
    id: "CR-001",
    name: "Maize",
    kilos: 1200,
    farmer: "FR-002 · Samuel Mwangi",
    status: "planted",
  },
  {
    id: "CR-002",
    name: "Rice",
    kilos: 850,
    farmer: "FR-001 · Lina Okoro",
    status: "planted",
  },
  {
    id: "CR-003",
    name: "Cassava",
    kilos: 430,
    farmer: "FR-004 · Chidi Okafor",
    status: "not_planted",
  },
];

const blankForm = {
  id: "",
  name: "",
  kilos: "",
  farmer: "",
  status: "not_planted",
};

/* ---------------- Page ---------------- */
export function CropsPage() {
  const [rows, setRows] = useState(SEED_CROPS);
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () =>
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `CR-${String(rows.length + 1).padStart(3, "0")}`,
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
    const cleaned = {
      ...data,
      kilos: Number(data.kilos) || 0,
    };
    setRows((r) => {
      const exists = r.find((x) => x.id === data.id);
      if (exists)
        return r.map((x) => (x.id === data.id ? { ...x, ...cleaned } : x));
      return [...r, cleaned];
    });
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Crops"
        subtitle="Crop batches, yield weight, and farmer assignment."
        action={
          <Button variant="accent" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Crop
          </Button>
        }
      />
      <DataTable
        searchPlaceholder="Search by crop name…"
        data={rows}
        filters={[
          {
            key: "status",
            label: "Status",
            options: CROP_STATUS_OPTIONS,
            predicate: (r, v) => r.status === v,
          },
        ]}
        columns={[
          {
            key: "name",
            header: "Crop Name",
            sortable: true,
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.name}</div>
                <div className="text-xs text-secondary">{r.id}</div>
              </div>
            ),
          },
          {
            key: "kilos",
            header: "Kilogram",
            sortable: true,
            accessor: (r) => r.kilos,
            cell: (r) => `${(r.kilos || 0).toLocaleString()} kg`,
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            cell: (r) => (
              <StatusPill tone={r.status === "planted" ? "success" : "neutral"}>
                {r.status === "planted" ? "Planted" : "Not Planted"}
              </StatusPill>
            ),
          },
          {
            key: "farmer",
            header: "Assigned Farmer",
            sortable: true,
            cell: (r) => r.farmer || "—",
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => (
              <RowActions
                onEdit={() => openEdit(r)}
                onDelete={() => askDelete(r)}
              />
            ),
          },
        ]}
      />

      {modal && (
        <CropModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
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
function CropModal({ mode, initial, onClose, onSave }) {
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
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden bg-surface border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="label-eyebrow mb-1">Crop</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Crop" : `Edit ${initial.name}`}
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
          <div className="grid grid-cols-1 gap-4">
            <Field label="Crop Name">
              <TextInput
                value={form.name}
                onChange={(v) => set("name", v)}
                placeholder="Maize"
              />
            </Field>
            <Field label="Kilogram">
              <TextInput
                type="number"
                value={form.kilos}
                onChange={(v) => set("kilos", v)}
                placeholder="e.g. 1200"
              />
            </Field>
            <Field label="Assign Farmer">
              <SearchSelect
                value={form.farmer}
                onChange={(v) => set("farmer", v)}
                options={FARMER_OPTIONS}
                placeholder="Select farmer…"
                searchPlaceholder="Search farmer…"
              />
            </Field>
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add Crop" : "Save Changes"}
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
          Delete Crop?
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

/* ---------------- Shared field helpers ---------------- */
function Field({ label, children }) {
  return (
    <div>
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

/* ---------------- SearchSelect (single value + search) ---------------- */
function SearchSelect({
  value,
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

  const pick = (o) => {
    onChange(o);
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 border border-border bg-surface px-3 py-2.5 text-left text-sm hover:border-foreground-40"
      >
        <span className={value ? "text-foreground" : "text-secondary"}>
          {value || placeholder}
        </span>
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
              filtered.map((o) => (
                <li key={o}>
                  <button
                    type="button"
                    onClick={() => pick(o)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                      value === o ? "bg-accent-soft font-semibold" : ""
                    }`}
                  >
                    {o}
                    {value === o && <span className="h-1.5 w-1.5 bg-accent" />}
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
