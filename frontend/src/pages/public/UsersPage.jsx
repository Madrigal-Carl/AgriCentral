import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  X,
  Info,
  AlertTriangle,
  KeyRound,
  Mail,
  ShieldCheck,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";

import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, Select } from "@/components/ui";

import { USERS } from "@/constants/data";

/* ---------------- Reference data ---------------- */
const ROLE_OPTIONS = [
  { value: "far", label: "FAR" },
  { value: "aew", label: "AEW" },
  { value: "coordinator", label: "Coordinator" },
  { value: "governor", label: "Governor" },
  { value: "head", label: "Head" },
];

const roleLabel = {
  far: "FAR",
  aew: "AEW",
  coordinator: "Coordinator",
  governor: "Governor",
  head: "Head",
};
const roleTone = {
  far: "info",
  aew: "warning",
  coordinator: "success",
  governor: "neutral",
  head: "danger",
};

// Associations a FAR account can be assigned to.
const ASSOCIATIONS = [
  "Boac, Marinduque",
  "Mogpog, Marinduque",
  "Santa Cruz, Marinduque",
  "Torrijos, Marinduque",
  "Buenavista, Marinduque",
  "Gasan, Marinduque",
];

const DEFAULT_PASSWORD = "AgriCentral@123";

const blankForm = {
  id: "",
  fullName: "",
  email: "",
  role: "far",
  password: "",
  association: "",
  isVerified: true, // accounts created by an admin are verified immediately
};

