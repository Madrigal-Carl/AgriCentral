import { useState } from "react";
import { Plus } from "lucide-react";

import { PageHeader, DataTable, RowActions } from "@/components/public";
import { Button } from "@/components/ui";
import {
  AssociationDrawer,
  DeleteConfirmModal,
  AssociationModal,
} from "@/components/modal";

import {
  useAssociations,
  useCreateAssociation,
  useUpdateAssociation,
  useDeleteAssociation,
} from "@/hooks/useAssociations";

/* ---------------- Page ---------------- */
export function AssociationsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const filters = {
    page,
    limit,
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError, error } = useAssociations(filters, {
    keepPreviousData: true,
  });

  const rows = data?.associations ?? [];
  const pagination = data?.pagination;

  const createMutation = useCreateAssociation({
    onSuccess: () => setModal(null),
  });
  const updateMutation = useUpdateAssociation({
    onSuccess: () => setModal(null),
  });
  const deleteMutation = useDeleteAssociation({
    onSuccess: () => {
      setConfirmDelete(null);
      setDeleteError(null);
    },
    onError: (err) => {
      setDeleteError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to delete association",
      );
    },
  });

  const busy = createMutation.isPending || updateMutation.isPending;

  const openAdd = () => setModal({ mode: "add" });
  const openEdit = (row) => setModal({ mode: "edit", data: { ...row } });
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => {
    setDeleteError(null);
    setConfirmDelete(row);
  };

  const confirmRemove = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete._id);
  };

  const handleSave = (values) => {
    const payload = { name: values.name };

    if (modal.mode === "edit") {
      updateMutation.mutate({ id: modal.data._id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleSearchChange = (value) => {
    setPage(1);
    setSearch(value);
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

      {isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load associations"}
        </div>
      )}

      <DataTable
        searchPlaceholder="Search association…"
        search={search}
        onSearchChange={handleSearchChange}
        loading={isLoading}
        data={rows}
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
            key: "name",
            header: "Association Name",
            sortable: true,
            cell: (r) => (
              <div className="font-semibold text-foreground">{r.name}</div>
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
          busy={busy}
          submitError={
            createMutation.error?.response?.data?.message ||
            createMutation.error?.message ||
            updateMutation.error?.response?.data?.message ||
            updateMutation.error?.message
          }
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && (
        <AssociationDrawer row={drawer} onClose={() => setDrawer(null)} />
      )}
      {confirmDelete && (
        <DeleteConfirmModal
          id={confirmDelete._id}
          name={confirmDelete.name}
          error={deleteError}
          busy={deleteMutation.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
