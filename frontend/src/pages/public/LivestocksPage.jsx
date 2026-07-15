import { useState } from "react";
import { Plus, Eye, UserPlus, HeartPulse } from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, IconButton } from "@/components/ui";

import {
  healthTone,
  STATUS_OPTIONS,
  LIVESTOCK_HEALTH_OPTIONS,
  statusTone,
} from "@/constants/data";
import {
  LivestockDrawer,
  AssignModal,
  StatusUpdateModal,
  DeleteConfirmModal,
  LivestockModal,
} from "@/components/modal";
import { usePermissions } from "@/constants/permissions";
import useAuth from "@/hooks/useAuth";
import {
  useLivestocks,
  useUpdateLivestock,
  useDeleteLivestock,
} from "@/hooks/useLivestocks";
import { useFarmersByAssociationId } from "@/hooks/useFarmers";

export function LivestocksPage() {
  const can = usePermissions("livestocks");
  const { role } = useAuth();

  // Coordinators/admins are the "managers": they add, edit (tag/animal/
  // breed/gender/dob/color/weight), and delete livestock via
  // LivestockModal + plain View/Edit/Delete actions.
  // FAR can only assign livestock to a farmer and update its health —
  // no add, no delete/return.
  const isManagerRole = role === "coordinator" || role === "admin";

  const [coordModal, setCoordModal] = useState(null); // { mode: 'add' | 'edit', data } — TODO: wire to create/update API
  const [assignRow, setAssignRow] = useState(null);
  const [statusRow, setStatusRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [drawer, setDrawer] = useState(null);

  const [search, setSearch] = useState("");
  const [health, setHealth] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const queryFilters = {
    page,
    limit,
    ...(search ? { search } : {}),
    // Local state/UI copy uses "health"; the backend query schema
    // (getLivestocksQuerySchema) only recognizes "condition" — translate
    // here at the request boundary, same pattern as LivestockModal.
    ...(health ? { condition: health } : {}),
    ...(status ? { status } : {}),
  };

  const { data, isLoading, isError, error } = useLivestocks(queryFilters);
  const rows = data?.livestocks ?? [];
  const pagination = data?.pagination;

  // Farmer options for the assign modal, scoped to the livestock's own
  // association. Only fires while a row is actually being assigned.
  const { data: farmersData, isLoading: farmersLoading } =
    useFarmersByAssociationId(
      assignRow?.association?._id ?? assignRow?.association,
    );
  const farmerOptions = (farmersData?.farmers ?? []).map((f) => ({
    value: f._id,
    label: f.fullName,
  }));

  const updateMutation = useUpdateLivestock({
    onSuccess: () => {
      setAssignRow(null);
      setStatusRow(null);
    },
    onError: (err) => console.error("Failed to update livestock:", err),
  });
  const deleteMutation = useDeleteLivestock({
    onSuccess: () => setDeleteRow(null),
    onError: (err) => console.error("Failed to delete livestock:", err),
  });

  const openAdd = () => {
    if (!can.add || !isManagerRole) return;
    setCoordModal({
      mode: "add",
      data: {
        id: "",
        property_number: "",
        animal: "",
        breed: "",
        gender: "male",
        health: "healthy",
        dob: "",
        color: "",
        weight: "",
        farmer: "",
        associationId: "",
      },
    });
  };

  const openCoordEdit = (row) => {
    if (!can.edit || !isManagerRole) return;
    setCoordModal({
      mode: "edit",
      data: {
        _id: row._id,
        id: row.property_number,
        property_number: row.property_number,
        animal: row.animal,
        breed: row.breed,
        gender: row.gender,
        health: row.condition,
        dob: row.birthDate,
        color: row.color,
        weight: row.weight,
        farmer: row.assignedFarmer?._id,
        associationId: row.association?._id ?? row.association,
      },
    });
  };

  const openAssign = (row) => {
    if (!can.edit) return;
    setAssignRow(row);
  };

  const openStatus = (row) => {
    if (!can.edit) return;
    setStatusRow(row);
  };

  const openDelete = (row) => {
    if (!can.delete || !isManagerRole) return;
    setDeleteRow(row);
  };

  // FAR: assign livestock to a farmer.
  const handleAssign = (farmerId) => {
    if (!assignRow || !can.edit) return;
    updateMutation.mutate({
      id: assignRow._id,
      assignedFarmer: farmerId,
      status: "assigned",
    });
  };

  // FAR: update livestock health.
  const handleStatusUpdate = (health) => {
    if (!statusRow || !can.edit) return;
    updateMutation.mutate({ id: statusRow._id, condition: health });
  };

  const handleDelete = () => {
    if (!deleteRow || !can.delete || !isManagerRole) return;
    deleteMutation.mutate(deleteRow._id);
  };

  return (
    <div>
      <PageHeader
        title="Livestock"
        subtitle="Animal welfare and livestock inventory management."
        action={
          can.add && isManagerRole ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Livestock
            </Button>
          ) : null
        }
      />

      {isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load livestock"}
        </div>
      )}

      <DataTable
        searchPlaceholder="Search animal…"
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        data={rows}
        loading={isLoading}
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
        filters={[
          {
            key: "health",
            label: "Health",
            options: LIVESTOCK_HEALTH_OPTIONS,
            value: health,
            onChange: (v) => {
              setPage(1);
              setHealth(v);
            },
          },
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
        columns={[
          {
            key: "property_number",
            header: "Property Number",
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">
                  {r.property_number}
                </div>
                <div className="text-xs text-secondary">
                  {r.animal} · {r.breed}
                </div>
              </div>
            ),
          },
          {
            key: "farmer",
            header: "Assigned Farmer",
            accessor: (r) => r.assignedFarmer?.fullName || "",
            cell: (r) => r.assignedFarmer?.fullName || "—",
          },
          {
            key: "health",
            header: "Health",
            cell: (r) => (
              <StatusPill tone={healthTone[r.condition]}>
                {r.condition}
              </StatusPill>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => (
              <StatusPill tone={statusTone[r.status]}>{r.status}</StatusPill>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) =>
              isManagerRole ? (
                <RowActions
                  onView={() => setDrawer(r)}
                  onEdit={can.edit ? () => openCoordEdit(r) : undefined}
                  onDelete={can.delete ? () => openDelete(r) : undefined}
                />
              ) : (
                <div className="flex items-center justify-end gap-1">
                  <IconButton
                    icon={Eye}
                    label="View"
                    onClick={() => setDrawer(r)}
                  />
                  {can.edit && (
                    <IconButton
                      icon={UserPlus}
                      label="Assign"
                      onClick={() => openAssign(r)}
                    />
                  )}
                  {can.edit && (
                    <IconButton
                      icon={HeartPulse}
                      label="Update Health"
                      onClick={() => openStatus(r)}
                    />
                  )}
                </div>
              ),
          },
        ]}
      />

      {coordModal && isManagerRole && (
        <LivestockModal
          mode={coordModal.mode}
          initial={coordModal.data}
          onClose={() => setCoordModal(null)}
          onSave={() => setCoordModal(null)}
        />
      )}
      {assignRow && can.edit && !isManagerRole && (
        <AssignModal
          row={assignRow}
          options={farmerOptions}
          loading={farmersLoading}
          onClose={() => setAssignRow(null)}
          onSave={handleAssign}
        />
      )}
      {statusRow && can.edit && !isManagerRole && (
        <StatusUpdateModal
          row={statusRow}
          onClose={() => setStatusRow(null)}
          onSave={handleStatusUpdate}
          entityLabel="Livestock"
          fieldLabel="Health Status"
          statusField="condition"
          options={LIVESTOCK_HEALTH_OPTIONS}
        />
      )}
      {deleteRow && can.delete && isManagerRole && (
        <DeleteConfirmModal
          row={deleteRow}
          onCancel={() => setDeleteRow(null)}
          onConfirm={handleDelete}
        />
      )}
      {drawer && (
        <LivestockDrawer row={drawer} onClose={() => setDrawer(null)} />
      )}
    </div>
  );
}
