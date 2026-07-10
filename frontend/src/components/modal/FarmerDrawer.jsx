import { DefList, ItemList, Section } from "@/components/drawer";
import { StatusPill } from "@/components/public";
import { statusTone } from "@/constants/data";
import {
  X,
  Info,
  Wheat,
  Beef,
  Tractor,
  Calendar,
  FileText,
} from "lucide-react";
import { fmtDate, fmtBytes } from "@/utils/format";

export function FarmerDrawer({ row, onClose }) {
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
                {row.name[0]}
              </div>
              <div className="min-w-0">
                <div className="label-eyebrow mb-1">Farmer · {row.id}</div>
                <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                  {row.name}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill tone={statusTone[row.status]}>
                    {row.status}
                  </StatusPill>
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
                ["Association", "Boac, Marinduque"],
                ["Position", row.position],
                ["Full Name", row.name],
                ["Contact Number", row.contact || "—"],
                ["Email Address", row.email || "—"],
                ["Gender", row.gender === "male" ? "Male" : "Female"],
                ["Birth Date", fmtDate(row.dob)],
                ["Address", row.address || "—"],
                ["Status", row.status],
              ]}
            />
          </Section>

          <Section icon={Wheat} title="Assigned Farms">
            <ItemList items={row.farms} empty="No farms assigned." />
          </Section>

          <Section icon={Beef} title="Assigned Livestock">
            <ItemList items={row.livestock} empty="No livestock assigned." />
          </Section>

          <Section icon={Tractor} title="Assigned Equipment">
            <ItemList items={row.equipment} empty="No equipment assigned." />
          </Section>

          <Section icon={Calendar} title="Activity Timeline">
            {row.history && row.history.length > 0 ? (
              <ol className="relative ml-2 border-l border-border">
                {row.history.map((h, i) => (
                  <li key={i} className="relative pl-5 pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                    <div className="font-semibold text-sm text-foreground">
                      {h.action} {h.kind}: {h.item}
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
        </div>
      </aside>
    </div>
  );
}
