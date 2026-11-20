import { Calendar, ClipboardList, FileText, Image as ImageIcon, Info, X } from "lucide-react";
import { DefList, Section } from "@/components/drawer";
import { StatusPill, FarmerOwnedBadge } from "@/components/public";
import { fmtDate } from "@/utils/format";
import { typeTone, typeLabel, priorityTone, priorityLabel, healthTone, condTone, CROP_STAGE_TONE, cropStageLabel, REPORT_KIND_LABEL, REPORT_KIND_TONE, DECEASED_CAUSE_LABEL, EQUIPMENT_USAGE_LABEL } from "@/constants/data";
import { getReportStatus, getReportItems, getReportKind, getReportPriority, getSubmittedByRole, isLegacyCropReport, reportItemLabel, statusTone, statusLabel } from "@/utils/report";
import { Button } from "@/components/ui";
import { STAGE_OPTION_LABELS } from "@/constants/cropStageFields";

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
  return `${item.name ?? "Unknown crop"}${item.reportedQuantity != null ? ` — ${item.reportedQuantity} crop units` : ""}${item.yieldKg != null ? ` — ${item.yieldKg} kg yielded` : ""}`;
}

// Stage dates are calendar dates stored at UTC midnight.
const fmtStageDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })
    : "—";
};
const fmtNumber = (value, unit) => {
  if (value == null || value === "") return "—";
  const text = Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return unit === "₱" ? `₱${text}` : `${text}${unit ? ` ${unit}` : ""}`;
};
const optionLabel = (field, value, other) => {
  if (value == null || value === "") return "—";
  const label = STAGE_OPTION_LABELS[field]?.[value] ?? value;
  return value === "other" && other ? `${label}: ${other}` : label;
};

// Every field of a crop entry's stage, as [label, value] rows.
function stageRows(stage, d = {}) {
  switch (stage) {
    case "newly_planted":
      return [
        ["Date Planted", fmtStageDate(d.datePlanted)],
        ["Area Planted", fmtNumber(d.areaPlantedHa, "ha")],
        ["Planting Method", optionLabel("plantingMethod", d.plantingMethod, d.plantingMethodOther)],
        ["Seed Class", optionLabel("seedClass", d.seedClass, d.seedClassOther)],
        ["Quantity of Seeds", fmtNumber(d.seedQuantity)],
        ["Seed Ownership", optionLabel("seedOwnership", d.seedOwnership)],
        ["Expected Harvest Date", fmtStageDate(d.expectedHarvestDate)],
        ["Expected Yield", fmtNumber(d.expectedYieldKg, "kg")],
      ];
    case "flowering":
    case "vegetative":
      return [
        [stage === "flowering" ? "Date Flowering Started" : "Date Vegetative Started", fmtStageDate(d.dateStarted)],
        ["Area", fmtNumber(d.areaHa, "ha")],
        ["Condition", optionLabel("condition", d.condition)],
      ];
    case "reproductive":
      return [
        ["Date Observed", fmtStageDate(d.dateObserved)],
        ["Area", fmtNumber(d.areaHa, "ha")],
        ["Sub-stage", d.subStage || "—"],
      ];
    case "harvested":
      return [
        ["Date Harvested", fmtStageDate(d.dateHarvested)],
        ["Area Harvested", fmtNumber(d.areaHarvestedHa, "ha")],
        ["Total Production", d.totalProductionUnit === "MT"
          ? `${fmtNumber(d.totalProductionValue, "MT")} (${fmtNumber(d.totalProductionKg, "kg")})`
          : fmtNumber(d.totalProductionKg ?? d.totalProductionValue, "kg")],
        ["Yield per Hectare", fmtNumber(d.yieldPerHaKg, "kg/ha")],
        ["Quality Grade", optionLabel("qualityGrade", d.qualityGrade)],
        ["Disposition", optionLabel("disposition", d.disposition)],
      ];
    case "damaged":
      return [
        ["Damage Reason", optionLabel("damageReason", d.damageReason, d.damageReasonOther)],
        ["Date Occurred", fmtStageDate(d.dateOccurred)],
        ["Area Affected", fmtNumber(d.areaAffectedHa, "ha")],
        ["Estimated Loss (kg)", fmtNumber(d.estimatedLossKg, "kg")],
        ["Estimated Loss (₱)", fmtNumber(d.estimatedLossPesos, "₱")],
      ];
    default:
      return [];
  }
}

