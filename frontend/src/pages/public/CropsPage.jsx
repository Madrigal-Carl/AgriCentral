import { useState, useMemo } from "react";
import { Plus } from "lucide-react";

import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { DeleteConfirmModal, CropModal } from "@/components/modal";
import { Button } from "@/components/ui";

import { useFarmers } from "@/hooks/useFarmers";
import { useCrops, useDeleteCrop } from "@/hooks/useCrops";

const CROP_STATUS_OPTIONS = [
  { value: "planted", label: "Planted" },
  { value: "not_planted", label: "Not Planted" },
];

const blankForm = {
  id: "",
  name: "",
  kilo: "",
  assignedFarmer: "",
  association: "",
  status: "not_planted",
};

export function CropsPage() {
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

  const { data, isLoading, isError, error } = useCrops(filters);
  const rows = data?.crops ?? [];
  const pagination = data?.pagination;

  // Fetch all farmers to resolve assignedFarmer -> display name,
  // since the crop endpoints don't populate that field.
  const { data: farmersData } = useFarmers({ all: true });
  const farmerNameById = useMemo(() => {
    const map = {};
    (farmersData?.farmers ?? []).forEach((f) => {
      map[f._id] = f.fullName;
    });
    return map;
  }, [farmersData]);

  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const { mutate: deleteCropMutate, isPending: isDeleting } = useDeleteCrop({
    onSuccess: () => {
      setConfirmDelete(null);
      setDeleteError(null);
    },
    onError: (err) => {
      setDeleteError(
        err?.response?.data?.message || err.message || "Failed to delete crop",
      );
    },
  });

  const openAdd = () => setModal({ mode: "add", data: { ...blankForm } });
  const openEdit = (row) =>
    setModal({
      mode: "edit",
      data: {
        id: row._id,
        name: row.name,
        kilo: row.kilo,
        assignedFarmer: row.assignedFarmer,
        association: row.association?._id ?? row.association ?? "",
        status: row.status,
      },
    });
  const askDelete = (row) => {
    setDeleteError(null);
    setConfirmDelete(row);
  };
  const confirmRemove = () => {
    if (!confirmDelete) return;
    deleteCropMutate(confirmDelete._id);
  };

  return (
    <div>
      <PageHeader
        title="Crops"
        subtitle="Crop batches, yield weight, and farmer assignment."
        action={
          <Button variant="accent" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Crop
          </Button>
        }
      />

      {isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load crops"}
        </div>
      )}

      <DataTable
        searchPlaceholder="Search by crop name…"
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
            options: CROP_STATUS_OPTIONS,
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
            header: "Crop Name",
            cell: (r) => (
              <div className="font-semibold text-foreground">{r.name}</div>
            ),
          },
          {
            key: "kilo",
            header: "Kilogram",
            cell: (r) => `${(r.kilo || 0).toLocaleString()} kg`,
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => (
              <StatusPill tone={r.status === "planted" ? "success" : "neutral"}>
                {r.status === "planted" ? "Planted" : "Not Planted"}
              </StatusPill>
            ),
          },
          {
            key: "assignedFarmer",
            header: "Assigned Farmer",
            cell: (r) => farmerNameById[r.assignedFarmer] || "—",
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => (
              <RowActions
                onEdit={() => openEdit(r)}
                onDelete={() => askDelete(r)}
              />
            ),
          },
        ]}
      />

      {modal && (
        <CropModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={() => setModal(null)}
        />
      )}
      {confirmDelete && (
        <DeleteConfirmModal
          id={confirmDelete._id}
          name={confirmDelete.name}
          error={deleteError}
          busy={isDeleting}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
