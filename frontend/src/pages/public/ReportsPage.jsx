import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  Calendar,
  Info,
  AlertTriangle,
  FileText,
  User,
  ImagePlus,
} from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, Select } from "@/components/ui";
import {
  REPORTS,
  typeTone,
  typeLabel,
  sevTone,
  sevLabel,
} from "@/constants/data";
import useAuth from "@/hooks/useAuth";
import { usePermissions } from "@/constants/permissions";
import {
  ReportDrawer,
  ReviewConfirmModal,
  DeleteConfirmModal,
  ReportModal,
} from "@/components/modal";
import { fmtDate } from "@/utils/format";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
];

const blankForm = {
  id: "",
  title: "",
  type: "crop",
  reportedBy: "",
  severity: "medium",
  status: "open",
  date: "",
  details: "",
  files: [],
};

// Reports are only reviewable (approve/deny) by a specific designated
// reviewer role, depending on who filed the report:
//   - reports filed by "far"  -> reviewable only by "aew"
//   - reports filed by "aew"  -> reviewable only by "coordinator", "governor", "head"
// Any other role (including the report's own role) cannot review it.
const REVIEWERS_BY_REPORT_ROLE = {
  far: "aew",
  aew: ["coordinator", "governor", "head"],
};

export function ReportsPage() {
  const { role } = useAuth();
  const canManage = usePermissions("reports"); // { view, add, edit, delete, review }

  const [rows, setRows] = useState(REPORTS);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [reviewRow, setReviewRow] = useState(null); // { row, action: "approve" | "deny" }

  // A report belongs to the current user's role if its `role` field
  // matches their own role. Own-role reports get edit/delete, gated by
  // permissions.js (far and aew have edit/delete; others don't).
  const isOwnReport = (row) => row.role === role;
  const canEditOwn = (row) => isOwnReport(row) && canManage.edit;
  const canDeleteOwn = (row) => isOwnReport(row) && canManage.delete;

  const canAdd = canManage.add;

  // Reviewing requires both the blanket "review" capability for the role
  // AND being the designated reviewer for this specific report's role.
  const canReview = (row) => {
    if (!canManage.review) return false;
    const reportRole = row.role;
    const allowedReviewers = REVIEWERS_BY_REPORT_ROLE[reportRole] ?? [];
    return allowedReviewers.includes(role);
  };

  const openAdd = () =>
    setModal({
      mode: "add",
      data: {
        ...blankForm,
        id: `RP-${String(rows.length + 1).padStart(3, "0")}`,
        date: new Date().toISOString().slice(0, 10),
        role: role,
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

  const askApprove = (row) => setReviewRow({ row, action: "approve" });
  const askDeny = (row) => setReviewRow({ row, action: "deny" });
  const confirmReview = () => {
    if (!reviewRow) return;
    const nextStatus = reviewRow.action === "approve" ? "resolved" : "open";
    setRows((r) =>
      r.map((x) =>
        x.id === reviewRow.row.id ? { ...x, status: nextStatus } : x,
      ),
    );
    setReviewRow(null);
  };

  const handleSave = (data) => {
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
        title="Reports"
        subtitle="Field reports across crops, equipment, and livestock."
        action={
          canAdd ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Report
            </Button>
          ) : null
        }
      />
      <DataTable
        searchPlaceholder="Search report…"
        data={rows}
        filters={[
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            predicate: (r, v) => r.status === v,
          },
        ]}
        columns={[
          {
            key: "title",
            header: "Title",
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
          {
            key: "reportedBy",
            header: "Reported By",
            cell: (r) => r.reportedBy || "—",
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
            key: "date",
            header: "Date",
            cell: (r) => fmtDate(r.date),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => {
              if (isOwnReport(r)) {
                return (
                  <RowActions
                    onView={() => openView(r)}
                    onEdit={canEditOwn(r) ? () => openEdit(r) : undefined}
                    onDelete={canDeleteOwn(r) ? () => askDelete(r) : undefined}
                  />
                );
              }
              if (canReview(r)) {
                return (
                  <RowActions
                    onView={() => openView(r)}
                    onApprove={() => askApprove(r)}
                    onDeny={() => askDeny(r)}
                  />
                );
              }
              // Not the owner and not the designated reviewer for this
              // report's role -> view only.
              return <RowActions onView={() => openView(r)} />;
            },
          },
        ]}
      />

      {modal && (
        <ReportModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && <ReportDrawer row={drawer} onClose={() => setDrawer(null)} />}
      {confirmDelete && (
        <DeleteConfirmModal
          id={confirmDelete.id}
          title={confirmDelete.title}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
      {reviewRow && (
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
