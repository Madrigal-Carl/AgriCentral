import { useState } from "react";
import { Plus, Eye, UserPlus, RefreshCw } from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";

import {
  condTone,
  condLabel,
  statusTone,
  EQUIPMENT_CONDITION_OPTIONS,
  STATUS_OPTIONS,
} from "@/constants/data";
import { usePermissions } from "@/constants/permissions";
import { Button, IconButton } from "@/components/ui";
import useAuth from "@/hooks/useAuth";
import {
  useEquipments,
  useUpdateEquipment,
  useDeleteEquipment,
} from "@/hooks/useEquipments";
import { useFarmersByAssociationId } from "@/hooks/useFarmers";
import {
  EquipmentDrawer,
  DeleteConfirmModal,
  AssignModal,
  StatusUpdateModal,
  EquipmentModal,
} from "@/components/modal";

export function EquipmentsPage() {
  const can = usePermissions("equipments");
  const { role } = useAuth();

  // Coordinators and admins are the "managers": they add/edit/delete
  // equipment (including assigning it to a FAR and returning it) via
  // EquipmentModal. FAR can only assign equipment and update its
  // condition — no add, no delete/return.
  const isManagerRole = role === "coordinator" || role === "admin";

  const [managerModal, setManagerModal] = useState(null); // { mode: "add" | "edit", data }
  const [assignRow, setAssignRow] = useState(null);
  const [statusRow, setStatusRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [drawer, setDrawer] = useState(null);

  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const queryFilters = {
    page,
    limit,
    ...(search ? { search } : {}),
    ...(condition ? { condition } : {}),
    ...(status ? { status } : {}),
  };

  const { data, isLoading, isError, error } = useEquipments(queryFilters);
  const rows = data?.equipments ?? [];
  const pagination = data?.pagination;

  // Farmer options for the assign modal, scoped to the equipment's own
  // association. Only fires while a row is actually being assigned.
  const { data: farmersData, isLoading: farmersLoading } =
    useFarmersByAssociationId(assignRow?.association);
  const farmerOptions = (farmersData?.farmers ?? []).map((f) => ({
    value: f._id,
    label: f.fullName,
  }));

  const updateMutation = useUpdateEquipment({
    onSuccess: () => {
      setAssignRow(null);
      setStatusRow(null);
    },
    onError: (err) => console.error("Failed to update equipment:", err),
  });
  const deleteMutation = useDeleteEquipment({
    onSuccess: () => setDeleteRow(null),
    onError: (err) => console.error("Failed to delete equipment:", err),
  });

  const openAddModal = () => {
    if (!can.add || !isManagerRole) return;
    setManagerModal({
      mode: "add",
      data: {
        id: "",
        name: "",
        condition: "good",
        status: "available",
        farmer: "",
        associationId: "",
      },
    });
  };

  const openManagerEdit = (row) => {
    if (!can.edit || !isManagerRole) return;
    setManagerModal({
      mode: "edit",
      data: {
        _id: row._id,
        id: row.tag,
        name: row.name,
        condition: row.condition,
        status: row.status,
        farmer: row.assignedFarmer?._id || "",
        associationId: row.association || "",
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

  // FAR: assign equipment to a farmer.
  const handleAssign = (farmerId) => {
    if (!assignRow || !can.edit) return;
    updateMutation.mutate({
      id: assignRow._id,
      assignedFarmer: farmerId,
      status: "assigned",
    });
  };

  // FAR: update equipment condition.
  const handleStatusUpdate = (condition) => {
    if (!statusRow || !can.edit) return;
    updateMutation.mutate({ id: statusRow._id, condition });
  };

  const handleDelete = () => {
    if (!deleteRow || !can.delete || !isManagerRole) return;
    deleteMutation.mutate(deleteRow._id);
  };

  return (
    <div>
      <PageHeader
        title="Equipment"
        subtitle="Fleet & tools across all farms."
        action={
          can.add && isManagerRole ? (
            <Button variant="accent" onClick={openAddModal}>
              <Plus className="h-4 w-4" /> Add Equipment
            </Button>
          ) : null
        }
      />

      {isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load equipment"}
        </div>
      )}

      <DataTable
        searchPlaceholder="Search equipment…"
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
            key: "condition",
            label: "Condition",
            options: EQUIPMENT_CONDITION_OPTIONS,
            value: condition,
            onChange: (v) => {
              setPage(1);
              setCondition(v);
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
            key: "tag",
            header: "Equipment Tag ID",
            sortable: true,
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.name}</div>
                <div className="text-xs text-secondary">{r.tag}</div>
              </div>
            ),
          },
          {
            key: "farmer",
            header: "Assigned Farmer",
            sortable: true,
            accessor: (r) => r.assignedFarmer?.fullName || "",
            cell: (r) => r.assignedFarmer?.fullName || "—",
          },
          {
            key: "condition",
            header: "Condition",
            cell: (r) => (
              <StatusPill tone={condTone[r.condition]}>
                {condLabel[r.condition]}
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
                  onEdit={can.edit ? () => openManagerEdit(r) : undefined}
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
                      icon={RefreshCw}
                      label="Update Condition"
                      onClick={() => openStatus(r)}
                    />
                  )}
                </div>
              ),
          },
        ]}
      />

      {managerModal && isManagerRole && (
        <EquipmentModal
          mode={managerModal.mode}
          initial={managerModal.data}
          onClose={() => setManagerModal(null)}
          onSave={() => setManagerModal(null)}
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
          entityLabel="Equipment"
          fieldLabel="Condition"
          statusField="condition"
          options={EQUIPMENT_CONDITION_OPTIONS}
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
        <EquipmentDrawer row={drawer} onClose={() => setDrawer(null)} />
      )}
    </div>
  );
}
