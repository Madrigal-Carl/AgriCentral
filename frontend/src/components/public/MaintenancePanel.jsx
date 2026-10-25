import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader, DataTable, RowActions } from "@/components/public";
import { Button } from "@/components/ui";
import { MaintenanceModal } from "@/components/modal/MaintenanceModal";
import { DeleteConfirmModal } from "@/components/modal/DeleteConfirmModal";
import { useMaintenanceUsage } from "@/hooks/useMaintenance";
import { useLookups, lookupOptions } from "@/hooks/useLookups";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function MaintenancePanel({ config, aside }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [parent, setParent] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [modal, setModal] = useState(null);
  const [archive, setArchive] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [actionError, setActionError] = useState(null);
  const { data, isLoading, isError, error } = config.useList(config.type, { page, limit: 10, search, includeArchived, ...(parent ? { [config.parent]: parent } : {}) });
  const lookups = useLookups();
  const usage = useMaintenanceUsage(config.type, archive?._id);
  const mutation = config.useMutation(config.type, {
    onSuccess: (result) => { setArchive(null); setActionError(null); setFeedback(result.message); },
    onError: (err) => setActionError(getErrorMessage(err)),
  });
  return <div className="min-w-0">
    <PageHeader title="Maintenance" subtitle="Manage reference data used throughout the system." action={<Button variant="accent" onClick={() => setModal({ initial: null })}><Plus className="h-4 w-4" />Add {config.label}</Button>} />
    {feedback && <div role="status" className="mb-4 bg-accent-soft px-3 py-2 text-sm text-foreground">{feedback}</div>}
    {(isError || actionError || lookups.isError) && <div role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{actionError || getErrorMessage(error || lookups.error)}</div>}
    <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[208px_minmax(0,1fr)]">
      {aside}
      <section id="maintenance-table-panel" aria-label={`${config.label} reference data`} className="min-w-0">
    <DataTable search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} searchPlaceholder={`Search ${config.label.toLowerCase()}…`} loading={isLoading} data={data?.items ?? []}
      pagination={data?.pagination ? { ...data.pagination, onPageChange: setPage } : undefined}
      filters={config.parent ? [{ key: config.parent, label: config.parentLabel, value: parent, options: lookupOptions(lookups.data?.[config.parentType]), onChange: (value) => { setParent(value); setPage(1); } }] : []}
      rightAction={<label className="flex items-center gap-2 text-sm text-secondary"><input type="checkbox" checked={includeArchived} onChange={(event) => { setIncludeArchived(event.target.checked); setPage(1); }} />Show archived</label>}
      columns={[
        ...config.columns.map((column) => ({ ...column, cell: (row) => column.accessor ? column.accessor(row) : row[column.key] })),
        { key: "actions", header: "", align: "right", cell: (row) => <RowActions onEdit={!row.deletedAt ? () => setModal({ initial: row }) : undefined} onDelete={!row.deletedAt ? () => { setActionError(null); setArchive(row); } : undefined} onRestore={row.deletedAt ? () => mutation.mutate({ action: "restore", id: row._id }) : undefined} /> },
      ]} />
      </section>
    </div>
    {modal && <MaintenanceModal config={config} initial={modal.initial} onClose={() => setModal(null)} onSave={() => { setModal(null); setFeedback("Item saved successfully"); }} />}
    {archive && <DeleteConfirmModal name={archive.name} error={actionError || (usage.isError ? getErrorMessage(usage.error) : null)} busy={mutation.isPending || usage.isPending || usage.isError} onCancel={() => setArchive(null)} onConfirm={() => mutation.mutate({ action: "archive", id: archive._id })} description={usage.data ? `${usage.data.total} record(s) currently use this item. Existing records keep their names. You can restore it later. Municipalities and animals with active children cannot be archived.` : "Loading usage count…"} />}
  </div>;
}
