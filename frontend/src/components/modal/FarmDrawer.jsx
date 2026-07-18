import { Activity, Info, MapPin, Scale, Users, Wheat, X } from "lucide-react";
import {
  CROP_STATUS_LABEL,
  CROP_STATUS_TONE,
  FARMER_CLASSIFICATION_LABEL,
} from "@/constants/data";
import { fmtDate } from "@/utils/format";
import { LocationMap } from "@/components/ui";
import { StatusPill } from "@/components/public";
import { DefList, Section } from "@/components/drawer";

export function FarmDrawer({ row, onClose }) {
  const crops = row.crops || [];
  const farmers = row.assignedFarmers || [];

  // crops.crop and assignedFarmers.farmer come back populated ({_id, name} /
  // {_id, fullName}) from the API, but fall back to the raw id/string just
  // in case a caller ever passes an unpopulated row.
  const cropLabel = (c) =>
    typeof c.crop === "string" ? c.crop : (c.crop?.name ?? "Unknown crop");

  const farmerLabel = (f) => {
    if (typeof f === "string") return f;
    const farmer = f.farmer; // populated Farmer doc, or raw id/string if unpopulated
    if (!farmer) return "Unknown farmer";
    if (typeof farmer === "string") return farmer; // unpopulated ObjectId
    return farmer.fullName ?? "Unknown farmer";
  };

  const totalYield = crops.reduce((sum, c) => sum + (c.yield || 0), 0);

  const location =
    row.latitude != null && row.longitude != null
      ? { lat: Number(row.latitude), lng: Number(row.longitude) }
      : null;

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
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-accent-soft rounded-full text-accent">
                <Wheat className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="label-eyebrow mb-1">Farm · {row.tag}</div>
                <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                  {row.address}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill tone="neutral">{crops.length} crops</StatusPill>
                  <StatusPill tone="info">{farmers.length} farmers</StatusPill>
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
                ["Farm Tag ID", row.tag],
                ["Association", row.association?.name || "—"],
                ["Address", row.address],
                ["Farmer", farmers.length],
                ["Crops", crops.length],
              ]}
            />
          </Section>

          <Section icon={Scale} title="Crop Yield">
            <div className="flex items-center gap-3 border border-border bg-muted-30 px-3 py-2">
              <div className="grid h-8 w-8 place-items-center bg-accent-soft text-foreground">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs text-secondary">Total yield</div>
                <div className="font-display text-xl tracking-tight text-foreground">
                  {totalYield.toLocaleString()} kg
                </div>
              </div>
            </div>
          </Section>

          <Section icon={Users} title="Assigned Farmers">
            {farmers.length === 0 ? (
              <div className="text-sm text-secondary">No farmers assigned.</div>
            ) : (
              <ul className="space-y-2">
                {farmers.map((f, i) => (
                  <li
                    key={f.farmer?._id || f.farmer || i}
                    className="flex items-center justify-between border border-border bg-muted-30 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {farmerLabel(f)}
                    </span>
                    {f.classification && (
                      <StatusPill tone="neutral">
                        {FARMER_CLASSIFICATION_LABEL[f.classification] ??
                          f.classification}
                      </StatusPill>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section icon={Wheat} title="Crop Information">
            {crops.length === 0 ? (
              <div className="text-sm text-secondary">No crops planted.</div>
            ) : (
              <ul className="space-y-2">
                {crops.map((c, i) => (
                  <li
                    key={c.crop?._id || c.crop || i}
                    className="flex items-center justify-between border border-border bg-muted-30 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {cropLabel(c)}
                    </span>
                    <div className="flex items-center gap-2">
                      {c.status === "harvested" && (
                        <span className="text-xs text-secondary">
                          {(c.yield || 0).toLocaleString()} kg
                        </span>
                      )}
                      <StatusPill tone={CROP_STATUS_TONE[c.status]}>
                        {CROP_STATUS_LABEL[c.status]}
                      </StatusPill>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section icon={MapPin} title="Geotag Location">
            {location ? (
              <LocationMap location={location} />
            ) : (
              <div className="text-sm text-secondary">No location pinned.</div>
            )}
          </Section>

          <Section icon={Activity} title="Activity Timeline">
            {row.history && row.history.length > 0 ? (
              <ol className="relative ml-2 border-l border-border">
                {row.history.map((h, i) => (
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
              <div className="text-sm text-secondary">No activity yet.</div>
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}
