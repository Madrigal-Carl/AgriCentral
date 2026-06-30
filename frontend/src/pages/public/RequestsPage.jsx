import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  X,
  Calendar,
  Info,
  AlertTriangle,
  FileText,
  Package,
  Search,
  ChevronDown,
} from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, Select } from "@/components/ui";
import { EQUIPMENTS, LIVESTOCKS } from "@/constants/data";
import useAuth from "@/hooks/useAuth";

const TYPE_OPTIONS = [
  { value: "equipment", label: "Equipment" },
  { value: "livestock", label: "Livestock" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "rejected", label: "Rejected" },
];

const typeLabel = { equipment: "Equipment", livestock: "Livestock" };
const typeTone = { equipment: "info", livestock: "warning" };
const sevTone = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};
const sevLabel = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
const statusTone = {
  pending: "warning",
  approved: "info",
  fulfilled: "success",
  rejected: "danger",
};
const statusLabel = {
  pending: "Pending",
  approved: "Approved",
  fulfilled: "Fulfilled",
  rejected: "Rejected",
};

const equipmentOptions = EQUIPMENTS.map((e) => {
  const n = EQUIPMENTS.filter(
    (x) => x.name === e.name && x.status === "available",
  ).length;
  return { value: e.id, label: `${e.id} · ${e.name} · ${n} available` };
});
const livestockOptions = LIVESTOCKS.map((l) => {
  const n = LIVESTOCKS.filter(
    (x) => x.animal === l.animal && x.status === "active",
  ).length;
  return { value: l.id, label: `${l.id} · ${l.tag} · ${n} available` };
});

const INITIAL = [
  {
    id: "RQ-001",
    title: "Additional tractor for north plot",
    type: "equipment",
    itemId: "EQ-001",
    itemLabel: "EQ-001 · Tractor T-204",
    quantity: 2,
    severity: "high",
    status: "pending",
    date: "2025-06-19",
    details:
      "Need additional tractor units to support expanded acreage this season.",
  },
  {
    id: "RQ-002",
    title: "More dairy cows",
    type: "livestock",
    itemId: "LS-001",
    itemLabel: "LS-001 · Cow #A-204",
    quantity: 5,
    severity: "medium",
    status: "approved",
    date: "2025-06-12",
    details: "Expanding the dairy herd to meet rising milk demand.",
  },
  {
    id: "RQ-003",
    title: "Sprayer replacement",
    type: "equipment",
    itemId: "EQ-004",
    itemLabel: "EQ-004 · Sprayer S-31",
    quantity: 1,
    severity: "critical",
    status: "fulfilled",
    date: "2025-05-28",
    details: "Existing sprayer is no longer reliable; replacement received.",
  },
];

const blankForm = {
  id: "",
  title: "",
  type: "equipment",
  itemId: "",
  itemLabel: "",
  quantity: 1,
  severity: "medium",
  status: "pending",
  date: "",
  details: "",
};

function normalizeRole(role) {
  return role ? String(role).toLowerCase() : "";
}

