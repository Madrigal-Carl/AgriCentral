import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button } from "@/components/ui";
import { typeLabel, typeTone, sevTone, sevLabel } from "@/constants/data";
import { usePermissions } from "@/constants/permissions";
import {
  DeleteConfirmModal,
  RequestDrawer,
  RequestModal,
  ReviewConfirmModal,
} from "@/components/modal";
import {
  getCurrentStage,
  getDisplayStatus,
  isFullyApproved,
  statusTone,
  statusLabel,
  releaseStatusTone,
  releaseStatusLabel,
  REQUEST_STATUS_OPTIONS,
} from "@/utils/request";
import {
  useUpdateRequestApproval,
  useReleaseRequest,
  useDeleteRequest,
  useRequests,
} from "@/hooks/useRequests";
import useAuth from "@/hooks/useAuth";

export function RequestsPage() {
  const can = usePermissions("requests");
  const { role } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [reviewRow, setReviewRow] = useState(null); // { row, action: "approve" | "deny" | "release" }

  // Debounce search input -> search query param
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const { data, isLoading } = useRequests({
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
  });

  const rows = data?.requests ?? [];
  const pagination = data?.pagination;

  const { mutate: submitApproval } = useUpdateRequestApproval({
    onSuccess: () => setReviewRow(null),
  });
  const { mutate: submitRelease, isPending: isReleasing } = useReleaseRequest({
    onSuccess: () => setReviewRow(null),
  });
  const { mutate: removeRequest } = useDeleteRequest({
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
    removeRequest(confirmDelete._id);
  };

  const askApprove = (row) => setReviewRow({ row, action: "approve" });
  const askDeny = (row) => setReviewRow({ row, action: "deny" });
  const askRelease = (row) => setReviewRow({ row, action: "release" });

  const confirmReview = (remarks) => {
    if (!reviewRow) return;

    if (reviewRow.action === "release") {
      submitRelease(reviewRow.row._id);
      return;
    }

    submitApproval({
      id: reviewRow.row._id,
      status: reviewRow.action === "approve" ? "approved" : "denied",
      ...(remarks ? { remarks } : {}),
    });
  };

  // RequestModal owns its own create/update mutations internally (mirrors
  // FarmerModal), so this just closes the modal once it reports success.
  const handleSave = () => {
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
        loading={isLoading}
        data={rows}
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search request…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: REQUEST_STATUS_OPTIONS,
            value: status,
            onChange: setStatus,
          },
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
                {typeLabel[r.entityType]}
              </StatusPill>
            ),
          },
          {
            key: "quantity",
            header: "Quantity",
            cell: (r) => r.entities?.length ?? r.entityIds?.length ?? 0,
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
            cell: (r) => {
              const displayStatus = getDisplayStatus(r);
              return (
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusPill tone={statusTone[displayStatus]}>
                    {statusLabel[displayStatus]}
                  </StatusPill>
                  {displayStatus === "approved" && (
                    <StatusPill tone={releaseStatusTone[r.releaseStatus]}>
                      {releaseStatusLabel[r.releaseStatus]}
                    </StatusPill>
                  )}
                </div>
              );
            },
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => {
              const currentStage = getCurrentStage(r);
              const canReviewThis =
                can.review && currentStage && role === currentStage;
              const coordinatorReviewed =
                r.approvalStatus?.coordinator?.status === "approved" ||
                r.approvalStatus?.coordinator?.status === "denied";
              const canEditThis = can.edit && !coordinatorReviewed;
              const canDeleteThis = can.delete && !coordinatorReviewed;

              const canReleaseThis =
                role === "coordinator" &&
                isFullyApproved(r) &&
                r.releaseStatus === "pending";

              return (
                <RowActions
                  onView={() => openView(r)}
                  onEdit={canEditThis ? () => openEdit(r) : undefined}
                  onDelete={canDeleteThis ? () => askDelete(r) : undefined}
                  onApprove={canReviewThis ? () => askApprove(r) : undefined}
                  onDeny={canReviewThis ? () => askDeny(r) : undefined}
                  onRelease={
                    canReleaseThis && !isReleasing
                      ? () => askRelease(r)
                      : undefined
                  }
                />
              );
            },
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
          id={confirmDelete._id}
          title={confirmDelete.title}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
      {reviewRow &&
        (reviewRow.action === "release"
          ? role === "coordinator"
          : can.review) && (
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
