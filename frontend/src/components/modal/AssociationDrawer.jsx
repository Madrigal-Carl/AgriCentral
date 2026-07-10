import { X, Building2, Users2 } from "lucide-react";
import { Section } from "@/components/drawer";
import { StatusPill } from "@/components/public";
import { positionTone } from "@/constants/data";

export function AssociationDrawer({ row, onClose }) {
  const members = row.members ?? [];

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
              <div className="label-eyebrow mb-1">Association · {row.id}</div>
              <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                {row.name}
              </h2>
              <p className="mt-1 text-xs text-secondary">
                {members.length} member{members.length === 1 ? "" : "s"}
              </p>
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
          <Section icon={Building2} title="Association">
            <div className="flex items-center gap-3 border border-border bg-muted-30 p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center bg-accent-soft rounded-full text-accent">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 font-semibold text-foreground truncate">
                {row.name}
              </div>
            </div>
          </Section>

          <Section icon={Users2} title="Members">
            {members.length > 0 ? (
              <ul className="divide-y divide-border">
                {members.map((m, i) => (
                  <li
                    key={`${m.name}-${i}`}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center bg-accent-soft rounded-full font-display text-xs text-accent">
                        {m.name?.[0] ?? "?"}
                      </div>
                      <div className="min-w-0 font-medium text-foreground truncate">
                        {m.name}
                      </div>
                    </div>
                    <StatusPill tone={positionTone[m.position] ?? "neutral"}>
                      {m.position}
                    </StatusPill>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-secondary">
                No members recorded yet.
              </div>
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}