export function RequestsPage() {
  const { user, role: roleFromAuth } = useAuth();
  const currentRole = normalizeRole(roleFromAuth ?? user?.role);

  // FAR is the role that files requests, so it gets full CRUD over them.
  // Admin is view-only and cannot approve/deny or edit/delete requests.
  // Any other signed-in role only gets to review (approve/deny) requests.
  const isFar = currentRole === "far";
  const isAdmin = currentRole === "admin";

  const [rows, setRows] = useState(INITIAL);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [reviewRow, setReviewRow] = useState(null); // { row, action: "approve" | "deny" }

  const openAdd = () =>
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `RQ-${String(rows.length + 1).padStart(3, "0")}`,
        date: new Date().toISOString().slice(0, 10),
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

  const askApprove = (row) => setReviewRow({ row, action: "approve" });
  const askDeny = (row) => setReviewRow({ row, action: "deny" });
  const confirmReview = () => {
    if (!reviewRow) return;
    const nextStatus = reviewRow.action === "approve" ? "approved" : "rejected";
    setRows((r) =>
      r.map((x) =>
        x.id === reviewRow.row.id ? { ...x, status: nextStatus } : x,
      ),
    );
    setReviewRow(null);
  };

  const handleSave = (data) => {
    setRows((r) => {
      const exists = r.some((x) => x.id === data.id);
      if (exists)
        return r.map((x) => (x.id === data.id ? { ...x, ...data } : x));
      return [...r, { ...data }];
    });
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Requests"
        subtitle="Resource requests across equipment and livestock."
        action={
          !isAdmin ? (
            <Button variant="primary" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Request
            </Button>
          ) : null
        }
      />
      <DataTable
        searchPlaceholder="Search request…"
        data={rows}
        filters={[
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            predicate: (r, v) => r.status === v,
          },
        ]}
        columns={[
          {
            key: "title",
            header: "Title",
            sortable: true,
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.title}</div>
                <div className="text-xs text-secondary">{r.id}</div>
              </div>
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: (r) => (
              <StatusPill tone={typeTone[r.type]}>
                {typeLabel[r.type]}
              </StatusPill>
            ),
          },
          { key: "item", header: "Item", cell: (r) => r.itemLabel || "—" },
          {
            key: "quantity",
            header: "Qty",
            sortable: true,
            cell: (r) => r.quantity,
          },
          {
            key: "severity",
            header: "Severity",
            cell: (r) => (
              <StatusPill tone={sevTone[r.severity]}>
                {sevLabel[r.severity]}
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
            key: "date",
            header: "Date",
            sortable: true,
            cell: (r) => fmtDate(r.date),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) =>
              isAdmin ? (
                <RowActions onView={() => openView(r)} />
              ) : isFar ? (
                <RowActions
                  onView={() => openView(r)}
                  onEdit={() => openEdit(r)}
                  onDelete={() => askDelete(r)}
                />
              ) : (
                <RowActions
                  onView={() => openView(r)}
                  onApprove={() => askApprove(r)}
                  onDeny={() => askDeny(r)}
                />
              ),
          },
        ]}
      />

      {modal && (
        <RequestModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && <RequestDrawer row={drawer} onClose={() => setDrawer(null)} />}
      {confirmDelete && (
        <DeleteConfirmModal
          id={confirmDelete.id}
          title={confirmDelete.title}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
      {reviewRow && (
        <ReviewConfirmModal
          row={reviewRow.row}
          action={reviewRow.action}
          onCancel={() => setReviewRow(null)}
          onConfirm={confirmReview}
        />
      )}
    </div>
  );
}

/* ---------------- Modal ---------------- */
function RequestModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const itemOptions =
    form.type === "equipment" ? equipmentOptions : livestockOptions;

  const onTypeChange = (v) => {
    setForm((f) => ({ ...f, type: v, itemId: "", itemLabel: "" }));
  };

  const onItemChange = (id) => {
    const opt = itemOptions.find((o) => o.value === id);
    setForm((f) => ({ ...f, itemId: id, itemLabel: opt ? opt.label : "" }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.title || !form.itemId) return;
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
            <div className="label-eyebrow mb-1">Request</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Request" : `Edit ${initial.id}`}
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
            <Field label="Title" full>
              <TextInput
                value={form.title}
                onChange={(v) => set("title", v)}
                placeholder="Short summary"
              />
            </Field>
            <Field label="Type">
              <FullSelect
                value={form.type}
                onChange={onTypeChange}
                options={TYPE_OPTIONS}
              />
            </Field>
            <Field label="Severity">
              <FullSelect
                value={form.severity}
                onChange={(v) => set("severity", v)}
                options={SEVERITY_OPTIONS}
              />
            </Field>
            <Field label="Date">
              <TextInput
                type="date"
                value={form.date}
                onChange={(v) => set("date", v)}
              />
            </Field>
            <Field label="Quantity">
              <TextInput
                type="number"
                min="1"
                value={form.quantity}
                onChange={(v) =>
                  set("quantity", Math.max(1, parseInt(v || "1", 10)))
                }
              />
            </Field>
            <Field
              label={form.type === "equipment" ? "Equipment" : "Livestock"}
              full
            >
              <SearchSelect
                value={form.itemId}
                onChange={onItemChange}
                options={itemOptions}
                placeholder={`Select ${form.type}…`}
                searchPlaceholder={`Search ${form.type}…`}
              />
            </Field>
            <Field label="Details" full>
              <textarea
                value={form.details}
                onChange={(e) => set("details", e.target.value)}
                placeholder="Describe the request…"
                rows={5}
                className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground resize-y"
              />
            </Field>
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} type="submit">
            {mode === "add" ? "Add Request" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- SearchSelect (single) ---------------- */
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
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(
    () =>
      options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())),
    [q, options],
  );
  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 border border-border bg-surface px-3 py-2.5 text-left text-sm hover:border-foreground/30"
      >
        <span className={current ? "text-foreground" : "text-secondary"}>
          {current ? current.label : placeholder}
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
              filtered.map((o) => {
                const selected = o.value === value;
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                        setQ("");
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                        selected ? "bg-accent-soft font-semibold" : ""
                      }`}
                    >
                      {o.label}
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

/* ---------------- Delete Confirmation Modal ---------------- */
function DeleteConfirmModal({ id, title, onCancel, onConfirm }) {
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
          Delete Request?
        </h3>
        <p className="text-sm text-secondary mb-6">
          Are you sure you want to delete{" "}
          <strong className="text-foreground">
            {id} — {title}
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

/* ---------------- Review (Approve / Deny) Confirmation Modal ---------------- */
function ReviewConfirmModal({ row, action, onCancel, onConfirm }) {
  const isApprove = action === "approve";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-surface border border-border shadow-xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`mx-auto mb-4 grid h-12 w-12 place-items-center ${
            isApprove
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger"
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          {isApprove ? "Approve Request?" : "Deny Request?"}
        </h3>
        <p className="text-sm text-secondary mb-6">
          {isApprove ? (
            <>
              Mark{" "}
              <strong className="text-foreground">
                {row.id} — {row.title}
              </strong>{" "}
              as approved?
            </>
          ) : (
            <>
              Mark{" "}
              <strong className="text-foreground">
                {row.id} — {row.title}
              </strong>{" "}
              as rejected?
            </>
          )}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? "primary" : "danger"}
            onClick={onConfirm}
          >
            {isApprove ? "Confirm Approve" : "Confirm Deny"}
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

/* ---------------- Drawer (view) ---------------- */
function RequestDrawer({ row, onClose }) {
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
              <div className="label-eyebrow mb-1">Request · {row.id}</div>
              <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                {row.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill tone={typeTone[row.type]}>
                  {typeLabel[row.type]}
                </StatusPill>
                <StatusPill tone={sevTone[row.severity]}>
                  {sevLabel[row.severity]}
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
                ["Request ID", row.id],
                ["Title", row.title],
                ["Type", typeLabel[row.type]],
                ["Severity", sevLabel[row.severity]],
                ["Status", statusLabel[row.status]],
                ["Date", fmtDate(row.date)],
              ]}
            />
          </Section>

          <Section icon={Package} title={`Requested ${typeLabel[row.type]}`}>
            {row.itemLabel ? (
              <div className="flex items-center justify-between gap-3 border border-border bg-muted/40 p-3">
                <div className="min-w-0">
                  <div className="font-semibold text-foreground truncate">
                    {row.itemLabel}
                  </div>
                  <div className="text-xs text-secondary">
                    {typeLabel[row.type]}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="label-eyebrow">Quantity</div>
                  <div className="font-display text-xl text-foreground">
                    {row.quantity}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-secondary">No item selected.</div>
            )}
          </Section>

          <Section icon={FileText} title="Details">
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {row.details || "No additional details provided."}
            </p>
          </Section>

          <Section icon={Calendar} title="Timeline">
            <ol className="relative ml-2 border-l border-border">
              <li className="relative pl-5 pb-4">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                <div className="font-semibold text-sm text-foreground">
                  Request submitted
                </div>
                <div className="text-xs text-secondary">
                  {fmtDate(row.date)}
                </div>
              </li>
              <li className="relative pl-5">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                <div className="font-semibold text-sm text-foreground">
                  Current status
                </div>
                <div className="text-xs text-secondary">
                  {statusLabel[row.status]}
                </div>
              </li>
            </ol>
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
