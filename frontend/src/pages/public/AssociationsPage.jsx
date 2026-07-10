import { useState, useEffect } from "react";
import { Plus, X, AlertTriangle, Building2, Users2 } from "lucide-react";

import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button } from "@/components/ui";

import { ASSOCIATIONS } from "@/constants/data";

const blankForm = {
  id: "",
  name: "",
  members: [], // [{ name, position }] — e.g. { name: "Juan Dela Cruz", position: "President" }
};

// Visual tone per officer position, used for the badges in the drawer.
const positionTone = {
  President: "danger",
  "Vice President": "warning",
  Secretary: "info",
  Treasurer: "success",
  Member: "neutral",
};

/* ---------------- Page ---------------- */
export function AssociationsPage() {
  const [rows, setRows] = useState(ASSOCIATIONS);
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
  const openEdit = (row) => setModal({ mode: "edit", data: { ...row } });
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => setConfirmDelete(row);
  const confirmRemove = () => {
    if (!confirmDelete) return;
    setRows((r) => r.filter((x) => x.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  // Add/Edit only ever touches the association's name — members and their
  // positions are managed elsewhere, so they're preserved as-is when saving.
  const handleSave = (data) => {
    setRows((r) => {
      const exists = r.some((x) => x.id === data.id);
      if (exists)
        return r.map((x) => (x.id === data.id ? { ...x, name: data.name } : x));
      return [...r, { ...blankForm, ...data }];
    });
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Associations"
        subtitle="Farmer associations registered in the system."
        action={
          <Button variant="accent" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Association
          </Button>
        }
      />
      <DataTable
        searchPlaceholder="Search association…"
        data={rows}
        columns={[
          {
            key: "name",
            header: "Association Name",
            sortable: true,
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.name}</div>
                <div className="text-xs text-secondary">{r.id}</div>
              </div>
            ),
          },
          {
            key: "far",
            header: "Farmers Representative",
            sortable: true,
            cell: (r) => r.far || "—",
          },
          {
            key: "membersCount",
            header: "Members",
            sortable: true,
            cell: (r) => r.members?.length ?? 0,
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
          name={confirmDelete.name}
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
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isValid = form.name.trim().length > 0;

  const submit = (e) => {
    e.preventDefault();
    if (!isValid) {
      setTouched(true);
      return;
    }
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col overflow-hidden bg-surface border border-border shadow-xl"
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

        <form onSubmit={submit} className="flex-1 px-6 py-5">
          <label className="label-eyebrow mb-1.5 block">Association Name</label>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (touched) setTouched(false);
            }}
            placeholder="e.g. Boac, Marinduque"
            className={`w-full border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground ${
              touched && !isValid ? "border-danger" : "border-border"
            }`}
          />
          {touched && !isValid && (
            <p className="mt-1 text-xs text-danger">
              Association name is required.
            </p>
          )}
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add Association" : "Save Changes"}
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
          Delete Association?
        </h3>
        <p className="text-sm text-secondary mb-6">
          Are you sure you want to delete{" "}
          <strong className="text-foreground">
            {id} — {name}
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

/* ---------------- Drawer (view) ---------------- */
function AssociationDrawer({ row, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const members = row.members ?? [];

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
              <div className="label-eyebrow mb-1">Association · {row.id}</div>
              <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                {row.name}
              </h2>
              <p className="mt-1 text-xs text-secondary">
                {members.length} member{members.length === 1 ? "" : "s"}
              </p>
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
          <Section icon={Building2} title="Association">
            <div className="flex items-center gap-3 border border-border bg-muted-40 p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center bg-accent-soft rounded-full text-accent">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 font-semibold text-foreground truncate">
                {row.name}
              </div>
            </div>
          </Section>

          <Section icon={Users2} title="Members">
            {members.length > 0 ? (
              <ul className="divide-y divide-border">
                {members.map((m, i) => (
                  <li
                    key={`${m.name}-${i}`}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center bg-accent-soft rounded-full font-display text-xs text-accent">
                        {m.name?.[0] ?? "?"}
                      </div>
                      <div className="min-w-0 font-medium text-foreground truncate">
                        {m.name}
                      </div>
                    </div>
                    <StatusPill tone={positionTone[m.position] ?? "neutral"}>
                      {m.position}
                    </StatusPill>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-secondary">
                No members recorded yet.
              </div>
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
