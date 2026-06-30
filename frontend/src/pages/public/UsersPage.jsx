import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Info,
  AlertTriangle,
  KeyRound,
  Mail,
  ShieldCheck,
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

const DEFAULT_PASSWORD = "AgriCentral@123";

const blankForm = {
  id: "",
  fullName: "",
  email: "",
  role: "far",
  password: "",
  isVerified: true, // accounts created by an admin are verified immediately
};

/* ---------------- Page ---------------- */
export function UsersPage() {
  const [rows, setRows] = useState(USERS);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeny, setConfirmDeny] = useState(null);

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

  const approveUser = (row) => {
    setRows((r) =>
      r.map((x) => (x.id === row.id ? { ...x, isVerified: true } : x)),
    );
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
          <Button variant="primary" onClick={openAdd}>
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
                  onApprove={() => approveUser(r)}
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

/* ---------------- Modal ---------------- */
function UserModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email) return;
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

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} type="submit">
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
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-danger/10 text-danger">
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
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-danger/10 text-danger">
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
      className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-secondary"
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
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-primary font-display text-base text-accent">
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
              ]}
            />
          </Section>

          <Section icon={Mail} title="Contact">
            <DefList items={[["Email Address", row.email || "—"]]} />
          </Section>

          <Section icon={ShieldCheck} title="Security">
            <div className="flex items-center justify-between gap-3 border border-border bg-muted/40 p-3">
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
