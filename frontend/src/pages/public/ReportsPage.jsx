import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Calendar,
  Info,
  AlertTriangle,
  FileText,
  User,
} from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, Select } from "@/components/ui";
import { REPORTS } from "@/constants/data";

const TYPE_OPTIONS = [
  { value: "crop", label: "Crop" },
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
  { value: "open", label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
];

const typeLabel = {
  crop: "Crop",
  equipment: "Equipment",
  livestock: "Livestock",
};
const typeTone = { crop: "success", equipment: "info", livestock: "warning" };
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
const statusTone = { open: "warning", in_review: "info", resolved: "success" };
const statusLabel = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
};

const blankForm = {
  id: "",
  title: "",
  type: "crop",
  reportedBy: "",
  severity: "medium",
  status: "open",
  date: "",
  details: "",
};

export function ReportsPage() {
  const [rows, setRows] = useState(REPORTS);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () =>
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `RP-${String(rows.length + 1).padStart(3, "0")}`,
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
        title="Reports"
        subtitle="Field reports across crops, equipment, and livestock."
        action={
          <Button variant="primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Report
          </Button>
        }
      />
      <DataTable
        searchPlaceholder="Search report…"
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
          {
            key: "reportedBy",
            header: "Reported By",
            sortable: true,
            cell: (r) => r.reportedBy || "—",
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
            key: "date",
            header: "Date",
            sortable: true,
            cell: (r) => fmtDate(r.date),
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
        <ReportModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && <ReportDrawer row={drawer} onClose={() => setDrawer(null)} />}
      {confirmDelete && (
        <DeleteConfirmModal
          id={confirmDelete.id}
          title={confirmDelete.title}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}

/* ---------------- Modal ---------------- */
function ReportModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.title) return;
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
            <div className="label-eyebrow mb-1">Report</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Report" : `Edit ${initial.id}`}
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
                onChange={(v) => set("type", v)}
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
            <Field label="Reported By">
              <TextInput
                value={form.reportedBy}
                onChange={(v) => set("reportedBy", v)}
                placeholder="Name"
              />
            </Field>
            <Field label="Date">
              <TextInput
                type="date"
                value={form.date}
                onChange={(v) => set("date", v)}
              />
            </Field>
            <Field label="Details" full>
              <textarea
                value={form.details}
                onChange={(e) => set("details", e.target.value)}
                placeholder="Describe the report…"
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
            {mode === "add" ? "Add Report" : "Save Changes"}
          </Button>
        </div>
      </div>
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
          Delete Report?
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
function ReportDrawer({ row, onClose }) {
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
              <div className="label-eyebrow mb-1">Report · {row.id}</div>
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
          <Section icon={Info} title="Report Information">
            <DefList
              items={[
                ["Report ID", row.id],
                ["Title", row.title],
                ["Type", typeLabel[row.type]],
                ["Severity", sevLabel[row.severity]],
                ["Status", statusLabel[row.status]],
                ["Date", fmtDate(row.date)],
              ]}
            />
          </Section>

          <Section icon={User} title="Reported By">
            {row.reportedBy ? (
              <div className="flex items-center gap-3 border border-border bg-muted/40 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-accent-soft rounded-full font-display text-sm text-accent">
                  {row.reportedBy[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">
                    {row.reportedBy}
                  </div>
                  <div className="text-xs text-secondary">
                    Submitted {fmtDate(row.date)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-secondary">No reporter listed.</div>
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
                  Report submitted
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
