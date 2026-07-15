import { X, Info, User, Activity, Calendar } from "lucide-react";
import { StatusPill } from "@/components/public";
import { fmtDate } from "@/utils/format";
import { DefList, Section } from "@/components/drawer";
import { healthTone, statusTone } from "@/constants/data";

export function LivestockDrawer({ row, onClose }) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground-40" />
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-surface border-l border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="label-eyebrow mb-1">
                Livestock · {row.propertyNumber}
              </div>
              <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                {row.animal} · {row.breed}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                  {row.animal}
                </span>
                <StatusPill tone={healthTone[row.condition]}>
                  {row.condition}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <Section icon={Info} title="Basic Information">
            <DefList
              items={[
                ["Property Number", row.propertyNumber],
                // association is now a populated { _id, name } object
                // (or absent) — display the name, not the object itself.
                ["Association", row.association?.name || "—"],
                ["Animal", row.animal],
                ["Breed", row.breed || "—"],
                ["Gender", row.gender === "male" ? "Male" : "Female"],
                ["Date of Birth", row.birthDate ? fmtDate(row.birthDate) : "—"],
                ["Color", row.color || "—"],
                ["Weight", row.weight ? `${row.weight} kg` : "—"],
              ]}
            />
          </Section>

          <Section icon={User} title="Assigned Farmer">
            {row.assignedFarmer ? (
              <div className="flex items-center gap-3 border border-border bg-muted-30 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-accent-soft rounded-full font-display text-sm text-accent">
                  {row.assignedFarmer.fullName?.[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">
                    {row.assignedFarmer.fullName}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-secondary">No farmer assigned.</div>
            )}
          </Section>

          <Section icon={Calendar} title="Activity Timeline">
            {row.history && row.history.length > 0 ? (
              <ol className="relative ml-2 border-l border-border">
                {row.history.map((h, i) => (
                  <li key={h._id ?? i} className="relative pl-5 pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                    <div className="font-semibold text-sm text-foreground">
                      {h.message}
                    </div>
                    <div className="text-xs text-secondary">
                      {fmtDate(h.date)}
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
