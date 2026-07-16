import { X, Info, Package, FileText, Calendar } from "lucide-react";
import { DefList, Section } from "@/components/drawer";
import { StatusPill } from "@/components/public";
import { typeLabel, typeTone, sevTone, sevLabel } from "@/constants/data";
import {
  getDisplayStatus,
  statusTone,
  statusLabel,
  releaseStatusTone,
  releaseStatusLabel,
} from "@/utils/request";
import { fmtDate } from "@/utils/format";

export function RequestDrawer({ row, onClose }) {
  const displayStatus = getDisplayStatus(row);
  const entities = row.entities ?? [];
  const history = row.history ?? [];

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground-40" />
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-surface border-l border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="label-eyebrow mb-1">Request · {row._id}</div>
              <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                {row.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill tone={sevTone[row.severity]}>
                  {sevLabel[row.severity]}
                </StatusPill>
                <StatusPill tone={statusTone[displayStatus]}>
                  {statusLabel[displayStatus]}
                </StatusPill>
                {displayStatus === "approved" && (
                  <StatusPill tone={releaseStatusTone[row.releaseStatus]}>
                    {releaseStatusLabel[row.releaseStatus]}
                  </StatusPill>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center text-secondary hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <Section icon={Info} title="Basic Information">
            <DefList
              items={[
                ["Association", row.association?.name ?? "Unaffiliated"],
                ["Title", row.title],
                ["Type", typeLabel[row.entityType]],
                ["Severity", sevLabel[row.severity]],
                ["Status", statusLabel[displayStatus]],
                ["Submitted", fmtDate(row.createdAt)],
              ]}
            />
          </Section>

          <Section
            icon={Package}
            title={`Requested ${typeLabel[row.entityType]} (${entities.length})`}
          >
            {entities.length ? (
              <div className="space-y-2">
                {entities.map((e) => (
                  <div
                    key={e._id}
                    className="flex items-center justify-between gap-3 border border-border bg-muted-30 p-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {e.propertyNumber}
                      </div>
                      <div className="text-xs text-secondary">
                        {row.entityType === "livestock" ? e.animal : e.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-secondary">
                No items resolved for this request.
              </div>
            )}
          </Section>

          <Section icon={FileText} title="Details">
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {row.details || "No additional details provided."}
            </p>
          </Section>

          <Section icon={Calendar} title="Activity Timeline">
            {history.length ? (
              <ol className="relative ml-2 border-l border-border">
                {history.map((entry, i) => (
                  <li key={i} className="relative pl-5 pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                    <div className="text-sm text-foreground">
                      {entry.message}
                    </div>
                    <div className="text-xs text-secondary">
                      {fmtDate(entry.date)}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-secondary">
                No activity recorded yet.
              </div>
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}
