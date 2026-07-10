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
  Eye,
  UserPlus,
  RefreshCw,
  Undo2,
  Trash2,
} from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, IconButton, Select } from "@/components/ui";

import { EQUIPMENTS } from "@/constants/data";
import { usePermissions } from "@/constants/permissions";
import useAuth from "@/hooks/useAuth";

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

const EQUIPMENT_CATALOG = [
  "Tractor T-204",
  "Harvester H-12",
  "Plow P-08",
  "Sprayer S-31",
  "Seeder SD-15",
  "Rotavator RV-09",
  "Cultivator C-22",
  "Baler B-17",
  "Irrigation Pump IP-05",
  "Thresher TR-11",
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

function normalizeRole(role) {
  return role ? String(role).toLowerCase() : "";
}

export function EquipmentsPage() {
  const can = usePermissions("equipments");
  const { user, role: roleFromAuth } = useAuth();
  const currentRole = normalizeRole(roleFromAuth ?? user?.role);

  // Coordinators and admins manage equipment directly (id/name/condition/status)
  // via a simpler add/edit modal and plain View/Edit/Delete actions. FAR keeps the
  // assign/update-status/return workflow.
  const isManagerRole =
    currentRole === "coordinator" || currentRole === "admin";

  const [rows, setRows] = useState(EQUIPMENTS);
  const [catalog, setCatalog] = useState(EQUIPMENT_CATALOG);
  const [addModal, setAddModal] = useState(false);
  const [coordModal, setCoordModal] = useState(null); // { mode: "add" | "edit", data }
  const [assignRow, setAssignRow] = useState(null);
  const [statusRow, setStatusRow] = useState(null);
  const [returnRow, setReturnRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [drawer, setDrawer] = useState(null);

  const nextId = () => `EQ-${String(rows.length + 1).padStart(3, "0")}`;

  const openAddModal = () => {
    if (!can.add) return;
    if (isManagerRole) {
      setCoordModal({
        mode: "add",
        data: {
          id: nextId(),
          name: "",
          condition: "excellent",
          status: "available",
        },
      });
      return;
    }
    setAddModal(true);
  };
  const openCoordEdit = (row) => {
    if (!can.edit) return;
    setCoordModal({
      mode: "edit",
      data: {
        id: row.id,
        name: row.name,
        condition: row.condition,
        status: row.status,
      },
    });
  };
  const openAssign = (row) => {
    if (!can.edit) return;
    setAssignRow(row);
  };
  const openStatus = (row) => {
    if (!can.edit) return;
    setStatusRow(row);
  };
  const openReturn = (row) => {
    if (!can.delete) return;
    setReturnRow(row);
  };
  const openDelete = (row) => {
    if (!can.delete) return;
    setDeleteRow(row);
  };

  const handleAdd = (data) => {
    if (!can.add) return;
    if (data.name && !catalog.includes(data.name)) {
      setCatalog((c) => [...c, data.name]);
    }
    setRows((r) => [
      ...r,
      {
        id: nextId(),
        name: data.name,
        condition: "excellent",
        status: data.status,
        farmer: "",
        acquisitionDate: data.acquisitionDate,
        history: [
          {
            name: data.name,
            date: data.acquisitionDate || new Date().toISOString().slice(0, 10),
          },
        ],
      },
    ]);
    setAddModal(false);
  };

  const handleCoordSave = (data) => {
    if (coordModal?.mode === "add" && !can.add) return;
    if (coordModal?.mode === "edit" && !can.edit) return;
    if (data.name && !catalog.includes(data.name)) {
      setCatalog((c) => [...c, data.name]);
    }
    setRows((r) => {
      const exists = r.some((x) => x.id === data.id);
      if (exists) {
        return r.map((x) =>
          x.id === data.id
            ? {
                ...x,
                name: data.name,
                condition: data.condition,
                status: data.status,
              }
            : x,
        );
      }
      const today = new Date().toISOString().slice(0, 10);
      return [
        ...r,
        {
          id: data.id,
          name: data.name,
          condition: data.condition,
          status: data.status,
          farmer: "",
          acquisitionDate: today,
          history: [{ name: data.name, date: today }],
        },
      ];
    });
    setCoordModal(null);
  };

  const handleAssign = (farmer) => {
    if (!assignRow || !can.edit) return;
    setRows((r) =>
      r.map((x) =>
        x.id === assignRow.id ? { ...x, farmer, status: "assigned" } : x,
      ),
    );
    setAssignRow(null);
  };

  const handleStatusUpdate = (condition) => {
    if (!statusRow || !can.edit) return;
    setRows((r) =>
      r.map((x) => (x.id === statusRow.id ? { ...x, condition } : x)),
    );
    setStatusRow(null);
  };

  const handleReturn = () => {
    if (!returnRow || !can.delete) return;
    setRows((r) =>
      r.map((x) =>
        x.id === returnRow.id ? { ...x, farmer: "", status: "available" } : x,
      ),
    );
    setReturnRow(null);
  };

  const handleDelete = () => {
    if (!deleteRow || !can.delete) return;
    setRows((r) => r.filter((x) => x.id !== deleteRow.id));
    setDeleteRow(null);
  };

  return (
    <div>
      <PageHeader
        title="Equipment"
        subtitle="Fleet & tools across all farms."
        action={
          can.add ? (
            <Button variant="accent" onClick={openAddModal}>
              <Plus className="h-4 w-4" /> Add Equipment
            </Button>
          ) : null
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
            header: "Equipment Tag ID",
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
            cell: (r) =>
              isManagerRole ? (
                <RowActions
                  onView={() => setDrawer(r)}
                  onEdit={can.edit ? () => openCoordEdit(r) : undefined}
                  onDelete={can.delete ? () => openDelete(r) : undefined}
                />
              ) : (
                <div className="flex items-center justify-end gap-1">
                  <IconButton
                    icon={Eye}
                    label="View"
                    onClick={() => setDrawer(r)}
                  />
                  {can.edit && (
                    <IconButton
                      icon={UserPlus}
                      label="Assign"
                      onClick={() => openAssign(r)}
                    />
                  )}
                  {can.edit && (
                    <IconButton
                      icon={RefreshCw}
                      label="Update Status"
                      onClick={() => openStatus(r)}
                    />
                  )}
                  {can.delete && (
                    <IconButton
                      icon={Undo2}
                      label="Return"
                      tone="danger"
                      onClick={() => openReturn(r)}
                    />
                  )}
                </div>
              ),
          },
        ]}
      />

      {addModal && can.add && !isManagerRole && (
        <AddEquipmentModal
          nextId={nextId()}
          catalog={catalog}
          onClose={() => setAddModal(false)}
          onSave={handleAdd}
        />
      )}
      {coordModal && (
        <CoordinatorEquipmentModal
          mode={coordModal.mode}
          initial={coordModal.data}
          catalog={catalog}
          onClose={() => setCoordModal(null)}
          onSave={handleCoordSave}
        />
      )}
      {assignRow && can.edit && !isManagerRole && (
        <AssignModal
          row={assignRow}
          onClose={() => setAssignRow(null)}
          onSave={handleAssign}
        />
      )}
      {statusRow && can.edit && !isManagerRole && (
        <StatusUpdateModal
          row={statusRow}
          onClose={() => setStatusRow(null)}
          onSave={handleStatusUpdate}
        />
      )}
      {returnRow && can.delete && !isManagerRole && (
        <ReturnConfirmModal
          row={returnRow}
          onCancel={() => setReturnRow(null)}
          onConfirm={handleReturn}
        />
      )}
      {deleteRow && can.delete && isManagerRole && (
        <DeleteConfirmModal
          row={deleteRow}
          onCancel={() => setDeleteRow(null)}
          onConfirm={handleDelete}
        />
      )}
      {drawer && (
        <EquipmentDrawer row={drawer} onClose={() => setDrawer(null)} />
      )}
    </div>
  );
}

