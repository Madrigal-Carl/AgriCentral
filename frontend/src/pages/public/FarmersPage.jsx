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
  Wheat,
  Beef,
  Tractor,
  Upload,
  FileText,
  Check,
} from "lucide-react";

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
import { Button, Select } from "@/components/ui";

import { FARMERS, statusTone, statusLabel } from "@/constants/data";
import { usePermissions } from "@/constants/permissions";
import useAuth from "@/hooks/useAuth";

/* ---------------- Reference data ---------------- */
const FARM_OPTIONS = [
  "Greenfield Farm",
  "Sunrise Acres",
  "Riverbend Estate",
  "Highland Pastures",
  "Maple Hollow",
  "Cedar Ridge",
  "Willow Creek",
  "Goldenrod Plains",
];

const LIVESTOCK_OPTIONS = [
  "LS-001 · Cow #A-204",
  "LS-002 · Goat #G-12",
  "LS-003 · Sheep #S-08",
  "LS-004 · Cow #A-117",
  "LS-005 · Pig #P-22",
  "LS-006 · Chicken #C-90",
];

const EQUIPMENT_OPTIONS = [
  "EQ-001 · Tractor T-204",
  "EQ-002 · Harvester H-12",
  "EQ-003 · Plow P-08",
  "EQ-004 · Sprayer S-31",
  "EQ-005 · Seeder SE-14",
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

const positionLabel = {
  president: "President",
  vice_president: "Vice President",
  secretary: "Secretary",
  member: "Member",
};

const blankForm = {
  id: "",
  name: "",
  contact: "",
  email: "",
  gender: "female",
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

  const [rows, setRows] = useState(FARMERS);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () => {
    if (!can.add) return;
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `FR-${String(rows.length + 1).padStart(3, "0")}`,
      },
    });
  };
  const openEdit = (row) => {
    if (!can.edit) return;
    setModal({ mode: "edit", data: { ...row } });
  };
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => {
    if (!can.delete) return;
    setConfirmDelete(row);
  };
  const confirmRemove = () => {
    if (!confirmDelete || !can.delete) return;
    setRows((r) => r.filter((x) => x.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  const diff = (next, prev) => {
    const added = next.filter((x) => !prev.includes(x));
    const removed = prev.filter((x) => !next.includes(x));
    return { added, removed };
  };

  const handleSave = (data) => {
    if (!can.add && !can.edit) return;
    setRows((r) => {
      const exists = r.find((x) => x.id === data.id);
      const today = new Date().toISOString().slice(0, 10);
      if (exists) {
        const ls = diff(data.livestock, exists.livestock);
        const eq = diff(data.equipment, exists.equipment);
        const newEvents = [
          ...ls.added.map((i) => ({
            kind: "livestock",
            action: "Received",
            item: i,
            date: today,
          })),
          ...ls.removed.map((i) => ({
            kind: "livestock",
            action: "Released",
            item: i,
            date: today,
          })),
          ...eq.added.map((i) => ({
            kind: "equipment",
            action: "Received",
            item: i,
            date: today,
          })),
          ...eq.removed.map((i) => ({
            kind: "equipment",
            action: "Returned",
            item: i,
            date: today,
          })),
        ];
        return r.map((x) =>
          x.id === data.id
            ? { ...x, ...data, history: [...(x.history || []), ...newEvents] }
            : x,
        );
      }
      const initialHistory = [
        ...data.livestock.map((i) => ({
          kind: "livestock",
          action: "Received",
          item: i,
          date: today,
        })),
        ...data.equipment.map((i) => ({
          kind: "equipment",
          action: "Received",
          item: i,
          date: today,
        })),
      ];
      return [...r, { ...data, history: initialHistory }];
    });
    setModal(null);
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
      <DataTable
        searchPlaceholder="Search farmer by name…"
        data={rows}
        filters={[
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            predicate: (r, v) => r.status === v,
          },
          {
            key: "farms",
            label: "Farms",
            allLabel: "Any Farm Count",
            options: [
              { value: "0", label: "0 farms" },
              { value: "1-2", label: "1–2 farms" },
              { value: "3+", label: "3+ farms" },
            ],
            predicate: (r, v) => {
              const n = r.farms.length;
              if (v === "0") return n === 0;
              if (v === "1-2") return n >= 1 && n <= 2;
              return n >= 3;
            },
          },
        ]}
        columns={[
          {
            key: "name",
            header: "Name",
            sortable: true,
            cell: (r) => (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center bg-accent-soft font-display text-xs text-accent rounded-full">
                  {r.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{r.name}</div>
                  <div className="text-xs text-secondary">{r.id}</div>
                </div>
              </div>
            ),
          },
          {
            key: "farms",
            header: "Farms",
            sortable: true,
            accessor: (r) => r.farms.length,
            cell: (r) => r.farms.length,
          },
          {
            key: "livestock",
            header: "Livestock",
            sortable: true,
            accessor: (r) => r.livestock.length,
            cell: (r) => r.livestock.length,
          },
          {
            key: "equipment",
            header: "Equipment",
            sortable: true,
            accessor: (r) => r.equipment.length,
            cell: (r) => r.equipment.length,
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => (
              <StatusPill tone={statusTone[r.status]}>
                {statusLabel[r.status]}
              </StatusPill>
            ),
          },
          {
            key: "position",
            header: "Position",
            sortable: true,
            cell: (r) => (
              <span className="text-sm font-medium text-foreground">
                {positionLabel[r.position] || "—"}
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
          onSave={handleSave}
        />
      )}
      {drawer && <FarmerDrawer row={drawer} onClose={() => setDrawer(null)} />}
      {confirmDelete && can.delete && (
        <DeleteConfirmModal
          id={confirmDelete.id}
          name={confirmDelete.name}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
