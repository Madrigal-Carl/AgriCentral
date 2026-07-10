import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  X,
  Calendar,
  Info,
  AlertTriangle,
  FileText,
  Package,
  Search,
  ChevronDown,
} from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, Select } from "@/components/ui";
import {
  EQUIPMENTS,
  LIVESTOCKS,
  typeLabel,
  typeTone,
  sevTone,
  sevLabel,
  statusTone,
  REQUEST_STATUS_OPTIONS,
} from "@/constants/data";
import { usePermissions } from "@/constants/permissions";
import {
  DeleteConfirmModal,
  RequestDrawer,
  RequestModal,
  ReviewConfirmModal,
} from "@/components/modal";
import { fmtDate } from "@/utils/format";

const INITIAL = [
  {
    id: "RQ-001",
    title: "Additional tractor for north plot",
    type: "equipment",
    itemId: "EQ-001",
    itemLabel: "EQ-001 · Tractor T-204",
    quantity: 2,
    severity: "high",
    status: "pending",
    date: "2025-06-19",
    details:
      "Need additional tractor units to support expanded acreage this season.",
  },
  {
    id: "RQ-002",
    title: "More dairy cows",
    type: "livestock",
    itemId: "LS-001",
    itemLabel: "LS-001 · Cow #A-204",
    quantity: 5,
    severity: "medium",
    status: "approved",
    date: "2025-06-12",
    details: "Expanding the dairy herd to meet rising milk demand.",
  },
  {
    id: "RQ-003",
    title: "Sprayer replacement",
    type: "equipment",
    itemId: "EQ-004",
    itemLabel: "EQ-004 · Sprayer S-31",
    quantity: 1,
    severity: "critical",
    status: "fulfilled",
    date: "2025-05-28",
    details: "Existing sprayer is no longer reliable; replacement received.",
  },
];

const blankForm = {
  id: "",
  title: "",
  type: "equipment",
  itemId: "",
  itemLabel: "",
  quantity: 1,
  severity: "medium",
  status: "pending",
  date: "",
  details: "",
};

export function RequestsPage() {
  const can = usePermissions("requests");

  const [rows, setRows] = useState(INITIAL);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [reviewRow, setReviewRow] = useState(null); // { row, action: "approve" | "deny" }

  const openAdd = () => {
    if (!can.add) return;
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `RQ-${String(rows.length + 1).padStart(3, "0")}`,
        date: new Date().toISOString().slice(0, 10),
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

  const askApprove = (row) => {
    if (!can.review) return;
    setReviewRow({ row, action: "approve" });
  };
  const askDeny = (row) => {
    if (!can.review) return;
    setReviewRow({ row, action: "deny" });
  };
  const confirmReview = () => {
    if (!reviewRow || !can.review) return;
    const nextStatus = reviewRow.action === "approve" ? "approved" : "rejected";
    setRows((r) =>
      r.map((x) =>
        x.id === reviewRow.row.id ? { ...x, status: nextStatus } : x,
      ),
    );
    setReviewRow(null);
  };

  const handleSave = (data) => {
    if (!can.add && !can.edit) return;
    setRows((r) => {
      const exists = r.some((x) => x.id === data.id);
      if (exists)
        return r.map((x) => (x.id === data.id ? { ...x, ...data } : x));
      return [...r, { ...data }];
    });
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Requests"
        subtitle="Resource requests across equipment and livestock."
        action={
          can.add ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Request
            </Button>
          ) : null
        }
      />
      <DataTable
        searchPlaceholder="Search request…"
        data={rows}
        filters={[
          {
            key: "status",
            label: "Status",
            options: REQUEST_STATUS_OPTIONS,
            predicate: (r, v) => r.status === v,
          },
        ]}
        columns={[
          {
            key: "title",
            header: "Title",
            sortable: true,
            cell: (r) => (
              <div>
                <div className="font-semibold text-foreground">{r.title}</div>
                <div className="text-xs text-secondary">{r.id}</div>
              </div>
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: (r) => (
              <StatusPill tone={typeTone[r.type]}>
                {typeLabel[r.type]}
              </StatusPill>
            ),
          },
          { key: "item", header: "Item", cell: (r) => r.itemLabel || "—" },
          {
            key: "quantity",
            header: "Qty",
            sortable: true,
            cell: (r) => r.quantity,
          },
          {
            key: "severity",
            header: "Severity",
            cell: (r) => (
              <StatusPill tone={sevTone[r.severity]}>
                {sevLabel[r.severity]}
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
            key: "date",
            header: "Date",
            sortable: true,
            cell: (r) => fmtDate(r.date),
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
                onApprove={can.review ? () => askApprove(r) : undefined}
                onDeny={can.review ? () => askDeny(r) : undefined}
              />
            ),
          },
        ]}
      />

      {modal && (can.add || can.edit) && (
        <RequestModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && <RequestDrawer row={drawer} onClose={() => setDrawer(null)} />}
      {confirmDelete && can.delete && (
        <DeleteConfirmModal
          id={confirmDelete.id}
          title={confirmDelete.title}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
      {reviewRow && can.review && (
        <ReviewConfirmModal
          row={reviewRow.row}
          action={reviewRow.action}
          onCancel={() => setReviewRow(null)}
          onConfirm={confirmReview}
        />
      )}
    </div>
  );
}