/* ---------------- Page ---------------- */
export function UsersPage() {
  const [rows, setRows] = useState(USERS);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeny, setConfirmDeny] = useState(null);
  const [confirmApprove, setConfirmApprove] = useState(null);

  const openAdd = () =>
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `US-${String(rows.length + 1).padStart(3, "0")}`,
        // New users get a fixed default password until the first reset.
        password: DEFAULT_PASSWORD,
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

  const askDeny = (row) => setConfirmDeny(row);
  const confirmDenyAction = () => {
    if (!confirmDeny) return;
    setRows((r) => r.filter((x) => x.id !== confirmDeny.id));
    setConfirmDeny(null);
  };

  // Self-registered FAR accounts don't have an association attached to
  // them yet, so approval doubles as the moment that gets set. The
  // confirmation modal collects the association name and it's saved
  // together with isVerified in one step.
  const askApprove = (row) => setConfirmApprove(row);
  const confirmApproveAction = (associationName) => {
    if (!confirmApprove) return;
    setRows((r) =>
      r.map((x) =>
        x.id === confirmApprove.id
          ? { ...x, isVerified: true, association: associationName }
          : x,
      ),
    );
    setConfirmApprove(null);
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
        title="Users"
        subtitle="Accounts with access to this system."
        action={
          <Button variant="accent" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add User
          </Button>
        }
      />
      <DataTable
        searchPlaceholder="Search user by name…"
        data={rows}
        filters={[
          {
            key: "role",
            label: "Role",
            options: ROLE_OPTIONS,
            predicate: (r, v) => r.role === v,
          },
        ]}
        columns={[
          {
            key: "fullName",
            header: "Name",
            sortable: true,
            cell: (r) => (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center bg-accent-soft font-display text-xs text-accent rounded-full">
                  {r.fullName[0]}
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {r.fullName}
                  </div>
                  <div className="text-xs text-secondary">{r.id}</div>
                </div>
              </div>
            ),
          },
          {
            key: "email",
            header: "Email Address",
            sortable: true,
            cell: (r) => r.email || "—",
          },
          {
            key: "role",
            header: "Role",
            cell: (r) => (
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusPill tone={roleTone[r.role]}>
                  {roleLabel[r.role]}
                </StatusPill>
                {!r.isVerified && (
                  <StatusPill tone="warning">Pending</StatusPill>
                )}
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => {
              // Self-registered FAR accounts need admin approval before
              // they get normal row actions. Until then, show
              // Approve/Deny instead of View/Edit/Delete.
              const needsReview = r.role === "far" && !r.isVerified;
              return needsReview ? (
                <RowActions
                  onView={() => openView(r)}
                  onApprove={() => askApprove(r)}
                  onDeny={() => askDeny(r)}
                />
              ) : (
                <RowActions
                  onView={() => openView(r)}
                  onEdit={() => openEdit(r)}
                  onDelete={() => askDelete(r)}
                />
              );
            },
          },
        ]}
      />

      {modal && (
        <UserModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && <UserDrawer row={drawer} onClose={() => setDrawer(null)} />}
      {confirmDelete && (
        <DeleteConfirmModal
          id={confirmDelete.id}
          name={confirmDelete.fullName}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
      {confirmApprove && (
        <ApproveConfirmModal
          id={confirmApprove.id}
          name={confirmApprove.fullName}
          initialAssociation={confirmApprove.association}
          onCancel={() => setConfirmApprove(null)}
          onConfirm={confirmApproveAction}
        />
      )}
      {confirmDeny && (
        <DenyConfirmModal
          id={confirmDeny.id}
          name={confirmDeny.fullName}
          onCancel={() => setConfirmDeny(null)}
          onConfirm={confirmDenyAction}
        />
      )}
    </div>
  );
}

/* ---------------- Association Select + Search ---------------- */
function AssociationSelect({ value, onChange, options = ASSOCIATIONS, error }) {
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
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 border bg-surface px-3 py-2.5 text-sm outline-none hover:border-foreground ${
          error ? "border-danger" : "border-border"
        } ${value ? "text-foreground" : "text-secondary"}`}
      >
        <span className="truncate">{value || "Select association…"}</span>
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

/* ---------------- Modal ---------------- */
function UserModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email) return;
    if (form.role === "far" && !form.association.trim()) {
      setTouched(true);
      return;
    }
    onSave(form);
  };

  // Reset Password no longer opens a separate confirmation modal. Since the
  // edit form already requires an explicit Save Changes to persist anything,
  // restoring the default password here is just a draft-level change — it
  // only takes effect (and invalidates the old password) once the user saves.
  const handleResetPassword = () => set("password", DEFAULT_PASSWORD);

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
            <div className="label-eyebrow mb-1">User</div>
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {mode === "add" ? "Add New User" : `Edit ${initial.fullName}`}
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
                value={form.fullName}
                onChange={(v) => set("fullName", v)}
                placeholder="Jane Doe"
              />
            </Field>
            <Field label="Email Address" full>
              <TextInput
                type="email"
                value={form.email}
                onChange={(v) => set("email", v)}
                placeholder="name@email.com"
              />
            </Field>
            <Field label="Role" full>
              <FullSelect
                value={form.role}
                onChange={(v) => set("role", v)}
                options={ROLE_OPTIONS}
              />
            </Field>

            {/* Association only applies to FAR accounts, since FAR
                is tied to a specific association. Shown/required whenever
                the selected role is FAR, in both add and edit mode. */}
            {form.role === "far" && (
              <Field label="Association" full>
                <AssociationSelect
                  value={form.association}
                  onChange={(v) => {
                    set("association", v);
                    if (touched) setTouched(false);
                  }}
                  error={touched && !form.association.trim()}
                />
                {touched && !form.association.trim() && (
                  <p className="mt-1 text-xs text-danger">
                    Association is required for FAR accounts.
                  </p>
                )}
              </Field>
            )}

            {/* Password is always view-only. In add mode it shows the fixed
                default password the new user will receive; in edit mode it
                shows the current password, with a Reset Password action
                underneath that drafts the default password to be applied
                on Save. */}
            <Field label="Password" full>
              <TextInput
                type="text"
                value={form.password}
                onChange={() => {}}
                readOnly
                disabled
                placeholder="••••••••"
              />
              {mode === "edit" && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:underline"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Reset Password
                </button>
              )}
            </Field>
          </div>
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add User" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Delete Confirmation Modal ---------------------- */
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
          Delete User?
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

/* ---------------- Approve Confirmation Modal ---------------- */
function ApproveConfirmModal({
  id,
  name,
  initialAssociation,
  onCancel,
  onConfirm,
}) {
  const [association, setAssociation] = useState(initialAssociation || "");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const isValid = association.trim().length > 0;

  const handleConfirm = () => {
    if (!isValid) {
      setTouched(true);
      return;
    }
    onConfirm(association.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-surface border border-border shadow-xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-success/10 text-success">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          Approve Registration?
        </h3>
        <p className="text-sm text-secondary mb-4">
          This will verify the pending account for{" "}
          <strong className="text-foreground">
            {id} ({name})
          </strong>
          . Since this account self-registered, assign the association it
          belongs to before approving.
        </p>

        <div className="mb-6 text-left">
          <label className="label-eyebrow mb-1.5 block">Association</label>
          <AssociationSelect
            value={association}
            onChange={(v) => {
              setAssociation(v);
              if (touched) setTouched(false);
            }}
            error={touched && !isValid}
          />
          {touched && !isValid && (
            <p className="mt-1 text-xs text-danger">
              Association is required to approve this account.
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleConfirm}>
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Deny Confirmation Modal ---------------- */
function DenyConfirmModal({ id, name, onCancel, onConfirm }) {
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
          Deny Registration?
        </h3>
        <p className="text-sm text-secondary mb-6">
          This will permanently remove the pending account for{" "}
          <strong className="text-foreground">
            {id} ({name})
          </strong>
          . They will need to register again to request access.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Deny
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full, action }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="label-eyebrow">{label}</label>
        {action}
      </div>
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

/* ---------------- Drawer (view) ---------------- */
function UserDrawer({ row, onClose }) {
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
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-accent-soft rounded-full font-display text-base text-accent">
                {row.fullName[0]}
              </div>
              <div className="min-w-0">
                <div className="label-eyebrow mb-1">User · {row.id}</div>
                <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                  {row.fullName}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill tone={roleTone[row.role]}>
                    {roleLabel[row.role]}
                  </StatusPill>
                  {!row.isVerified && (
                    <StatusPill tone="warning">Pending</StatusPill>
                  )}
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
                ["User ID", row.id],
                ["Full Name", row.fullName],
                ["Role", roleLabel[row.role]],
                ...(row.role === "far"
                  ? [["Association", row.association || "—"]]
                  : []),
              ]}
            />
          </Section>

          <Section icon={Mail} title="Contact">
            <DefList items={[["Email Address", row.email || "—"]]} />
          </Section>

          <Section icon={ShieldCheck} title="Security">
            <div className="flex items-center justify-between gap-3 border border-border bg-muted-40 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <KeyRound className="h-4 w-4 text-secondary" />
                Password
              </div>
              <span className="font-mono text-sm tracking-widest text-secondary">
                ••••••••
              </span>
            </div>
            <p className="mt-2 text-xs text-secondary">
              Passwords are never shown in full. Use Reset Password from the
              edit screen to issue a new one.
            </p>
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
