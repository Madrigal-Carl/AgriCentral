import { useState } from "react";
import { Plus } from "lucide-react";

import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import {
  FarmerDrawer,
  FarmerModal,
  DeleteConfirmModal,
} from "@/components/modal";
import { Button } from "@/components/ui";

import { statusTone } from "@/constants/data";
import { usePermissions } from "@/constants/permissions";
import { useFarmers, useDeleteFarmer } from "@/hooks/useFarmers";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const blankForm = {
  id: "",
  name: "",
  contact: "",
  email: "",
  gender: "",
  dob: "",
  address: "",
  association: "",
  position: "",
  farms: [],
  livestock: [],
  equipment: [],
  files: [],
};

/* ---------------- Page ---------------- */
export function FarmersPage() {
  const can = usePermissions("farmers");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const filters = {
    page,
    limit,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError, error } = useFarmers(filters);
  const rows = data?.farmers ?? [];
  const pagination = data?.pagination;

  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const { mutate: deleteFarmerMutate, isPending: isDeleting } = useDeleteFarmer(
    {
      onSuccess: () => {
        setConfirmDelete(null);
        setDeleteError(null);
      },
      onError: (err) => {
        setDeleteError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to delete farmer",
        );
      },
    },
  );

  const openAdd = () => {
    if (!can.add) return;
    setModal({ mode: "add", data: { ...blankForm } });
  };
  const openEdit = (row) => {
    if (!can.edit) return;
    setModal({
      mode: "edit",
      data: {
        id: row._id,
        name: row.fullName,
        contact: row.contactNumber,
        email: row.emailAddress,
        gender: row.gender,
        dob: row.birthDate?.slice ? row.birthDate.slice(0, 10) : row.birthDate,
        address: row.address,
        position: row.position,
        status: row.status,
        files: row.attachments || [],
        farms: row.farms || [],
        livestock: row.livestock || [],
        equipment: row.equipment || [],
      },
    });
  };
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => {
    if (!can.delete) return;
    setDeleteError(null);
    setConfirmDelete(row);
  };
  const confirmRemove = () => {
    if (!confirmDelete || !can.delete) return;
    deleteFarmerMutate(confirmDelete._id);
  };

  return (
    <div>
      <PageHeader
        title="Farmers"
        subtitle="All registered farmers and their portfolio."
        action={
          can.add ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Farmer
            </Button>
          ) : null
        }
      />

      {isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load farmers"}
        </div>
      )}

      <DataTable
        searchPlaceholder="Search farmer by name..."
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        loading={isLoading}
        data={rows}
        filters={[
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            value: status,
            onChange: (v) => {
              setPage(1);
              setStatus(v);
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
            key: "name",
            header: "Name",
            sortable: true,
            cell: (r) => (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center bg-accent-soft font-display text-xs text-accent rounded-full">
                  {r.fullName?.[0]}
                </div>
                <div className="font-semibold text-foreground">
                  {r.fullName}
                </div>
              </div>
            ),
          },
          {
            key: "farms",
            header: "Farms",
            cell: (r) => (r.farms || []).length,
          },
          {
            key: "livestock",
            header: "Livestock",
            cell: (r) => (r.livestock || []).length,
          },
          {
            key: "equipment",
            header: "Equipment",
            cell: (r) => (r.equipment || []).length,
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => (
              <StatusPill tone={statusTone[r.status]}>{r.status}</StatusPill>
            ),
          },
          {
            key: "position",
            header: "Position",
            sortable: true,
            cell: (r) => (
              <span className="text-sm font-medium text-foreground capitalize">
                {r.position || "—"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => (
              <RowActions
                onView={() => openView(r)}
                onEdit={can.edit ? () => openEdit(r) : undefined}
                onDelete={can.delete ? () => askDelete(r) : undefined}
              />
            ),
          },
        ]}
      />

      {modal && (can.add || can.edit) && (
        <FarmerModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={() => setModal(null)}
        />
      )}
      {drawer && <FarmerDrawer row={drawer} onClose={() => setDrawer(null)} />}
      {confirmDelete && can.delete && (
        <DeleteConfirmModal
          id={confirmDelete._id}
          name={confirmDelete.fullName}
          error={deleteError}
          busy={isDeleting}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
