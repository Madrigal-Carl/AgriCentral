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
  DeleteConfirmModal,
  LivestockModal,
} from "@/components/modal";
import { usePermissions } from "@/constants/permissions";
import useAuth from "@/hooks/useAuth";

const ANIMAL_CATALOG_SEED = ANIMAL_OPTIONS.map((o) => o.value);
const BREED_CATALOG_SEED = [...new Set(LIVESTOCK_CATALOG.map((c) => c.breed))];

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

  // Coordinators/admins are the "managers": they add, edit (tag/animal/
  // breed/gender/dob/color/weight), and delete livestock via
  // LivestockModal + plain View/Edit/Delete actions.
  // FAR can only assign livestock to a farmer and update its health —
  // no add, no delete/return.
  const isManagerRole = role === "coordinator" || role === "admin";

  const [rows, setRows] = useState(LIVESTOCKS);
  const [animalCatalog, setAnimalCatalog] = useState(ANIMAL_CATALOG_SEED);
  const [breedCatalog, setBreedCatalog] = useState(BREED_CATALOG_SEED);
  const [modal, setModal] = useState(null); // { type: 'assign' | 'status', row }
  const [coordModal, setCoordModal] = useState(null); // { mode: 'add' | 'edit', data }
  const [drawer, setDrawer] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);

  const nextId = () => `LS-${String(rows.length + 1).padStart(3, "0")}`;

  const openAdd = () => {
    if (!can.add || !isManagerRole) return;
    setCoordModal({ mode: "add", data: { ...blankCoordForm, id: nextId() } });
  };
  const openCoordEdit = (row) => {
    if (!can.edit || !isManagerRole) return;
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
  const askDelete = (row) => {
    if (!can.delete || !isManagerRole) return;
    setDeleteRow(row);
  };

  const handleDelete = () => {
    if (!deleteRow || !can.delete || !isManagerRole) return;
    setRows((r) => r.filter((x) => x.id !== deleteRow.id));
    setDeleteRow(null);
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

  // FAR: assign livestock to a farmer.
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

  // FAR: update livestock health.
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
          can.add && isManagerRole ? (
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
