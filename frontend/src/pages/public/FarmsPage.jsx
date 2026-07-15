import { useState } from "react";
import { Plus } from "lucide-react";
import "leaflet/dist/leaflet.css";

import { PageHeader, DataTable, RowActions } from "@/components/public";
import { DeleteConfirmModal, FarmModal, FarmDrawer } from "@/components/modal";
import { Button } from "@/components/ui";

import { usePermissions } from "@/constants/permissions";
import useAuth from "@/hooks/useAuth";
import {
  useFarms,
  useCreateFarm,
  useUpdateFarm,
  useDeleteFarm,
} from "@/hooks/useFarms";
import { useCrops } from "@/hooks/useCrops";

const blankForm = {
  id: "",
  tag: "",
  address: "",
  size: "",
  latitude: "",
  longitude: "",
  assignedFarmers: [],
  association: "",
  crops: [],
};

/* ---------------- Page ---------------- */
export function FarmsPage() {
  const can = usePermissions("farms");
  const { role } = useAuth();
  const isFar = role === "far";

  const [search, setSearch] = useState("");
  const [crop, setCrop] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const filters = {
    page,
    limit,
    ...(search ? { search } : {}),
    ...(crop ? { crop } : {}),
  };

  const { data, isLoading, isError, error } = useFarms(filters);
  const rows = data?.farms ?? [];
  const pagination = data?.pagination;

  // Used to build the crop filter's dropdown options. `all: true` skips
  // pagination on the crops endpoint since we just need distinct names,
  // not a paged list — dedupe client-side in case multiple crop docs
  // share the same name.
  const { data: cropsData } = useCrops({ all: true });
  const cropOptions = Array.from(
    new Set((cropsData?.crops ?? []).map((c) => c.name)),
  ).map((name) => ({ value: name, label: name }));

  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateFarm({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateFarm({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const { mutate: deleteFarmMutate, isPending: isDeleting } = useDeleteFarm({
    onSuccess: () => {
      setConfirmDelete(null);
      setDeleteError(null);
    },
    onError: (err) => {
      setDeleteError(
        err?.response?.data?.message || err.message || "Failed to delete farm",
      );
    },
  });

  const openAdd = () => {
    if (!can.add) return;
    setSubmitError(null);
    setModal({ mode: "add", data: { ...blankForm } });
  };
  const openEdit = (row) => {
    if (!can.edit) return;
    setSubmitError(null);
    setModal({
      mode: "edit",
      data: {
        id: row._id,
        tag: row.tag,
        address: row.address,
        size: row.size,
        latitude: row.latitude,
        longitude: row.longitude,
        assignedFarmers: row.assignedFarmers || [],
        crops: row.crops || [],
        association: row.association?._id ?? row.association,
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
    deleteFarmMutate(confirmDelete._id);
  };

  const handleSave = async (values) => {
    setSubmitError(null);
    try {
      const payload = {
        tag: values.tag,
        address: values.address,
        size: Number(values.size),
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        assignedFarmers: values.assignedFarmers ?? [],
        crops: values.crops ?? [],
        // FAR users don't pick an association — omit the key entirely so
        // the backend falls back to resolving it from req.user.
        ...(!isFar && values.association
          ? { associationId: values.association }
          : {}),
      };

      if (modal.mode === "add") {
        await createMutateAsync(payload);
      } else {
        await updateMutateAsync({ id: values.id, ...payload });
      }
      setModal(null);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message || err?.message || "Failed to save farm",
      );
    }
  };

  const busy = isCreating || isUpdating;

  return (
    <div>
      <PageHeader
        title="Farms"
        subtitle="Land assets, sizes, and crop allocations."
        action={
          can.add ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Farm
            </Button>
          ) : null
        }
      />

      {isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load farms"}
        </div>
      )}

      <DataTable
        searchPlaceholder="Search by tag or address…"
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        loading={isLoading}
        data={rows}
        filters={[
          {
            key: "crop",
            label: "Crop",
            options: cropOptions,
            value: crop,
            onChange: (v) => {
              setPage(1);
              setCrop(v);
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
            key: "tag",
            header: "Farm Tag ID",
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.tag}</div>
                <div className="text-xs text-secondary">{r.address}</div>
              </div>
            ),
          },
          {
            key: "size",
            header: "Size",
            cell: (r) => (r.size != null ? `${r.size} ha` : "—"),
          },
          {
            key: "crops",
            header: "Crops",
            cell: (r) => (r.crops || []).length,
          },
          {
            key: "farmers",
            header: "Farmers",
            cell: (r) => (r.assignedFarmers || []).length,
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
        <FarmModal
          mode={modal.mode}
          initial={modal.data}
          submitError={submitError}
          busy={busy}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && <FarmDrawer row={drawer} onClose={() => setDrawer(null)} />}
      {confirmDelete && can.delete && (
        <DeleteConfirmModal
          id={confirmDelete._id}
          name={confirmDelete.tag}
          error={deleteError}
          busy={isDeleting}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
