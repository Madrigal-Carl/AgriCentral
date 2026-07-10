import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  X,
  Search,
  ChevronDown,
  User,
  Calendar,
  Activity,
  Info,
  AlertTriangle,
  Eye,
  UserPlus,
  RefreshCw,
  Undo2,
  Trash2,
} from "lucide-react";
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
  EquipmentModal,
  ReturnConfirmModal,
  AssignModal,
  StatusUpdateModal,
  ManagerEquipmentModal,
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

  // Coordinators and admins manage equipment directly (id/name/condition/status)
  // via a simpler add/edit modal and plain View/Edit/Delete actions. FAR keeps the
  // assign/update-status/return workflow.
  const isManagerRole = role === "coordinator" || role === "admin";

  const [rows, setRows] = useState(EQUIPMENTS);
  const [catalog, setCatalog] = useState(EQUIPMENT_CATALOG);
  const [addModal, setAddModal] = useState(false);
  const [managerModal, setManagerModal] = useState(null); // { mode: "add" | "edit", data }
  const [assignRow, setAssignRow] = useState(null);
  const [statusRow, setStatusRow] = useState(null);
  const [returnRow, setReturnRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [drawer, setDrawer] = useState(null);

  const nextId = () => `EQ-${String(rows.length + 1).padStart(3, "0")}`;

  const openAddModal = () => {
    if (!can.add) return;
    if (isManagerRole) {
      setManagerModal({
        mode: "add",
        data: {
          id: nextId(),
          name: "",
          condition: "excellent",
          status: "available",
        },
      });
      return;
    }
    setAddModal(true);
  };
  const openCoordEdit = (row) => {
    if (!can.edit) return;
    setManagerModal({
      mode: "edit",
      data: {
        id: row.id,
        name: row.name,
        condition: row.condition,
        status: row.status,
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
  const openReturn = (row) => {
    if (!can.delete) return;
    setReturnRow(row);
  };
  const openDelete = (row) => {
    if (!can.delete) return;
    setDeleteRow(row);
  };

  const handleAdd = (data) => {
    if (!can.add) return;
    if (data.name && !catalog.includes(data.name)) {
      setCatalog((c) => [...c, data.name]);
    }
    setRows((r) => [
      ...r,
      {
        id: nextId(),
        name: data.name,
        condition: "excellent",
        status: data.status,
        farmer: "",
        acquisitionDate: data.acquisitionDate,
        history: [
          {
            name: data.name,
            date: data.acquisitionDate || new Date().toISOString().slice(0, 10),
          },
        ],
      },
    ]);
    setAddModal(false);
  };

  const handleCoordSave = (data) => {
    if (managerModal?.mode === "add" && !can.add) return;
    if (managerModal?.mode === "edit" && !can.edit) return;
    if (data.name && !catalog.includes(data.name)) {
      setCatalog((c) => [...c, data.name]);
    }
    setRows((r) => {
      const exists = r.some((x) => x.id === data.id);
      if (exists) {
        return r.map((x) =>
          x.id === data.id
            ? {
                ...x,
                name: data.name,
                condition: data.condition,
                status: data.status,
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
          status: data.status,
          farmer: "",
          acquisitionDate: today,
          history: [{ name: data.name, date: today }],
        },
      ];
    });
    setManagerModal(null);
  };

  const handleAssign = (farmer) => {
    if (!assignRow || !can.edit) return;
    setRows((r) =>
      r.map((x) =>
        x.id === assignRow.id ? { ...x, farmer, status: "assigned" } : x,
      ),
    );
    setAssignRow(null);
  };

  const handleStatusUpdate = (condition) => {
    if (!statusRow || !can.edit) return;
    setRows((r) =>
      r.map((x) => (x.id === statusRow.id ? { ...x, condition } : x)),
    );
    setStatusRow(null);
  };

  const handleReturn = () => {
    if (!returnRow || !can.delete) return;
    setRows((r) =>
      r.map((x) =>
        x.id === returnRow.id ? { ...x, farmer: "", status: "available" } : x,
      ),
    );
    setReturnRow(null);
  };

  const handleDelete = () => {
    if (!deleteRow || !can.delete) return;
    setRows((r) => r.filter((x) => x.id !== deleteRow.id));
    setDeleteRow(null);
  };

  return (
    <div>
      <PageHeader
        title="Equipment"
        subtitle="Fleet & tools across all farms."
        action={
          can.add ? (
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
                      icon={RefreshCw}
                      label="Update Status"
                      onClick={() => openStatus(r)}
                    />
                  )}
                  {can.delete && (
                    <IconButton
                      icon={Undo2}
                      label="Return"
                      tone="danger"
                      onClick={() => openReturn(r)}
                    />
                  )}
                </div>
              ),
          },
        ]}
      />

      {addModal && can.add && !isManagerRole && (
        <EquipmentModal
          nextId={nextId()}
          catalog={catalog}
          onClose={() => setAddModal(false)}
          onSave={handleAdd}
        />
      )}
      {managerModal && (
        <ManagerEquipmentModal
          mode={managerModal.mode}
          initial={managerModal.data}
          catalog={catalog}
          onClose={() => setManagerModal(null)}
          onSave={handleCoordSave}
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
      {returnRow && can.delete && !isManagerRole && (
        <ReturnConfirmModal
          row={returnRow}
          onCancel={() => setReturnRow(null)}
          onConfirm={handleReturn}
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
