import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  X,
  Search,
  ChevronDown,
  Info,
  AlertTriangle,
  Users,
  MapPin,
  Calendar,
} from "lucide-react";
import { PageHeader, DataTable, RowActions } from "@/components/public";
import { Button, Select } from "@/components/ui";

/* ---------------- Reference data ---------------- */
const MEMBER_OPTIONS = [
  "FR-001 · Lina Okoro",
  "FR-002 · Samuel Mwangi",
  "FR-003 · Aisha Bello",
  "FR-004 · Chidi Okafor",
  "FR-005 · Grace Njeri",
  "FR-006 · Daniel Otieno",
  "FR-007 · Mary Wanjiku",
  "FR-008 · Peter Kamau",
];

const POSITION_OPTIONS = [
  { value: "president", label: "President" },
  { value: "vice_president", label: "Vice President" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "auditor", label: "Auditor" },
  { value: "member", label: "Member" },
];

const positionLabel = Object.fromEntries(
  POSITION_OPTIONS.map((p) => [p.value, p.label]),
);

/* ---------------- Initial rows ---------------- */
const INITIAL = [
  {
    id: "AS-001",
    address: "Barangay Hall, Kisumu Rd, Nairobi",
    dateFounded: "2018-03-12",
    members: [
      { name: "FR-001 · Lina Okoro", position: "president" },
      { name: "FR-002 · Samuel Mwangi", position: "secretary" },
      { name: "FR-005 · Grace Njeri", position: "treasurer" },
      { name: "FR-007 · Mary Wanjiku", position: "member" },
    ],
  },
  {
    id: "AS-002",
    address: "Community Center, Eldoret",
    dateFounded: "2020-07-04",
    members: [
      { name: "FR-004 · Chidi Okafor", position: "president" },
      { name: "FR-006 · Daniel Otieno", position: "vice_president" },
      { name: "FR-008 · Peter Kamau", position: "treasurer" },
    ],
  },
  {
    id: "AS-003",
    address: "Cedar Ridge Hall, Ikeja",
    dateFounded: "2022-11-21",
    members: [
      { name: "FR-003 · Aisha Bello", position: "president" },
      { name: "FR-001 · Lina Okoro", position: "auditor" },
    ],
  },
];

const blankForm = {
  id: "",
  address: "",
  dateFounded: "",
  members: [], // [{ name, position }]
};

/* ---------------- Page ---------------- */
export function AssociationsPage() {
  const [rows, setRows] = useState(INITIAL);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () =>
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `AS-${String(rows.length + 1).padStart(3, "0")}`,
      },
    });
  const openEdit = (row) =>
    setModal({
      mode: "edit",
      data: { ...row, members: row.members.map((m) => ({ ...m })) },
    });
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => setConfirmDelete(row);
  const confirmRemove = () => {
    if (!confirmDelete) return;
    setRows((r) => r.filter((x) => x.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  const handleSave = (data) => {
    setRows((r) => {
      const exists = r.find((x) => x.id === data.id);
      if (exists)
        return r.map((x) => (x.id === data.id ? { ...x, ...data } : x));
      return [...r, data];
    });
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Association"
        subtitle="Community associations the AEW coordinates with."
        action={
          <Button variant="primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Association
          </Button>
        }
      />
      <DataTable
        searchPlaceholder="Search association by address…"
        data={rows}
        filters={[
          {
            key: "members",
            label: "Members",
            allLabel: "Any Member Count",
            options: [
              { value: "1-3", label: "1–3 members" },
              { value: "4-6", label: "4–6 members" },
              { value: "7+", label: "7+ members" },
            ],
            predicate: (r, v) => {
              const n = r.members.length;
              if (v === "1-3") return n >= 1 && n <= 3;
              if (v === "4-6") return n >= 4 && n <= 6;
              return n >= 7;
            },
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
            key: "dateFounded",
            header: "Date Founded",
            sortable: true,
            cell: (r) => fmtDate(r.dateFounded),
          },
          {
            key: "members",
            header: "Members",
            sortable: true,
            accessor: (r) => r.members.length,
            cell: (r) => r.members.length,
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
        <AssociationModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && (
        <AssociationDrawer row={drawer} onClose={() => setDrawer(null)} />
      )}
      {confirmDelete && (
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
function AssociationModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const memberNames = form.members.map((m) => m.name);
  const setMemberNames = (names) => {
    const prev = form.members;
    const next = names.map(
      (n) => prev.find((p) => p.name === n) || { name: n, position: "member" },
    );
    set("members", next);
  };
  const setPosition = (name, pos) =>
    set(
      "members",
      form.members.map((m) => (m.name === name ? { ...m, position: pos } : m)),
    );

  const submit = (e) => {
    e.preventDefault();
    if (!form.address || !form.dateFounded) return;
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
            <div className="label-eyebrow mb-1">Association</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New Association" : `Edit ${initial.id}`}
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
            <Field label="Address">
              <TextInput
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="Street, City"
              />
            </Field>
            <Field label="Date Founded">
              <TextInput
                type="date"
                value={form.dateFounded}
                onChange={(v) => set("dateFounded", v)}
              />
            </Field>
            <Field label="Members" full>
              <MultiSelect
                values={memberNames}
                onChange={setMemberNames}
                options={MEMBER_OPTIONS}
                placeholder="Select members…"
                searchPlaceholder="Search member…"
              />
            </Field>

            {form.members.length > 0 && (
              <Field label="Assign Positions" full>
                <ul className="space-y-2">
                  {form.members.map((m) => (
                    <li
                      key={m.name}
                      className="flex flex-wrap items-center justify-between gap-3 border border-border bg-muted/30 px-3 py-2"
                    >
                      <span className="truncate text-sm font-medium text-foreground">
                        {m.name}
                      </span>
                      <div className="[&>div]:w-44">
                        <Select
                          value={m.position}
                          onChange={(v) => setPosition(m.name, v)}
                          options={POSITION_OPTIONS}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Field>
            )}
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} type="submit">
            {mode === "add" ? "Add Association" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Delete Confirmation ---------------- */
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
          Delete Association?
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

/* ---------------- Drawer ---------------- */
function AssociationDrawer({ row, onClose }) {
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
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="label-eyebrow mb-1">Association · {row.id}</div>
                <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                  {row.address}
                </h2>
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
                ["Association ID", row.id],
                ["Address", row.address || "—"],
                ["Date Founded", fmtDate(row.dateFounded)],
                ["Number of Members", String(row.members.length)],
              ]}
            />
          </Section>

          <Section icon={Users} title="Members & Positions">
            {row.members.length === 0 ? (
              <div className="text-sm text-secondary">No members assigned.</div>
            ) : (
              <ul className="space-y-2">
                {row.members.map((m) => (
                  <li
                    key={m.name}
                    className="flex items-center justify-between border border-border bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="truncate font-medium text-foreground">
                      {m.name}
                    </span>
                    <span className="ml-3 shrink-0 border-l-2 border-accent bg-accent-soft px-2.5 py-1 text-xs font-semibold text-foreground">
                      {positionLabel[m.position] || m.position}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}

/* ---------------- Small components ---------------- */
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
