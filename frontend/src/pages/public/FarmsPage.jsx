import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  X,
  Search,
  ChevronDown,
  Calendar,
  Activity,
  Info,
  AlertTriangle,
  Wheat,
  Users,
  MapPin,
  Scale,
  Crosshair,
  ExternalLink,
} from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, Select } from "@/components/ui";

import {
  FARMS,
  BOAC_CENTER,
  CROP_OPTIONS,
  CROP_STATUS_TONE,
  CROP_STATUS_LABEL,
} from "@/constants/data";
import { usePermissions } from "@/constants/permissions";
import { DeleteConfirmModal, FarmModal, FarmDrawer } from "@/components/modal";
import { fmtDate, fmtCoord } from "@/utils/format";

const blankForm = {
  id: "",
  address: "",
  size: "",
  location: null,
  farmers: [],
  crops: [],
  yieldKg: "",
};

/* ---------------- Page ---------------- */
export function FarmsPage() {
  const can = usePermissions("farms");

  const [rows, setRows] = useState(FARMS);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () => {
    if (!can.add) return;
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `FM-${String(rows.length + 1).padStart(3, "0")}`,
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

  const diffNames = (next, prev) => {
    const added = next.filter((x) => !prev.includes(x));
    const removed = prev.filter((x) => !next.includes(x));
    return { added, removed };
  };

  const setCropStatus = (crop, status) => {
    set(
      "crops",
      form.crops.map((c) =>
        c.crop === crop
          ? {
              ...c,
              status,
              yieldKg: status === "harvested" ? (c.yieldKg ?? "") : undefined,
            }
          : c,
      ),
    );
  };

  const setCropYield = (crop, yieldKg) => {
    set(
      "crops",
      form.crops.map((c) => (c.crop === crop ? { ...c, yieldKg } : c)),
    );
  };

  const handleSave = (data) => {
    if (!can.add && !can.edit) return;
    setRows((r) => {
      const exists = r.find((x) => x.id === data.id);
      const today = new Date().toISOString().slice(0, 10);
      const cleaned = {
        ...data,
        size: Number(data.size) || 0,
        yieldKg: Number(data.yieldKg) || 0,
        location: data.location || null,
        crops: (data.crops || []).filter((c) => c.crop),
      };

      if (exists) {
        const prevCrops = exists.crops.map((c) => c.crop);
        const nextCrops = cleaned.crops.map((c) => c.crop);
        const cd = diffNames(nextCrops, prevCrops);
        const harvestedNew = cleaned.crops.filter((c) => {
          const before = exists.crops.find((p) => p.crop === c.crop);
          return (
            c.status === "harvested" &&
            (!before || before.status !== "harvested")
          );
        });
        const newEvents = [
          ...cd.added.map((c) => ({
            action: "Received",
            item: `${c} seeds`,
            date: today,
          })),
          ...harvestedNew.map((c) => ({
            action: "Harvested",
            item: c.crop,
            date: today,
          })),
        ];
        return r.map((x) =>
          x.id === data.id
            ? {
                ...x,
                ...cleaned,
                history: [...(x.history || []), ...newEvents],
              }
            : x,
        );
      }
      const initialHistory = [
        ...cleaned.crops.map((c) => ({
          action: c.status === "harvested" ? "Harvested" : "Received",
          item: c.status === "harvested" ? c.crop : `${c.crop} seeds`,
          date: today,
        })),
      ];
      return [...r, { ...cleaned, history: initialHistory }];
    });
    setModal(null);
  };

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
      <DataTable
        searchPlaceholder="Search by address…"
        data={rows}
        filters={[
          {
            key: "crop",
            label: "Crop",
            options: CROP_OPTIONS.map((c) => ({ value: c, label: c })),
            predicate: (r, v) => r.crops.some((c) => c.crop === v),
          },
        ]}
        columns={[
          {
            key: "address",
            header: "Address",
            sortable: true,
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.address}</div>
                <div className="text-xs text-secondary">{r.id}</div>
              </div>
            ),
          },
          {
            key: "crops",
            header: "Crops",
            sortable: true,
            accessor: (r) => r.crops.length,
            cell: (r) => r.crops.length,
          },
          {
            key: "farmers",
            header: "Farmers",
            sortable: true,
            accessor: (r) => r.farmers.length,
            cell: (r) => r.farmers.length,
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
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && <FarmDrawer row={drawer} onClose={() => setDrawer(null)} />}
      {confirmDelete && can.delete && (
        <DeleteConfirmModal
          id={confirmDelete.id}
          name={confirmDelete.address}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