export function ReportDrawer({ row, onClose, onApprove, onDeny }) {
  const reportStatus = getReportStatus(row);
  const items = getReportItems(row);
  const priority = getReportPriority(row);
  const files = row.attachments ?? row.files ?? [];
  const history = row.history ?? [];
  const submitterRole = getSubmittedByRole(row);
  const isFarm = row.entityType === "farm";
  const isLegacy = isLegacyCropReport(row);
  // Livestock kind; offspring reports keep the default priority, hidden here.
  const reportKind = getReportKind(row);
  const isOffspring = reportKind === "offspring";
  const farmerName = row.farmer?.fullName ?? (row.farmer ? "Unknown farmer" : "—");
  const isImage = (f) => (f.resourceType ?? "image") === "image";
  // Current crop reports hold one entry with its stage fields.
  const stageEntry = isFarm ? (row.cropEntries ?? []).find((entry) => entry.stage) : null;

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
                {reportKind && (
                  <StatusPill tone={REPORT_KIND_TONE[reportKind]}>
                    {REPORT_KIND_LABEL[reportKind] ?? reportKind}
                  </StatusPill>
                )}
                {!isOffspring && (
                  <StatusPill tone={priorityTone[priority]}>
                    {priorityLabel[priority]}
                  </StatusPill>
                )}
                <StatusPill tone={statusTone[reportStatus]}>
                  {statusLabel[reportStatus]}
                </StatusPill>
                {isLegacy && (
                  <span title="Recorded before crop reports became one crop per farmer. It can be reviewed but not edited.">
                    <StatusPill tone="neutral">Legacy</StatusPill>
                  </span>
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
          <Section icon={Info} title="Report Information">
            <DefList
              items={[
                ["Association", row.association?.name ?? "Unassigned"],
                [
                  "Submitted by",
                  submitterRole ? submitterRole.toUpperCase() : "—",
                ],
                ["Type", typeLabel[row.entityType] ?? row.entityType],
                ["Status", statusLabel[reportStatus]],
                ["Submitted", fmtDate(row.createdAt)],
                ...(isFarm ? [["Report date", fmtDate(row.reportedAt ?? row.createdAt)]] : []),
              ]}
            />
          </Section>

          {isFarm && (
            <Section icon={Info} title="Farm & Farmer">
              <DefList
                items={[
                  ["Farm", row.parent ? `${row.parent.tag} — ${row.parent.address}` : "—"],
                  ["Farmer", farmerName],
                  ["Priority", priorityLabel[priority]],
                ]}
              />
            </Section>
          )}

          {isOffspring ? (
            <Section icon={ClipboardList} title="New Offspring">
              <DefList
                items={[
                  ["Mother", items[0] ? reportItemLabel(row.entityType, items[0]) : "—"],
                  ["Number of Offspring", row.offspring?.count ?? "—"],
                  ["Birth Date", fmtStageDate(row.offspring?.birthDate)],
                  ["Notes", row.offspring?.notes || "—"],
                ]}
              />
            </Section>
          ) : (
          <Section
            icon={ClipboardList}
            title={isFarm ? (isLegacy && items.length > 1 ? "Reported Crops" : "Reported Crop") : "Reported Items"}
          >
            {items.length > 0 ? (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.itemId}
                    className="border border-border bg-muted-30 px-3 py-2 text-sm text-foreground"
                  >
                    {row.entityType === "farm" ? itemLabel(row.entityType, item) : reportItemLabel(row.entityType, item)}
                    {row.entityType === "farm" && item.ownership === "farmer" && <FarmerOwnedBadge className="ml-2" />}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusPill tone={(row.entityType === "equipment" ? condTone : row.entityType === "livestock" ? healthTone : CROP_STAGE_TONE)?.[item.condition] ?? "info"}>{row.entityType === "farm" ? "Staged: " : ""}{(row.entityType === "farm" ? cropStageLabel(item.condition) : item.condition) ?? "—"}</StatusPill>
                      <StatusPill tone={priorityTone[item.priority]}>{priorityLabel[item.priority]}</StatusPill>
                    </div>
                    {/* Condition reports: cause and date of a death. */}
                    {item.deceased?.cause && (
                      <div className="mt-2 text-xs text-secondary">
                        Cause: <span className="font-semibold text-foreground">{DECEASED_CAUSE_LABEL[item.deceased.cause] ?? item.deceased.cause}</span>
                        {" · "}Date of death: <span className="font-semibold text-foreground">{fmtStageDate(item.deceased.dateOfDeath)}</span>
                      </div>
                    )}
                    {/* Redispersal: from one farmer to another. */}
                    {reportKind === "redispersal" && (item.fromFarmer || item.toFarmer) && (
                      <div className="mt-2 text-xs text-secondary">
                        From: <span className="font-semibold text-foreground">{item.fromFarmer?.fullName ?? "Unknown farmer"}</span>
                        {" → "}To: <span className="font-semibold text-foreground">{item.toFarmer?.fullName ?? "Unknown farmer"}</span>
                      </div>
                    )}
                    {/* Equipment: reported usage and the farmer using it. */}
                    {row.entityType === "equipment" && (
                      <div className="mt-2 text-xs text-secondary">
                        Equipment status: <span className="font-semibold text-foreground">{EQUIPMENT_USAGE_LABEL[item.usageStatus ?? "idle"]}</span>
                        {item.usageStatus === "in_use" && (
                          <>
                            {" · "}Farmer: <span className="font-semibold text-foreground">{item.usedBy?.fullName ?? "Unknown farmer"}</span>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-secondary">No items listed.</div>
            )}
          </Section>
          )}

          {stageEntry && (
            <Section icon={ClipboardList} title={`${cropStageLabel(stageEntry.stage)} Details`}>
              <DefList items={stageRows(stageEntry.stage, stageEntry.stageData)} />
            </Section>
          )}

          <Section icon={FileText} title="Title & Details">
            <div className="space-y-3">
              <div>
                <div className="label-eyebrow mb-0.5">Title</div>
                <p className="text-sm font-medium text-foreground">{row.title}</p>
              </div>
              <div>
                <div className="label-eyebrow mb-0.5">Details</div>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {row.details || "No additional details provided."}
                </p>
              </div>
            </div>
          </Section>

          <Section icon={ImageIcon} title={stageEntry?.stage === "damaged" ? "Photo proof" : "Images"}>
            {files.some(isImage) && (
              <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {files.filter(isImage).map((f) => (
                  <a
                    key={f.publicId ?? f.url}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-[4/3] overflow-hidden border border-border bg-muted"
                    title={fileNameFromUrl(f.url)}
                  >
                    <img src={f.url} alt={fileNameFromUrl(f.url)} loading="lazy" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
            {files.some((f) => !isImage(f)) && (
              <ul className="space-y-2">
                {files.filter((f) => !isImage(f)).map((f) => (
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
            )}
            {files.length === 0 && (
              <div className="text-sm text-secondary">No images uploaded.</div>
            )}
          </Section>

          {row.entityType === "farm" && <Section icon={Info} title="Approvals">
            <div className="space-y-2">
              {["aew", "coordinator"].map((stage) => {
                const entry = row.approvalStatus?.[stage];
                return <div key={stage} className="border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span>{stage === "aew" ? "AEW" : "Coordinator"}</span>
                    {entry ? <StatusPill tone={statusTone[entry.status]}>{statusLabel[entry.status]}</StatusPill> : <span className="text-xs text-secondary">Awaiting AEW approval</span>}
                  </div>
                  {entry?.approvedAt && <p className="mt-1 text-xs text-secondary">{fmtDate(entry.approvedAt)}</p>}
                  {entry?.remarks && <p className="mt-1 whitespace-pre-wrap">{entry.remarks}</p>}
                </div>;
              })}
            </div>
          </Section>}

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
