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
import { Button, Select, SingleSelect } from "@/components/ui";
import { UserDrawer, DeleteConfirmModal, UserModal } from "@/components/modal";

import {
  USERS,
  roleLabel,
  roleTone,
  DEFAULT_PASSWORD,
  ROLE_OPTIONS,
} from "@/constants/data";

// DEFAULT_PASSWORD a FAR account can be assigned to.
const ASSOCIATIONS = [
  "Boac, Marinduque",
  "Mogpog, Marinduque",
  "Santa Cruz, Marinduque",
  "Torrijos, Marinduque",
  "Buenavista, Marinduque",
  "Gasan, Marinduque",
];

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

/* ---------------- Approve Confirmation Modal ---------------- */
function ApproveConfirmModal({
  id,
  name,
  initialAssociation,
  onCancel,
  onConfirm,
}) {
  const [association, setAssociation] = useState(initialAssociation || "");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const handleConfirm = () => {
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
          <SingleSelect
            value={association}
            onChange={setAssociation}
            options={ASSOCIATIONS}
            placeholder="Select association"
            searchPlaceholder="Search associations..."
          />
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