/* ---------------- Modal Shell ---------------- */
function ModalShell({
  title,
  eyebrow,
  onClose,
  children,
  footer,
  maxWidth = "max-w-lg",
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onClose}
    >
      <div
        className={`relative flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden bg-surface border border-border shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            {eyebrow && <div className="label-eyebrow mb-1">{eyebrow}</div>}
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {title}
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
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Add Equipment Modal (FAR) ---------------- */
function AddEquipmentModal({ nextId, catalog, onClose, onSave }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("available");
  const [acquisitionDate, setAcquisitionDate] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!name) return;
    onSave({ name, status, acquisitionDate });
  };

  return (
    <ModalShell
      eyebrow={`Equipment · ${nextId}`}
      title="Add New Equipment"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            Add Equipment
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Equipment">
          <SearchableSelect
            value={name}
            onChange={setName}
            options={catalog}
            placeholder="Select equipment…"
            searchPlaceholder="Search or add equipment…"
            allowCreate
          />
        </Field>
        <Field label="Status">
          <FullSelect
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
          />
        </Field>
        <Field label="Acquisition Date">
          <TextInput
            type="date"
            value={acquisitionDate}
            onChange={setAcquisitionDate}
          />
        </Field>
      </form>
    </ModalShell>
  );
}

/* ---------------- Add/Edit Equipment Modal (Coordinator) ---------------- */
function CoordinatorEquipmentModal({
  mode,
  initial,
  catalog,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.id || !form.name) return;
    onSave(form);
  };

  return (
    <ModalShell
      eyebrow={`Equipment · ${form.id || "New"}`}
      title={mode === "add" ? "Add New Equipment" : `Edit ${initial.id}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add Equipment" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Equipment Tag ID">
          <TextInput
            value={form.id}
            onChange={(v) => set("id", v)}
            placeholder="EQ-001"
            disabled={mode === "edit"}
          />
        </Field>
        <Field label="Equipment Name">
          <SearchableSelect
            value={form.name}
            onChange={(v) => set("name", v)}
            options={catalog}
            placeholder="Select equipment…"
            searchPlaceholder="Search or add equipment…"
            allowCreate
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
      </form>
    </ModalShell>
  );
}

