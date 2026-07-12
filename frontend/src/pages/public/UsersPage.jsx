import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";

import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, SingleSelect } from "@/components/ui";
import { UserDrawer, DeleteConfirmModal, UserModal } from "@/components/modal";

import {
  roleLabel,
  roleTone,
  DEFAULT_PASSWORD,
  ROLE_OPTIONS,
} from "@/constants/data";

import { useUsers, useDeleteUser, useUpdateUser } from "@/hooks/useUsers";
import { useAssociations } from "@/hooks/useAssociations";

const blankForm = {
  fullname: "",
  email: "",
  role: "far",
  password: DEFAULT_PASSWORD,
  isVerified: true,
};

/* ---------------- Page ---------------- */
export function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeny, setConfirmDeny] = useState(null);
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [approveError, setApproveError] = useState(null);

  const filters = {
    page,
    limit,
    ...(role ? { role } : {}),
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError, error } = useUsers(filters, {
    keepPreviousData: true,
  });

  const rows = data?.users ?? [];
  const pagination = data?.pagination;

  // Association picker for the Approve modal. NOTE: this now needs to
  // exclude associations already claimed by another far user, same as the
  // add/edit form does — otherwise an admin could approve two users into
  // the same association. Swap this for useAvailableAssociations if you
  // want that guarantee here too; left as `useAssociations({ all: true })`
  // for now to match prior behavior, but flagging it.
  const { data: associationsData, isLoading: associationsLoading } =
    useAssociations({ all: true });
  const associationOptions = (associationsData?.associations ?? []).map(
    (a) => ({
      value: a._id,
      label: a.name,
    }),
  );

  const deleteMutation = useDeleteUser({
    onSuccess: () => {
      setConfirmDelete(null);
      setDeleteError(null);
    },
    onError: (err) => {
      setDeleteError(
        err?.response?.data?.message || err.message || "Failed to delete user",
      );
    },
  });
  const denyMutation = useDeleteUser({
    onSuccess: () => setConfirmDeny(null),
  });
  const approveMutation = useUpdateUser();

  const openAdd = () => setModal({ mode: "add", data: { ...blankForm } });
  const openEdit = (row) =>
    setModal({
      mode: "edit",
      data: {
        _id: row._id,
        fullname: row.fullname,
        email: row.email,
        role: row.role,
        isVerified: row.isVerified,
        association: row.association,
      },
    });
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => {
    setDeleteError(null);
    setConfirmDelete(row);
  };
  const confirmRemove = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete._id);
  };

  const askDeny = (row) => setConfirmDeny(row);
  const confirmDenyAction = () => {
    if (!confirmDeny) return;
    denyMutation.mutate(confirmDeny._id);
  };

  const askApprove = (row) => {
    setApproveError(null);
    setConfirmApprove(row);
  };
  const confirmApproveAction = async (associationId) => {
    if (!confirmApprove || !associationId) return;
    setApproveError(null);
    try {
      await approveMutation.mutateAsync({
        id: confirmApprove._id,
        isVerified: true,
        association: associationId,
      });
      setConfirmApprove(null);
    } catch (err) {
      setApproveError(
        err?.response?.data?.message || err.message || "Failed to approve user",
      );
    }
  };

  const handleSearchChange = (value) => {
    setPage(1);
    setSearch(value);
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

      {isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load users"}
        </div>
      )}

      <DataTable
        searchPlaceholder="Search user by name…"
        search={search}
        onSearchChange={handleSearchChange}
        loading={isLoading}
        data={rows}
        filters={[
          {
            key: "role",
            label: "Role",
            options: ROLE_OPTIONS,
            value: role,
            onChange: (v) => {
              setPage(1);
              setRole(v);
            },
          },
        ]}
        pagination={
          pagination
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                onPageChange: setPage,
              }
            : undefined
        }
        columns={[
          {
            key: "fullname",
            header: "Name",
            sortable: true,
            cell: (r) => (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center bg-accent-soft font-display text-xs text-accent rounded-full">
                  {r.fullname?.[0] ?? "?"}
                </div>
                <div className="font-semibold text-foreground">
                  {r.fullname || "—"}
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
          onSave={() => setModal(null)}
        />
      )}
      {drawer && <UserDrawer row={drawer} onClose={() => setDrawer(null)} />}
      {confirmDelete && (
        <DeleteConfirmModal
          id={confirmDelete._id}
          name={confirmDelete.fullname}
          error={deleteError}
          busy={deleteMutation.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
      {confirmApprove && (
        <ApproveConfirmModal
          id={confirmApprove._id}
          name={confirmApprove.fullname}
          associationOptions={associationOptions}
          associationsLoading={associationsLoading}
          error={approveError}
          busy={approveMutation.isPending}
          onCancel={() => setConfirmApprove(null)}
          onConfirm={confirmApproveAction}
        />
      )}
      {confirmDeny && (
        <DenyConfirmModal
          id={confirmDeny._id}
          name={confirmDeny.fullname}
          busy={denyMutation.isPending}
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
  associationOptions,
  associationsLoading,
  error,
  busy,
  onCancel,
  onConfirm,
}) {
  const [associationId, setAssociationId] = useState("");

  const handleConfirm = () => {
    if (!associationId) return;
    onConfirm(associationId);
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
          <strong className="text-foreground">{name}</strong>. Since this
          account self-registered, assign the association it belongs to before
          approving.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-left text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-6 text-left">
          <label className="label-eyebrow mb-1.5 block">Association</label>
          <SingleSelect
            value={associationId}
            onChange={setAssociationId}
            options={associationOptions}
            placeholder={
              associationsLoading
                ? "Loading associations…"
                : "Select association"
            }
            searchPlaceholder="Search associations…"
          />
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={handleConfirm}
            disabled={busy || !associationId}
          >
            {busy ? "Approving…" : "Approve"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Deny Confirmation Modal ---------------- */
function DenyConfirmModal({ id, name, busy, onCancel, onConfirm }) {
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
          <strong className="text-foreground">{name}</strong>. They will need to
          register again to request access.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Denying…" : "Deny"}
          </Button>
        </div>
      </div>
    </div>
  );
}
