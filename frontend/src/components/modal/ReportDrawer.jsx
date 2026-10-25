import { Calendar, ClipboardList, FileText, Info, X } from "lucide-react";
import { DefList, Section } from "@/components/drawer";
import { StatusPill } from "@/components/public";
import { fmtDate } from "@/utils/format";
import { typeTone, typeLabel, sevTone, sevLabel, healthTone, condTone } from "@/constants/data";
import { getReportStatus, getReportItems, getReportSeverity, reportItemLabel, statusTone, statusLabel } from "@/utils/report";
import { Button } from "@/components/ui";

// Attachments are { url, publicId, resourceType } objects — there's no
// stored name/size, so derive a readable name from the url instead
// (mirrors FarmerDrawer's fileNameFromUrl).
function fileNameFromUrl(url) {
  try {
    const clean = url.split("?")[0];
    return decodeURIComponent(clean.split("/").pop() || url);
  } catch {
    return url;
  }
}

// Item shapes vary by entityType (see ENTITY_SELECT in report.service.js):
//   farm/crop  -> { name, quantity }
//   livestock  -> { animal, propertyNumber }
//   equipment  -> { name, propertyNumber }
function itemLabel(entityType, item) {
  if (entityType === "livestock") {
    return `${item.animal} (${item.propertyNumber})`;
  }
  if (entityType === "equipment") {
    return `${item.name} (${item.propertyNumber})`;
  }
  // farm reports are actually about crops
  return `${item.quantity} ${item.name}`;
}

// approvalStatus only ever has one of these two subdocs, and which one
// tells you who submitted the report: a far-submitted report only ever
// gets an aew subdoc, an aew-submitted report only ever gets a
// coordinator subdoc (see createReport / buildSubmittedByRoleFilter).
function submittedByRole(row) {
  if (row.approvalStatus?.aew) return "far";
  if (row.approvalStatus?.coordinator) return "aew";
  return null;
}

export function ReportDrawer({ row, onClose, onApprove, onDeny }) {
  const reportStatus = getReportStatus(row);
  const items = getReportItems(row);
  const severity = getReportSeverity(row);
  const files = row.attachments ?? row.files ?? [];
  const history = row.history ?? [];
  const submitterRole = submittedByRole(row);

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
              <div className="label-eyebrow mb-1">
                Report{row._id ? ` · ${row._id}` : ""}
              </div>
              <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                {row.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill tone={typeTone[row.entityType]}>
                  {typeLabel[row.entityType] ?? row.entityType}
                </StatusPill>
                <StatusPill tone={sevTone[severity]}>
                  {sevLabel[severity]}
                </StatusPill>
                <StatusPill tone={statusTone[reportStatus]}>
                  {statusLabel[reportStatus]}
                </StatusPill>
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
          <Section icon={Info} title="Report Information">
            <DefList
              items={[
                ["Association", row.association?.name ?? "Unassigned"],
                [
                  "Submitted by",
                  submitterRole ? submitterRole.toUpperCase() : "—",
                ],
                ["Title", row.title],
                ["Type", typeLabel[row.entityType] ?? row.entityType],
                ...(row.entityType === "farm" ? [["Condition", row.condition ?? "—"]] : []),
                ["Severity", sevLabel[severity]],
                ["Status", statusLabel[reportStatus]],
                ...(row.entityType === "farm" && row.parent
                  ? [["Farm", `${row.parent.tag} — ${row.parent.address}`]]
                  : []),
                ["Date", fmtDate(row.createdAt)],
              ]}
            />
          </Section>

          <Section
            icon={ClipboardList}
            title={
              row.entityType === "farm" ? "Reported Crops" : "Reported Items"
            }
          >
            {items.length > 0 ? (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.itemId}
                    className="border border-border bg-muted-30 px-3 py-2 text-sm text-foreground"
                  >
                    {row.entityType === "farm" ? itemLabel(row.entityType, item) : reportItemLabel(row.entityType, item)}
                    {row.entityType !== "farm" && <div className="mt-2 flex flex-wrap gap-2">
                      <StatusPill tone={(row.entityType === "equipment" ? condTone : healthTone)?.[item.condition] ?? "info"}>{item.condition ?? "—"}</StatusPill>
                      <StatusPill tone={sevTone[item.severity]}>{sevLabel[item.severity]}</StatusPill>
                    </div>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-secondary">No items listed.</div>
            )}
          </Section>

          <Section icon={FileText} title="Details">
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {row.details || "No additional details provided."}
            </p>
          </Section>

          <Section icon={FileText} title="Uploaded Files">
            {files.length > 0 ? (
              <ul className="space-y-2">
                {files.map((f) => (
                  <li
                    key={f.publicId ?? f.url}
                    className="flex items-center gap-3 border border-border bg-muted-30 px-3 py-2"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center bg-surface text-secondary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm font-medium text-foreground hover:underline"
                      >
                        {fileNameFromUrl(f.url)}
                      </a>
                    </div>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-secondary">No files uploaded.</div>
            )}
          </Section>

          <Section icon={Calendar} title="Timeline">
            {history.length > 0 ? (
              <ol className="relative ml-2 border-l border-border">
                {history.map((h, i) => (
                  <li key={i} className="relative pl-5 pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                    <div className="text-sm text-foreground">{h.message}</div>
                    <div className="text-xs text-secondary">
                      {fmtDate(h.date)}
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
        {(onApprove || onDeny) && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-40 px-6 py-4">
            {onApprove && <Button variant="accent" onClick={onApprove}>Approve</Button>}
            {onDeny && <Button variant="danger" onClick={onDeny}>Disapprove</Button>}
          </div>
        )}
      </aside>
    </div>
  );
}