/* ---------------- Assign Modal (FAR) ---------------- */
function AssignModal({ row, onClose, onSave }) {
  const [farmer, setFarmer] = useState(row.farmer || "");
  const submit = (e) => {
    e.preventDefault();
    if (!farmer) return;
    onSave(farmer);
  };
  return (
    <ModalShell
      eyebrow={`Equipment · ${row.id}`}
      title={`Assign ${row.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            Assign
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <Field label="Assigned Farmer">
          <SearchableSelect
            value={farmer}
            onChange={setFarmer}
            options={FARMERS}
            placeholder="Select farmer…"
            searchPlaceholder="Search farmer…"
          />
        </Field>
      </form>
    </ModalShell>
  );
}

/* ---------------- Status Update Modal (FAR) ---------------- */
function StatusUpdateModal({ row, onClose, onSave }) {
  const [condition, setCondition] = useState(row.condition);
  const submit = (e) => {
    e.preventDefault();
    onSave(condition);
  };
  return (
    <ModalShell
      eyebrow={`Equipment · ${row.id}`}
      title={`Update Status — ${row.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <Field label="Condition">
          <FullSelect
            value={condition}
            onChange={setCondition}
            options={CONDITION_OPTIONS}
          />
        </Field>
      </form>
    </ModalShell>
  );
}

/* ---------------- Return Confirm Modal (FAR) ---------------- */
function ReturnConfirmModal({ row, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-surface border border-border shadow-xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-warning/10 text-warning">
          <Undo2 className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          Return Equipment?
        </h3>
        <p className="text-sm text-secondary mb-6">
          Have you already returned{" "}
          <strong className="text-foreground">
            {row.id} ({row.name})
          </strong>{" "}
          ? It will be removed from your inventory.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="accent" onClick={onConfirm}>
            Confirm Return
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Delete Confirm Modal (Coordinator) ---------------- */
function DeleteConfirmModal({ row, onCancel, onConfirm }) {
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
          <Trash2 className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          Delete Equipment?
        </h3>
        <p className="text-sm text-secondary mb-6">
          Are you sure you want to delete{" "}
          <strong className="text-foreground">
            {row.id} ({row.name})
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

/* ---------------- Field helpers ---------------- */
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
      className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground disabled:cursor-not-allowed disabled:bg-muted-40 disabled:text-secondary"
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

/* ---------------- Searchable Select (with optional create) ---------------- */
function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  allowCreate = false,
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
    () => options.filter((f) => f.toLowerCase().includes(q.toLowerCase())),
    [q, options],
  );
  const canCreate =
    allowCreate &&
    q.trim().length > 0 &&
    !options.some((o) => o.toLowerCase() === q.trim().toLowerCase());

  const pick = (v) => {
    onChange(v);
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between border border-border bg-surface px-3 py-2.5 text-left text-sm hover:border-foreground-40"
      >
        <span className={value ? "text-foreground" : "text-secondary"}>
          {value || placeholder}
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCreate) {
                  e.preventDefault();
                  pick(q.trim());
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
              <>
                {filtered.map((f) => (
                  <li key={f}>
                    <button
                      type="button"
                      onClick={() => pick(f)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                        f === value ? "bg-accent-soft font-semibold" : ""
                      }`}
                    >
                      {f}
                      {f === value && (
                        <span className="h-1.5 w-1.5 bg-accent" />
                      )}
                    </button>
                  </li>
                ))}
                {canCreate && (
                  <li>
                    <button
                      type="button"
                      onClick={() => pick(q.trim())}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Plus className="h-3.5 w-3.5 text-accent" />
                      Add &ldquo;{q.trim()}&rdquo;
                    </button>
                  </li>
                )}
              </>
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
                ["Equipment Tag ID", row.id],
                ["Name", row.name],
                ["Condition", condLabel[row.condition]],
                ["Status", statusLabel[row.status]],
                ["Acquisition Date", fmtDate(row.acquisitionDate)],
              ]}
            />
          </Section>

          <Section icon={User} title="Assigned Farmer">
            {row.farmer ? (
              <div className="flex items-center gap-3 border border-border bg-muted-40 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-accent-soft rounded-full font-display text-sm text-accent">
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
