import { DefList, Section } from "@/components/drawer";
import { StatusPill } from "@/components/public";
import { roleLabel, roleTone } from "@/constants/data";
import { X, Info, Mail, ShieldCheck, KeyRound } from "lucide-react";

export function UserDrawer({ row, onClose }) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground-40" />
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-surface border-l border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-accent-soft rounded-full font-display text-base text-accent">
                {row.fullname?.[0] ?? "?"}
              </div>
              <div className="min-w-0">
                <div className="label-eyebrow mb-1">User · {row._id}</div>
                <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                  {row.fullname}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill tone={roleTone[row.role]}>
                    {roleLabel[row.role]}
                  </StatusPill>
                  {!row.isVerified && (
                    <StatusPill tone="warning">Pending</StatusPill>
                  )}
                </div>
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
                ["User ID", row._id],
                ["Full Name", row.fullname],
                ["Role", roleLabel[row.role]],
                ...(row.role === "far"
                  ? [["Association", row.association || "—"]]
                  : []),
              ]}
            />
          </Section>

          <Section icon={Mail} title="Contact">
            <DefList items={[["Email Address", row.email || "—"]]} />
          </Section>

          <Section icon={ShieldCheck} title="Security">
            <div className="flex items-center justify-between gap-3 border border-border bg-muted-30 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <KeyRound className="h-4 w-4 text-secondary" />
                Password
              </div>
              <span className="font-mono text-sm tracking-widest text-secondary">
                ••••••••
              </span>
            </div>
            <p className="mt-2 text-xs text-secondary">
              Passwords are never shown in full. Use Reset Password from the
              edit screen to issue a new one.
            </p>
          </Section>
        </div>
      </aside>
    </div>
  );
}
