import { useState } from "react";
import { DefList, ItemList, Section } from "@/components/drawer";
import { StatusPill } from "@/components/public";
import { statusTone, positionLabel } from "@/constants/data";
import {
  X,
  Info,
  Wheat,
  Beef,
  Tractor,
  Calendar,
} from "lucide-react";
import { fmtDate } from "@/utils/format";

function initialsOf(row) {
  const initials = [row.firstName, row.lastName]
    .map((part) => part?.trim()?.[0])
    .filter(Boolean)
    .join("");
  return (initials || row.fullName?.trim()?.[0] || "?").toUpperCase();
}

// Circular avatar: the uploaded profile image, or initials when there is
// none (or it fails to load, e.g. the asset was removed).
function FarmerAvatar({ row }) {
  const url = row.profileImage?.url;
  const [failedUrl, setFailedUrl] = useState(null);
  const showImage = Boolean(url) && failedUrl !== url;

  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft font-display text-base text-accent">
      {showImage ? (
        <img
          src={url}
          alt={row.fullName ? `${row.fullName} profile photo` : "Farmer profile photo"}
          className="h-full w-full rounded-full object-cover"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <span aria-hidden="true">{initialsOf(row)}</span>
      )}
    </div>
  );
}

export function FarmerDrawer({ row, onClose }) {
  const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  const farmItems = (row.farms || []).map((f) => `${f.tag} · ${f.address}`);
  const livestockItems = (row.livestock || []).map(
    (l) =>
      `${l.propertyNumber} · ${l.animal} (${l.breed?.name ?? "—"}) — ${capitalize(l.condition)}`,
  );
  const equipmentItems = (row.equipment || []).map(
    (e) => `${e.propertyNumber} · ${e.name} — ${capitalize(e.condition)}`,
  );

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
              <FarmerAvatar row={row} />
              <div className="min-w-0">
                <div className="label-eyebrow mb-1">Farmer</div>
                <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                  {row.fullName}
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
                // association is now a populated { _id, name } object
                // (or absent) — display the name, not the object itself.
                ["Association", row.association?.name || "—"],
                ["Position", positionLabel[row.position] || "—"],
                ["Last Name", row.lastName || "—"],
                ["First Name", row.firstName || "—"],
                ["Middle Name", row.middleName || "—"],
                ["Contact Number", row.contactNumber || "—"],
                ["Email Address", row.emailAddress || "—"],
                ["Gender", row.gender === "male" ? "Male" : "Female"],
                ["Birth Date", fmtDate(row.birthDate)],
                ["Address", row.address || "—"],
                ["Status", row.status],
              ]}
            />
          </Section>

          <Section icon={Wheat} title="Assigned Farms">
            <ItemList items={farmItems} empty="No farms assigned." />
          </Section>

          <Section icon={Beef} title="Assigned Livestock">
            <ItemList items={livestockItems} empty="No livestock assigned." />
          </Section>

          <Section icon={Tractor} title="Assigned Equipment">
            <ItemList items={equipmentItems} empty="No equipment assigned." />
          </Section>

          <Section icon={Calendar} title="Activity Timeline">
            {row.history && row.history.length > 0 ? (
              <ol className="relative ml-2 border-l border-border">
                {row.history.map((h, i) => (
                  <li key={h._id ?? i} className="relative pl-5 pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                    <div className="text-sm text-foreground">{h.message}</div>
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
