import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, TextInput } from "@/components/ui";
import { typeLabel, typeTone, sevTone, sevLabel, SEVERITY_OPTIONS } from "@/constants/data";
import { usePermissions } from "@/constants/permissions";
import {
  DeleteConfirmModal,
  ReportDrawer,
  ReportModal,
  ReviewConfirmModal,
} from "@/components/modal";
import {
  getReviewerRole,
  getReportStatus,
  getReportItems,
  getReportSeverity,
  reportItemLabel,
  statusTone,
  statusLabel,
  REPORT_STATUS_OPTIONS,
} from "@/utils/report";
import {
  useReports,
  useUpdateReportApproval,
  useDeleteReport,
} from "@/hooks/useReports";
import useAuth from "@/hooks/useAuth";
import { fmtRequestedAt } from "@/utils/format";

const REPORT_TYPE_OPTIONS = [
  { value: "farm", label: "Crop" },
  { value: "equipment", label: "Equipment" },
  { value: "livestock", label: "Livestock" },
];

export function ReportsPage() {
  const can = usePermissions("reports");
  const { role } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [entityType, setEntityType] = useState("");
  const [date, setDate] = useState("");
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [reviewRow, setReviewRow] = useState(null); // { row, action: "approve" | "deny" }

  // Debounce search input -> search query param
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, status, entityType, date, severity]);

  const { data, isLoading } = useReports({
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    entityType: entityType || undefined,
    date: date || undefined,
    timezoneOffset: date ? new Date(`${date}T00:00:00`).getTimezoneOffset() : undefined,
    severity: severity || undefined,
  });

  const rows = data?.reports ?? [];
  const pagination = data?.pagination;

  const { mutate: submitApproval, isPending: isReviewing, error: reviewError, reset: resetReview } = useUpdateReportApproval({
    onSuccess: () => { setReviewRow(null); setDrawer(null); },
  });
  const { mutate: removeReport } = useDeleteReport({
    onSuccess: () => setConfirmDelete(null),
  });

  const openAdd = () => {
    if (!can.add) return;
    setModal({ mode: "add", data: null });
  };
  const openEdit = (row) => {
    if (!can.edit) return;
    setModal({ mode: "edit", data: row });
  };
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => {
    if (!can.delete) return;
    setConfirmDelete(row);
  };
  const confirmRemove = () => {
    if (!confirmDelete) return;
    removeReport(confirmDelete._id);
  };

  const askApprove = (row) => { resetReview(); setReviewRow({ row, action: "approve" }); };
  const askDeny = (row) => { resetReview(); setReviewRow({ row, action: "deny" }); };

  const confirmReview = (remarks) => {
    if (!reviewRow) return;

    submitApproval({
      id: reviewRow.row._id,
      status: reviewRow.action === "approve" ? "approved" : "denied",
      ...(remarks ? { remarks } : {}),
    });
  };

  // ReportModal owns its own create/update mutations internally (mirrors
  // RequestModal), so this just closes the modal once it reports success.
  const handleSave = () => {
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Field reports across crops, equipment, and livestock."
        action={
          can.add ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Report
            </Button>
          ) : null
        }
      />
      <DataTable
        loading={isLoading}
        data={rows}
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search report…"
        rightAction={
          <div className="w-full sm:w-44">
            <TextInput type="date" aria-label="Report date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        }
        filters={[
          {
            key: "status",
            label: "Status",
            options: REPORT_STATUS_OPTIONS,
            value: status,
            onChange: setStatus,
          },
          { key: "entityType", label: "Type", allLabel: "All type", options: REPORT_TYPE_OPTIONS, value: entityType, onChange: setEntityType },
          { key: "severity", label: "Severity", options: SEVERITY_OPTIONS, value: severity, onChange: setSeverity },
        ]}
        pagination={
          pagination
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                onPageChange: setPage,
              }
            : undefined
        }
        columns={[
          {
            key: "title",
            header: "Title",
            cell: (r) => (
              <div className="font-semibold text-foreground">{r.title}</div>
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: (r) => (
              <StatusPill tone={typeTone[r.entityType]}>
                {typeLabel[r.entityType] ?? r.entityType}
              </StatusPill>
            ),
          },
          {
            key: "quantity",
            header: "Items",
            cell: (r) => getReportItems(r).length,
          },
          {
            key: "condition",
            header: "Condition",
            cell: (r) => r.entityType === "farm" ? r.condition ?? "—" : (
              <ul className="space-y-1">{getReportItems(r).map((item) => <li key={item.itemId} className="flex flex-wrap items-center gap-2 text-xs">
                <span>{reportItemLabel(r.entityType, item)}</span>
                <StatusPill tone="info">{item.condition ?? "—"}</StatusPill>
                <StatusPill tone={sevTone[item.severity]}>{sevLabel[item.severity]}</StatusPill>
              </li>)}</ul>
            ),
          },
          {
            key: "severity",
            header: "Severity",
            cell: (r) => (
              <StatusPill tone={sevTone[getReportSeverity(r)]}>
                {sevLabel[getReportSeverity(r)]}
              </StatusPill>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => {
              const displayStatus = getReportStatus(r);
              return (
                <StatusPill tone={statusTone[displayStatus]}>
                  {statusLabel[displayStatus]}
                </StatusPill>
              );
            },
          },
          {
            key: "submitted",
            header: "Submitted",
            cell: (r) => fmtRequestedAt(r.createdAt),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => {
              const reviewerRole = getReviewerRole(r);
              const reportStatus = getReportStatus(r);

              const canReviewThis =
                can.review &&
                reviewerRole &&
                role === reviewerRole &&
                reportStatus === "pending";

              const canEditThis = can.edit && reportStatus === "pending";
              const canDeleteThis = can.delete && reportStatus === "pending";

              return (
                <RowActions
                  onView={() => openView(r)}
                  onEdit={canEditThis ? () => openEdit(r) : undefined}
                  onDelete={canDeleteThis ? () => askDelete(r) : undefined}
                  onApprove={canReviewThis ? () => askApprove(r) : undefined}
                  onDeny={canReviewThis ? () => askDeny(r) : undefined}
                />
              );
            },
          },
        ]}
      />

      {modal && (can.add || can.edit) && (
        <ReportModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && <ReportDrawer row={drawer} onClose={() => setDrawer(null)}
        onApprove={can.review && role === getReviewerRole(drawer) && getReportStatus(drawer) === "pending" ? () => askApprove(drawer) : undefined}
        onDeny={can.review && role === getReviewerRole(drawer) && getReportStatus(drawer) === "pending" ? () => askDeny(drawer) : undefined}
      />}
      {confirmDelete && can.delete && (
        <DeleteConfirmModal
          id={confirmDelete._id}
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
          busy={isReviewing}
          submitError={reviewError?.response?.data?.message}
        />
      )}
    </div>
  );
}
