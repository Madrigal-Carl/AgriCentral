import { fmtDate } from "@/utils/format";
import { Activity, Calendar, Info, User, X } from "lucide-react";
import { Section, DefList } from "@/components/drawer";
import { StatusPill } from "@/components/public";
import { EQUIPMENTS, condTone, condLabel, statusTone } from "@/constants/data";

export function EquipmentDrawer({ row, onClose }) {
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
              <div className="label-eyebrow mb-1">Equipment · {row.id}</div>
              <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                {row.name}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill tone={condTone[row.condition]}>
                  {condLabel[row.condition]}
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
          <Section icon={Info} title="Basic Information">
            <DefList
              items={[
                ["Equipment Tag ID", row.id],
                ["Name", row.name],
                ["Condition", condLabel[row.condition]],
                ["Status", row.status],
                ["Acquisition Date", fmtDate(row.acquisitionDate)],
              ]}
            />
          </Section>

          <Section icon={User} title="Assigned Farmer">
            {row.farmer ? (
              <div className="flex items-center gap-3 border border-border bg-muted-30 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-accent-soft rounded-full font-display text-sm text-accent">
                  {row.farmer[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">
                    {row.farmer}
                  </div>
                  <div className="text-xs text-secondary">
                    Since {fmtDate(row.acquisitionDate)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-secondary">No farmer assigned.</div>
            )}
          </Section>

          <Section icon={Activity} title="Condition Records">
            <DefList
              items={[
                ["Current Condition", condLabel[row.condition]],
                ["Status", row.status],
                [
                  "Last Updated",
                  fmtDate(new Date().toISOString().slice(0, 10)),
                ],
              ]}
            />
          </Section>

          <Section icon={Calendar} title="Activity Timeline">
            {row.history && row.history.length > 0 ? (
              <ol className="relative ml-2 border-l border-border">
                {row.history.map((h, i) => (
                  <li key={i} className="relative pl-5 pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                    <div className="font-semibold text-sm text-foreground">
                      {h.name}
                    </div>
                    <div className="text-xs text-secondary">
                      Acquired · {fmtDate(h.date)}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-secondary">No activity yet.</div>
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}
