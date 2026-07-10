import { Calendar, FileText, ImagePlus, Info, User, X } from "lucide-react";
import { DefList, Section } from "@/components/drawer";
import { StatusPill } from "@/components/public";
import { fmtDate, fmtBytes } from "@/utils/format";
import {
  typeTone,
  typeLabel,
  sevTone,
  sevLabel,
  statusTone,
} from "@/constants/data";

export function ReportDrawer({ row, onClose }) {
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
              <div className="label-eyebrow mb-1">Report · {row.id}</div>
              <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                {row.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill tone={typeTone[row.type]}>
                  {typeLabel[row.type]}
                </StatusPill>
                <StatusPill tone={sevTone[row.severity]}>
                  {sevLabel[row.severity]}
                </StatusPill>
                <StatusPill tone={statusTone[row.status]}>
                  {row.status}
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
                ["Association", "Boac, Marinduque"],
                ["Title", row.title],
                ["Type", typeLabel[row.type]],
                ["Severity", sevLabel[row.severity]],
                ["Status", row.status],
                ["Date", fmtDate(row.date)],
              ]}
            />
          </Section>

          <Section icon={User} title="Reported By">
            {row.reportedBy ? (
              <div className="flex items-center gap-3 border border-border bg-muted-30 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-accent-soft rounded-full font-display text-sm text-accent">
                  {row.reportedBy[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">
                    {row.reportedBy} -{" "}
                    <span className="uppercase">{row.role}</span>
                  </div>
                  <div className="text-xs text-secondary">
                    Submitted {fmtDate(row.date)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-secondary">No reporter listed.</div>
            )}
          </Section>

          <Section icon={FileText} title="Details">
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {row.details || "No additional details provided."}
            </p>
          </Section>

          <Section icon={FileText} title="Uploaded Files">
            {row.files && row.files.length > 0 ? (
              <ul className="space-y-2">
                {row.files.map((f) => (
                  <li
                    key={f.id}
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
                        {f.name}
                      </a>
                      <div className="text-xs text-secondary">
                        {fmtBytes(f.size)}
                      </div>
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
            <ol className="relative ml-2 border-l border-border">
              <li className="relative pl-5 pb-4">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                <div className="font-semibold text-sm text-foreground">
                  Report submitted
                </div>
                <div className="text-xs text-secondary">
                  {fmtDate(row.date)}
                </div>
              </li>
              <li className="relative pl-5">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                <div className="font-semibold text-sm text-foreground">
                  Current status
                </div>
                <div className="text-xs text-secondary">{row.status}</div>
              </li>
            </ol>
          </Section>
        </div>
      </aside>
    </div>
  );
}
