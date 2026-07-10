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
  HeartPulse,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, IconButton, Select } from "@/components/ui";

import {
  LIVESTOCKS,
  healthTone,
  STATUS_OPTIONS,
  LIVESTOCK_HEALTH_OPTIONS,
  LIVESTOCK_CATALOG,
  statusTone,
  ANIMAL_OPTIONS,
} from "@/constants/data";
import {
  LivestockDrawer,
  AssignModal,
  StatusUpdateModal,
  ReturnConfirmModal,
  DeleteConfirmModal,
  ManagerLivestockModal,
  LivestockModal,
} from "@/components/modal";
import { usePermissions } from "@/constants/permissions";
import useAuth from "@/hooks/useAuth";

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

const ANIMAL_CATALOG_SEED = ANIMAL_OPTIONS.map((o) => o.value);
const BREED_CATALOG_SEED = [...new Set(LIVESTOCK_CATALOG.map((c) => c.breed))];

const blankForm = {
  catalogId: "",
  health: "healthy",
  acquisitionDate: "",
};

const blankCoordForm = {
  id: "",
  tag: "",
  animal: "",
  breed: "",
  gender: "male",
  dob: "",
  color: "",
  weight: "",
};

export function LivestocksPage() {
  const can = usePermissions("livestocks");
  const { role } = useAuth();

  // Coordinators manage livestock directly (tag/animal/breed/gender/dob/
  // color/weight) via a dedicated add/edit modal and plain View/Edit/Delete
  // actions. FAR keeps the assign/update-status/return workflow.
  const isManagerRole = role === "coordinator" || role === "admin";

  const [rows, setRows] = useState(LIVESTOCKS);
  const [animalCatalog, setAnimalCatalog] = useState(ANIMAL_CATALOG_SEED);
  const [breedCatalog, setBreedCatalog] = useState(BREED_CATALOG_SEED);
  const [modal, setModal] = useState(null); // { type: 'add' | 'assign' | 'status' , row }
  const [coordModal, setCoordModal] = useState(null); // { mode: 'add' | 'edit', data }
  const [drawer, setDrawer] = useState(null);
  const [confirmReturn, setConfirmReturn] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);

  const nextId = () => `LS-${String(rows.length + 1).padStart(3, "0")}`;

  const openAdd = () => {
    if (!can.add) return;
    if (isManagerRole) {
      setCoordModal({ mode: "add", data: { ...blankCoordForm, id: nextId() } });
      return;
    }
    setModal({ type: "add", data: { ...blankForm } });
  };
  const openCoordEdit = (row) => {
    if (!can.edit) return;
    setCoordModal({
      mode: "edit",
      data: {
        id: row.id,
        tag: row.tag || "",
        animal: row.animal || "",
        breed: row.breed || "",
        gender: row.gender || "male",
        dob: row.dob || "",
        color: row.color || "",
        weight: row.weight ?? "",
      },
    });
  };
  const openAssign = (row) => {
    if (!can.edit) return;
    setModal({ type: "assign", row });
  };
  const openStatus = (row) => {
    if (!can.edit) return;
    setModal({ type: "status", row });
  };
  const openView = (row) => setDrawer(row);
  const askReturn = (row) => {
    if (!can.delete) return;
    setConfirmReturn(row);
  };
  const askDelete = (row) => {
    if (!can.delete) return;
    setDeleteRow(row);
  };

  const confirmReturnAction = () => {
    if (!confirmReturn || !can.delete) return;
    const today = new Date().toISOString().slice(0, 10);
    setRows((r) =>
      r.map((x) =>
        x.id === confirmReturn.id
          ? {
              ...x,
              farmer: "",
              status: "active",
              history: [
                ...(x.history || []),
                { farmer: "Returned to cooperative", date: today },
              ],
            }
          : x,
      ),
    );
    setConfirmReturn(null);
  };

  const handleDelete = () => {
    if (!deleteRow || !can.delete) return;
    setRows((r) => r.filter((x) => x.id !== deleteRow.id));
    setDeleteRow(null);
  };

  const handleAdd = (data) => {
    if (!can.add) return;
    const catalog = LIVESTOCK_CATALOG.find((c) => c.id === data.catalogId);
    if (!catalog) return;
    const newId = nextId();
    setRows((r) => [
      ...r,
      {
        id: newId,
        tag: `${catalog.animal} #${newId}`,
        animal: catalog.animal,
        breed: catalog.breed,
        gender: catalog.gender,
        dob: "",
        color: "",
        weight: 0,
        farmer: "",
        health: data.health,
        status: "active",
        acquisitionDate: data.acquisitionDate,
        history: [],
      },
    ]);
    setModal(null);
  };

  const handleCoordSave = (data) => {
    if (coordModal?.mode === "add" && !can.add) return;
    if (coordModal?.mode === "edit" && !can.edit) return;
    if (data.animal && !animalCatalog.includes(data.animal)) {
      setAnimalCatalog((c) => [...c, data.animal]);
    }
    if (data.breed && !breedCatalog.includes(data.breed)) {
      setBreedCatalog((c) => [...c, data.breed]);
    }
    const weightNum = data.weight === "" ? 0 : parseFloat(data.weight);

    setRows((r) => {
      const exists = r.some((x) => x.id === data.id);
      if (exists) {
        return r.map((x) =>
          x.id === data.id
            ? {
                ...x,
                tag: data.tag,
                animal: data.animal,
                breed: data.breed,
                gender: data.gender,
                dob: data.dob,
                color: data.color,
                weight: weightNum,
              }
            : x,
        );
      }
      const today = new Date().toISOString().slice(0, 10);
      return [
        ...r,
        {
          id: data.id,
          tag: data.tag,
          animal: data.animal,
          breed: data.breed,
          gender: data.gender,
          dob: data.dob,
          color: data.color,
          weight: weightNum,
          farmer: "",
          health: "healthy",
          status: "active",
          acquisitionDate: today,
          history: [],
        },
      ];
    });
    setCoordModal(null);
  };

  const handleAssign = (farmer) => {
    if (!modal?.row || !can.edit) return;
    const today = new Date().toISOString().slice(0, 10);
    setRows((r) =>
      r.map((x) =>
        x.id === modal.row.id
          ? {
              ...x,
              farmer,
              history: [...(x.history || []), { farmer, date: today }],
            }
          : x,
      ),
    );
    setModal(null);
  };

  const handleStatus = (health) => {
    if (!modal?.row || !can.edit) return;
    setRows((r) =>
      r.map((x) => (x.id === modal.row.id ? { ...x, health } : x)),
    );
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Livestock"
        subtitle="Animal welfare and livestock inventory management."
        action={
          can.add ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Livestock
            </Button>
          ) : null
        }
      />
      <DataTable
        searchPlaceholder="Search animal…"
        data={rows}
        filters={[
          {
            key: "health",
            label: "Health",
            options: LIVESTOCK_HEALTH_OPTIONS,
            predicate: (r, v) => r.health === v,
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
            header: "Livestock Tag ID",
            sortable: true,
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.id}</div>
                <div className="text-xs text-secondary">
                  {r.animal} · {r.breed}
                </div>
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
            key: "health",
            header: "Health",
            cell: (r) => (
              <StatusPill tone={healthTone[r.health]}>{r.health}</StatusPill>
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
                  onView={() => openView(r)}
                  onEdit={can.edit ? () => openCoordEdit(r) : undefined}
                  onDelete={can.delete ? () => askDelete(r) : undefined}
                />
              ) : (
                <div className="flex items-center justify-end gap-1">
                  <IconButton
                    icon={Eye}
                    label="View"
                    onClick={() => openView(r)}
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
                      label="Update Status"
                      onClick={() => openStatus(r)}
                    />
                  )}
                  {can.delete && (
                    <IconButton
                      icon={RotateCcw}
                      label="Return"
                      tone="danger"
                      onClick={() => askReturn(r)}
                    />
                  )}
                </div>
              ),
          },
        ]}
      />

      {modal?.type === "add" && can.add && !isManagerRole && (
        <LivestockModal
          initial={modal.data}
          existingIds={rows.map((r) => r.id)}
          onClose={() => setModal(null)}
          onSave={handleAdd}
        />
      )}
      {coordModal && (
        <ManagerLivestockModal
          mode={coordModal.mode}
          initial={coordModal.data}
          animalCatalog={animalCatalog}
          breedCatalog={breedCatalog}
          onClose={() => setCoordModal(null)}
          onSave={handleCoordSave}
        />
      )}
      {modal?.type === "assign" && can.edit && !isManagerRole && (
        <AssignModal
          row={modal.row}
          onClose={() => setModal(null)}
          onSave={handleAssign}
        />
      )}
      {modal?.type === "status" && can.edit && !isManagerRole && (
        <StatusUpdateModal
          row={modal.row}
          onClose={() => setModal(null)}
          onSave={handleStatus}
          entityLabel="Livestock"
          fieldLabel="Health Status"
          statusField="health"
          options={LIVESTOCK_HEALTH_OPTIONS}
        />
      )}
      {drawer && (
        <LivestockDrawer row={drawer} onClose={() => setDrawer(null)} />
      )}
      {confirmReturn && can.delete && !isManagerRole && (
        <ReturnConfirmModal
          row={confirmReturn}
          onCancel={() => setConfirmReturn(null)}
          onConfirm={confirmReturnAction}
        />
      )}
      {deleteRow && can.delete && isManagerRole && (
        <DeleteConfirmModal
          row={deleteRow}
          onCancel={() => setDeleteRow(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
