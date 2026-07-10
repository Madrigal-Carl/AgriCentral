import { useState, useEffect } from "react";
import { Plus, X, AlertTriangle, Building2, Users2 } from "lucide-react";

import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button } from "@/components/ui";
import {
  AssociationDrawer,
  DeleteConfirmModal,
  AssociationModal,
} from "@/components/modal";

import { ASSOCIATIONS } from "@/constants/data";

const blankForm = {
  id: "",
  name: "",
  members: [], // [{ name, position }] — e.g. { name: "Juan Dela Cruz", position: "President" }
};

/* ---------------- Page ---------------- */
export function AssociationsPage() {
  const [rows, setRows] = useState(ASSOCIATIONS);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () =>
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `AS-${String(rows.length + 1).padStart(3, "0")}`,
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

  // Add/Edit only ever touches the association's name — members and their
  // positions are managed elsewhere, so they're preserved as-is when saving.
  const handleSave = (data) => {
    setRows((r) => {
      const exists = r.some((x) => x.id === data.id);
      if (exists)
        return r.map((x) => (x.id === data.id ? { ...x, name: data.name } : x));
      return [...r, { ...blankForm, ...data }];
    });
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Associations"
        subtitle="Farmer associations registered in the system."
        action={
          <Button variant="accent" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Association
          </Button>
        }
      />
      <DataTable
        searchPlaceholder="Search association…"
        data={rows}
        columns={[
          {
            key: "name",
            header: "Association Name",
            sortable: true,
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.name}</div>
                <div className="text-xs text-secondary">{r.id}</div>
              </div>
            ),
          },
          {
            key: "far",
            header: "Farmers Representative",
            sortable: true,
            cell: (r) => r.far || "—",
          },
          {
            key: "membersCount",
            header: "Members",
            sortable: true,
            cell: (r) => r.members?.length ?? 0,
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => (
              <RowActions
                onView={() => openView(r)}
                onEdit={() => openEdit(r)}
                onDelete={() => askDelete(r)}
              />
            ),
          },
        ]}
      />

      {modal && (
        <AssociationModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && (
        <AssociationDrawer row={drawer} onClose={() => setDrawer(null)} />
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
