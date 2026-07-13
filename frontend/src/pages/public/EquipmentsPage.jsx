import { useState } from "react";
import { Plus, Eye, UserPlus, RefreshCw } from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";

import {
  EQUIPMENTS,
  condTone,
  condLabel,
  statusTone,
  EQUIPMENT_CATALOG,
  EQUIPMENT_CONDITION_OPTIONS,
  STATUS_OPTIONS,
} from "@/constants/data";
import { usePermissions } from "@/constants/permissions";
import { Button, IconButton } from "@/components/ui";
import useAuth from "@/hooks/useAuth";
import {
  EquipmentDrawer,
  DeleteConfirmModal,
  AssignModal,
  StatusUpdateModal,
  EquipmentModal,
} from "@/components/modal";

const FARMERS = [
  "Lina Okoro",
  "Samuel Mwangi",
  "Aisha Bello",
  "Chidi Okafor",
  "Joseph Kamau",
  "Fatou Diop",
  "Grace Mensah",
  "Ibrahim Sow",
  "Helen Adeyemi",
  "Ravi Patel",
];

export function EquipmentsPage() {
  const can = usePermissions("equipments");
  const { role } = useAuth();

  // Coordinators and admins are the "managers": they add/edit/delete
  // equipment (including assigning it to a FAR and returning it) via
  // EquipmentModal. FAR can only assign equipment and update its
  // condition — no add, no delete/return.
  const isManagerRole = role === "coordinator" || role === "admin";

  const [rows, setRows] = useState(EQUIPMENTS);
  const [catalog, setCatalog] = useState(EQUIPMENT_CATALOG);
  const [managerModal, setManagerModal] = useState(null); // { mode: "add" | "edit", data }
  const [assignRow, setAssignRow] = useState(null);
  const [statusRow, setStatusRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [drawer, setDrawer] = useState(null);

  const nextId = () => `EQ-${String(rows.length + 1).padStart(3, "0")}`;

  const openAddModal = () => {
    if (!can.add || !isManagerRole) return;
    setManagerModal({
      mode: "add",
      data: {
        id: nextId(),
        name: "",
        condition: "excellent",
        status: "available",
        farmer: "",
      },
    });
  };

  const openManagerEdit = (row) => {
    if (!can.edit || !isManagerRole) return;
    setManagerModal({
      mode: "edit",
      data: {
        id: row.id,
        name: row.name,
        condition: row.condition,
        status: row.status,
        farmer: row.farmer || "",
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

  // Managers add/edit equipment, including assigning it to a farmer/FAR.
  // Status is derived from whether a farmer is assigned.
  const handleManagerSave = (data) => {
    if (!isManagerRole) return;
    if (data.mode === "add" ? !can.add : !can.edit) return;

    if (data.name && !catalog.includes(data.name)) {
      setCatalog((c) => [...c, data.name]);
    }

    const derivedStatus = data.farmer ? "assigned" : "available";

    setRows((r) => {
      const exists = r.some((x) => x.id === data.id);
      if (exists) {
        return r.map((x) =>
          x.id === data.id
            ? {
                ...x,
                name: data.name,
                condition: data.condition,
                status: derivedStatus,
                farmer: data.farmer,
              }
            : x,
        );
      }
      const today = new Date().toISOString().slice(0, 10);
      return [
        ...r,
        {
          id: data.id,
          name: data.name,
          condition: data.condition,
          status: derivedStatus,
          farmer: data.farmer,
          acquisitionDate: today,
          history: [{ name: data.name, date: today }],
        },
      ];
    });
    setManagerModal(null);
  };

  // FAR: assign equipment to a farmer.
  const handleAssign = (farmer) => {
    if (!assignRow || !can.edit) return;
    setRows((r) =>
      r.map((x) =>
        x.id === assignRow.id ? { ...x, farmer, status: "assigned" } : x,
      ),
    );
    setAssignRow(null);
  };

  // FAR: update equipment condition.
  const handleStatusUpdate = (condition) => {
    if (!statusRow || !can.edit) return;
    setRows((r) =>
      r.map((x) => (x.id === statusRow.id ? { ...x, condition } : x)),
    );
    setStatusRow(null);
  };

  const handleDelete = () => {
    if (!deleteRow || !can.delete || !isManagerRole) return;
    setRows((r) => r.filter((x) => x.id !== deleteRow.id));
    setDeleteRow(null);
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
      <DataTable
        searchPlaceholder="Search equipment…"
        data={rows}
        filters={[
          {
            key: "condition",
            label: "Condition",
            options: EQUIPMENT_CONDITION_OPTIONS,
            predicate: (r, v) => r.condition === v,
          },
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            predicate: (r, v) => r.status === v,
          },
        ]}
        columns={[
          {
            key: "id",
            header: "Equipment Tag ID",
            sortable: true,
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.id}</div>
                <div className="text-xs text-secondary">{r.name}</div>
              </div>
            ),
          },
          {
            key: "farmer",
            header: "Assigned Farmer",
            sortable: true,
            cell: (r) => r.farmer || "—",
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
          catalog={catalog}
          farmerOptions={FARMERS}
          onClose={() => setManagerModal(null)}
          onSave={(data) =>
            handleManagerSave({ ...data, mode: managerModal.mode })
          }
        />
      )}
      {assignRow && can.edit && !isManagerRole && (
        <AssignModal
          row={assignRow}
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
