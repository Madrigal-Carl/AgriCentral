import { useState, useRef, useMemo, useEffect } from "react";
import { Plus, X, Search, ChevronDown, AlertTriangle } from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, SingleSelect } from "@/components/ui";
import { DeleteConfirmModal, CropModal } from "@/components/modal";

const CROP_STATUS_OPTIONS = [
  { value: "planted", label: "Planted" },
  { value: "not_planted", label: "Not Planted" },
];

const SEED_CROPS = [
  {
    id: "CR-001",
    name: "Maize",
    kilos: 1200,
    farmer: "FR-002 · Samuel Mwangi",
    status: "planted",
  },
  {
    id: "CR-002",
    name: "Rice",
    kilos: 850,
    farmer: "FR-001 · Lina Okoro",
    status: "planted",
  },
  {
    id: "CR-003",
    name: "Cassava",
    kilos: 430,
    farmer: "FR-004 · Chidi Okafor",
    status: "not_planted",
  },
];

const blankForm = {
  id: "",
  name: "",
  kilos: "",
  farmer: "",
  status: "not_planted",
};

/* ---------------- Page ---------------- */
export function CropsPage() {
  const [rows, setRows] = useState(SEED_CROPS);
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () =>
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `CR-${String(rows.length + 1).padStart(3, "0")}`,
      },
    });
  const openEdit = (row) => setModal({ mode: "edit", data: { ...row } });
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => setConfirmDelete(row);
  const confirmRemove = () => {
    if (!confirmDelete) return;
    setRows((r) => r.filter((x) => x.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  const handleSave = (data) => {
    const cleaned = {
      ...data,
      kilos: Number(data.kilos) || 0,
    };
    setRows((r) => {
      const exists = r.find((x) => x.id === data.id);
      if (exists)
        return r.map((x) => (x.id === data.id ? { ...x, ...cleaned } : x));
      return [...r, cleaned];
    });
    setModal(null);
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
      <DataTable
        searchPlaceholder="Search by crop name…"
        data={rows}
        filters={[
          {
            key: "status",
            label: "Status",
            options: CROP_STATUS_OPTIONS,
            predicate: (r, v) => r.status === v,
          },
        ]}
        columns={[
          {
            key: "name",
            header: "Crop Name",
            sortable: true,
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.name}</div>
                <div className="text-xs text-secondary">{r.id}</div>
              </div>
            ),
          },
          {
            key: "kilos",
            header: "Kilogram",
            sortable: true,
            accessor: (r) => r.kilos,
            cell: (r) => `${(r.kilos || 0).toLocaleString()} kg`,
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            cell: (r) => (
              <StatusPill tone={r.status === "planted" ? "success" : "neutral"}>
                {r.status === "planted" ? "Planted" : "Not Planted"}
              </StatusPill>
            ),
          },
          {
            key: "farmer",
            header: "Assigned Farmer",
            sortable: true,
            cell: (r) => r.farmer || "—",
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
          onSave={handleSave}
        />
      )}
      {confirmDelete && (
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
