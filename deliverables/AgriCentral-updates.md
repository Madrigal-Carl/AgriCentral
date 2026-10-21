# AgriCentral requested updates

Full contents of all 57 changed/new or restored code files are included below, grouped by the five requested sections. Files touching multiple sections appear once, in their primary section, with all their changes included.

**Clarification applied:** All/Crop/Equipment/Livestock export selection belongs on AnalyticsPage, not ReportsPage.

## Validation results

- Frontend npm run build: passed.
- Frontend npm run lint: **32 errors, 8 warnings**, exit code 1. Baseline HEAD had **36 errors, 8 warnings**; all remaining findings pre-existed. The unused ReportsPage fmtDate import was removed while updating the table/filter imports, and the new export button now uses previously unused AnalyticsPage imports.
- Backend/frontend focused tests: **26 passed**, via node --experimental-test-module-mocks --test test/requested-updates.test.js in backend/.
- Browser interaction checks passed with mocked API responses: four icon choices, both steps, all eight category/format combinations, Back/Cancel, retained period/association, failed-export retry, and no page errors.
- Backend syntax checks and git diff --check: passed.
- No live MongoDB, Cloudinary upload, or real backend PDF/Excel generation was exercised.

### Lint findings

| File | Errors | Warnings | Rules |
| --- | ---: | ---: | --- |
| frontend/src/components/modal/EquipmentDrawer.jsx | 1 | 0 | no-unused-vars |
| frontend/src/components/modal/FarmModal.jsx | 2 | 2 | no-unused-vars, react-hooks/exhaustive-deps, react-hooks/incompatible-library |
| frontend/src/components/modal/LivestockDrawer.jsx | 1 | 0 | no-unused-vars |
| frontend/src/components/modal/ReportDrawer.jsx | 1 | 0 | no-unused-vars |
| frontend/src/components/modal/ReportModal.jsx | 0 | 1 | react-hooks/incompatible-library |
| frontend/src/components/modal/RequestDrawer.jsx | 1 | 0 | no-unused-vars |
| frontend/src/components/modal/RequestModal.jsx | 0 | 1 | react-hooks/incompatible-library |
| frontend/src/components/public/DataTable.jsx | 8 | 0 | no-unused-vars, react-hooks/set-state-in-effect |
| frontend/src/components/public/FileUploader.jsx | 1 | 1 | no-unused-vars, react-hooks/exhaustive-deps |
| frontend/src/components/ui/LeafletMap.jsx | 0 | 1 | react-hooks/exhaustive-deps |
| frontend/src/constants/data.js | 4 | 0 | no-dupe-keys |
| frontend/src/constants/navigation.js | 1 | 0 | no-unused-vars |
| frontend/src/pages/public/AnalyticsPage.jsx | 0 | 2 | react-hooks/exhaustive-deps |
| frontend/src/pages/public/CropsPage.jsx | 2 | 0 | no-unused-vars |
| frontend/src/pages/public/FarmMapsPage.jsx | 1 | 0 | react-hooks/refs |
| frontend/src/pages/public/OverviewPage.jsx | 1 | 0 | react-hooks/immutability |
| frontend/src/pages/public/ReportsPage.jsx | 1 | 0 | react-hooks/set-state-in-effect |
| frontend/src/pages/public/RequestsPage.jsx | 1 | 0 | react-hooks/set-state-in-effect |
| frontend/src/pages/public/SettingsPage.jsx | 1 | 0 | react-hooks/set-state-in-effect |
| frontend/src/pages/public/UsersPage.jsx | 2 | 0 | no-unused-vars |
| frontend/src/routes/FallbackRedirect.jsx | 1 | 0 | no-unused-vars |
| frontend/src/routes/PublicOnlyRoute.jsx | 1 | 0 | no-unused-vars |
| frontend/src/routes/RoleRedirect.jsx | 1 | 0 | no-unused-vars |

## 1. Sidebar & Navigation

- Renamed every Management sidebar/breadcrumb group to Farmer Management. Admin management order is User, Farm, Farmer, Association.

### frontend/src/constants/navigation.js

````js
import { LayoutGrid, Users, Wheat, Tractor, Beef, Map, FileText, UserCircle2, Settings, ClipboardList, UserCog, BarChart3, Building2, Carrot } from "lucide-react";

/* ---------------- FAR ---------------- */
export const farNavSections = [
    {
        label: "Dashboard",
        items: [{ to: "/far/overview", label: "Overview", icon: LayoutGrid, exact: true }],
    },
    {
        label: "Farmer Management",
        items: [
            { to: "/far/farmers", label: "Farmer", icon: Users },
            { to: "/far/farms", label: "Farm", icon: Wheat },
        ],
    },
    {
        label: "Resources",
        items: [
            { to: "/far/equipments", label: "Equipment", icon: Tractor },
            { to: "/far/livestocks", label: "Livestock", icon: Beef },
            { to: "/far/crops", label: "Crop", icon: Carrot },
        ],
    },
    {
        label: "Mapping",
        items: [{ to: "/far/farm-maps", label: "Farm Map", icon: Map }],
    },
    {
        label: "Records",
        items: [
            { to: "/far/requests", label: "Request", icon: ClipboardList },
            { to: "/far/reports", label: "Report", icon: FileText },
        ],
    },
    {
        label: "Settings",
        items: [{ to: "/far/settings", label: "Settings", icon: Settings }],
    },
];

const farBreadcrumbs = {
    "/far/overview": { group: "Dashboard", label: "Overview" },
    "/far/farmers": { group: "Farmer Management", label: "Farmer" },
    "/far/farms": { group: "Farmer Management", label: "Farm" },
    "/far/equipments": { group: "Resources", label: "Equipment" },
    "/far/livestocks": { group: "Resources", label: "Livestock" },
    "/far/crops": { group: "Resources", label: "Crop" },
    "/far/farm-maps": { group: "Mapping", label: "Farm Maps" },
    "/far/requests": { group: "Requests", label: "Request" },
    "/far/reports": { group: "Records", label: "Report" },
    "/far/settings": { group: "Settings", label: "Settings" },
};

/* ---------------- AEW ---------------- */
export const aewNavSections = [
    {
        label: "Dashboard",
        items: [{ to: "/aew/overview", label: "Overview", icon: LayoutGrid, exact: true }],
    },
    {
        label: "Records",
        items: [
            { to: "/aew/reports", label: "Report", icon: FileText },
        ],
    },
    {
        label: "Farmer Management",
        items: [
            { to: "/aew/farms", label: "Farm", icon: Wheat },
            { to: "/aew/farmers", label: "Farmer", icon: Users },
            {
                to: "/aew/associations",
                label: "Association",
                icon: Building2,
            },
        ],
    },
    {
        label: "Resources",
        items: [
            { to: "/aew/equipments", label: "Equipment", icon: Tractor },
            { to: "/aew/livestocks", label: "Livestock", icon: Beef },
            { to: "/aew/crops", label: "Crop", icon: Carrot },
        ],
    },
    {
        label: "Mapping",
        items: [{ to: "/aew/farm-maps", label: "Farm Map", icon: Map }],
    },
    {
        label: "Settings",
        items: [{ to: "/aew/settings", label: "Settings", icon: Settings }],
    },
];

const aewBreadcrumbs = {
    "/aew/overview": { group: "Dashboard", label: "Overview" },
    "/aew/farms": { group: "Farmer Management", label: "Farm" },
    "/aew/farmers": { group: "Farmer Management", label: "Farmer" },
    "/aew/associations": {
        group: "Farmer Management",
        label: "Association",
    },
    "/aew/equipments": { group: "Resources", label: "Equipment" },
    "/aew/livestocks": { group: "Resources", label: "Livestock" },
    "/aew/crops": { group: "Resources", label: "Crop" },
    "/aew/farm-maps": { group: "Mapping", label: "Farm Maps" },
    "/aew/reports": { group: "Records", label: "Report" },
    "/aew/settings": { group: "Settings", label: "Settings" },
};

/* ---------------- COORDINATOR ---------------- */
export const coordinatorNavSections = [
    {
        label: "Dashboard",
        items: [
            {
                to: "/coordinator/overview",
                label: "Overview",
                icon: LayoutGrid,
                exact: true,
            },
        ],
    },
    {
        label: "Farmer Management",
        items: [
            {
                to: "/coordinator/farmers",
                label: "Farmer",
                icon: Users,
            },
            {
                to: "/coordinator/associations",
                label: "Association",
                icon: Building2,
            },
        ],
    },
    {
        label: "Inventory",
        items: [
            {
                to: "/coordinator/equipments",
                label: "Equipment",
                icon: Tractor,
            },
            {
                to: "/coordinator/livestocks",
                label: "Livestock",
                icon: Beef,
            },
            { to: "/coordinator/crops", label: "Crop", icon: Carrot },
        ],
    },
    {
        label: "Records",
        items: [
            {
                to: "/coordinator/requests",
                label: "Request",
                icon: ClipboardList,
            },
            {
                to: "/coordinator/reports",
                label: "Report",
                icon: FileText,
            },
            { to: "/coordinator/analytics", label: "Analytic", icon: BarChart3 },
        ],
    },
    {
        label: "Settings",
        items: [
            {
                to: "/coordinator/settings",
                label: "Settings",
                icon: Settings,
            },
        ],
    },
];

export const coordinatorBreadcrumbs = {
    "/coordinator/overview": {
        group: "Dashboard",
        label: "Overview",
    },
    "/coordinator/farmers": {
        group: "Farmer Management",
        label: "Farmer",
    },
    "/coordinator/associations": {
        group: "Farmer Management",
        label: "Association",
    },
    "/coordinator/equipments": {
        group: "Inventory",
        label: "Equipment",
    },
    "/coordinator/livestocks": {
        group: "Inventory",
        label: "Livestock",
    },
    "/coordinator/crops": { group: "Inventory", label: "Crop" },
    "/coordinator/requests": {
        group: "Records",
        label: "Request",
    },
    "/coordinator/reports": {
        group: "Records",
        label: "Report",
    },
    "/coordinator/analytics": {
        group: "Records",
        label: "Analytic",
    },
    "/coordinator/settings": {
        group: "Settings",
        label: "Settings",
    },
};

/* ---------------- GOVERNOR ---------------- */
export const governorNavSections = [
    {
        label: "Dashboard",
        items: [
            {
                to: "/governor/overview",
                label: "Overview",
                icon: LayoutGrid,
                exact: true,
            },
        ],
    },
    {
        label: "Resources",
        items: [
            {
                to: "/governor/equipments",
                label: "Equipment",
                icon: Tractor,
            },
        ],
    },
    {
        label: "Records",
        items: [
            {
                to: "/governor/requests",
                label: "Request",
                icon: ClipboardList,
            },
            {
                to: "/governor/reports",
                label: "Report",
                icon: FileText,
            },
            { to: "/governor/analytics", label: "Analytic", icon: BarChart3 },
        ],
    },
    {
        label: "Settings",
        items: [
            {
                to: "/governor/settings",
                label: "Settings",
                icon: Settings,
            },
        ],
    },
];

export const governorBreadcrumbs = {
    "/governor/overview": {
        group: "Dashboard",
        label: "Overview",
    },
    "/governor/equipments": {
        group: "Resources",
        label: "Equipment",
    },
    "/governor/requests": {
        group: "Records",
        label: "Request",
    },
    "/governor/reports": {
        group: "Records",
        label: "Report",
    },
    "/governor/analytics": {
        group: "Records",
        label: "Analytic",
    },
    "/governor/settings": {
        group: "Settings",
        label: "Settings",
    },
};

/* ---------------- HEAD ---------------- */
export const headNavSections = [
    {
        label: "Dashboard",
        items: [
            {
                to: "/head/overview",
                label: "Overview",
                icon: LayoutGrid,
                exact: true,
            },
        ],
    },
    {
        label: "Records",
        items: [
            {
                to: "/head/requests",
                label: "Request",
                icon: ClipboardList,
            },
            {
                to: "/head/reports",
                label: "Report",
                icon: FileText,
            },
            { to: "/head/analytics", label: "Analytic", icon: BarChart3 },
        ],
    },
    {
        label: "Farmer Management",
        items: [
            {
                to: "/head/farms",
                label: "Farm",
                icon: Wheat,
            },
        ],
    },
    {
        label: "Resources",
        items: [
            {
                to: "/head/equipments",
                label: "Equipment",
                icon: Tractor,
            },
            { to: "/head/livestocks", label: "Livestock", icon: Beef },
        ],
    },
    {
        label: "Mapping",
        items: [
            {
                to: "/head/farm-maps",
                label: "Farm Map",
                icon: Map,
            },
        ],
    },
    {
        label: "Settings",
        items: [
            {
                to: "/head/settings",
                label: "Settings",
                icon: Settings,
            },
        ],
    },
];

export const headBreadcrumbs = {
    "/head/overview": {
        group: "Dashboard",
        label: "Overview",
    },
    "/head/requests": {
        group: "Records",
        label: "Request",
    },
    "/head/reports": {
        group: "Records",
        label: "Report",
    },
    "/head/analytics": {
        group: "Records",
        label: "Analytic",
    },
    "/head/farms": {
        group: "Farmer Management",
        label: "Farm",
    },
    "/head/equipments": { group: "Resources", label: "Equipment" },
    "/head/livestocks": { group: "Resources", label: "Livestock" },
    "/head/farm-maps": {
        group: "Mapping",
        label: "Farm Map",
    },
    "/head/settings": {
        group: "Settings",
        label: "Settings",
    },
};

/* ---------------- ADMIN ---------------- */
export const adminNavSections = [
    {
        label: "Dashboard",
        items: [
            {
                to: "/admin/overview",
                label: "Overview",
                icon: LayoutGrid,
                exact: true,
            },
        ],
    },
    {
        label: "Farmer Management",
        items: [
            {
                to: "/admin/users",
                label: "User",
                icon: UserCog,
            },
            {
                to: "/admin/farms",
                label: "Farm",
                icon: Wheat,
            },
            {
                to: "/admin/farmers",
                label: "Farmer",
                icon: Users,
            },
            {
                to: "/admin/associations",
                label: "Association",
                icon: Building2,
            },
        ],
    },
    {
        label: "Inventory",
        items: [
            {
                to: "/admin/equipments",
                label: "Equipment",
                icon: Tractor,
            },
            {
                to: "/admin/livestocks",
                label: "Livestock",
                icon: Beef,
            },
            { to: "/admin/crops", label: "Crop", icon: Carrot },
        ],
    },
    {
        label: "Records",
        items: [
            {
                to: "/admin/requests",
                label: "Request",
                icon: ClipboardList,
            },
            {
                to: "/admin/reports",
                label: "Report",
                icon: FileText,
            },
        ],
    },
    {
        label: "Mapping",
        items: [
            {
                to: "/admin/farm-maps",
                label: "Farm Map",
                icon: Map,
            },
        ],
    },
    {
        label: "Settings",
        items: [
            {
                to: "/admin/settings",
                label: "Settings",
                icon: Settings,
            },
        ],
    },
];

export const adminBreadcrumbs = {
    "/admin/overview": {
        group: "Dashboard",
        label: "Overview",
    },
    "/admin/farms": {
        group: "Farmer Management",
        label: "Farm",
    },
    "/admin/farmers": {
        group: "Farmer Management",
        label: "Farmer",
    },
    "/admin/associations": {
        group: "Farmer Management",
        label: "Association",
    },
    "/admin/users": {
        group: "Farmer Management",
        label: "User",
    },
    "/admin/equipments": {
        group: "Inventory",
        label: "Equipment",
    },
    "/admin/livestocks": {
        group: "Inventory",
        label: "Livestock",
    },
    "/admin/crops": {
        group: "Inventory",
        label: "Crop",
    },
    "/admin/requests": {
        group: "Records",
        label: "Request",
    },
    "/admin/reports": {
        group: "Records",
        label: "Report",
    },
    "/admin/settings": {
        group: "Settings",
        label: "Settings",
    },
    "/admin/farm-maps": {
        group: "Mapping",
        label: "Farm Map",
    },
};

/* ---------------- MERGED ---------------- */
export const allBreadcrumbs = {
    ...farBreadcrumbs,
    ...aewBreadcrumbs,
    ...coordinatorBreadcrumbs,
    ...governorBreadcrumbs,
    ...headBreadcrumbs,
    ...adminBreadcrumbs,
};

/* ---------------- ROLE MAP ---------------- */
export const navSectionsByRole = {
    far: farNavSections,
    aew: aewNavSections,
    coordinator: coordinatorNavSections,
    governor: governorNavSections,
    head: headNavSections,
    admin: adminNavSections,
};

export const breadcrumbsByRole = {
    far: farBreadcrumbs,
    aew: aewBreadcrumbs,
    coordinator: coordinatorBreadcrumbs,
    governor: governorBreadcrumbs,
    head: headBreadcrumbs,
    admin: adminBreadcrumbs,
};

export function resolveRoleKey(role, fallback = "far") {
    if (!role) return fallback;
    const key = String(role).toLowerCase();
    return navSectionsByRole[key] ? key : fallback;
}

export function getNavSectionsForRole(role) {
    return navSectionsByRole[resolveRoleKey(role)];
}

export function getBreadcrumbsForRole(role) {
    return breadcrumbsByRole[resolveRoleKey(role)];
}
````

## 2. Labels & Terminology

- Row actions now say Archive and use the Archive icon, without changing handlers or archival behavior. DeleteConfirmModal already used archive wording and was left untouched.
- Release state now says Unreleased; livestock form/drawer/date-validation copy says Release Date while retaining birthDate/dob keys. There was no birth-date table label on LivestocksPage to rename.
- Section-level analytics exports say Generate Detailed Report; the page-level Export Report label is unchanged. Report Condition precedes Severity in the form, drawer information, and table.
- No Crop Condition label exists in CropModal, CropDrawer, CropsPage, or constants/data.js in this checkout. No unrelated crop fields or labels were changed.

### frontend/src/components/public/RowActions.jsx

````jsx
import { IconButton } from "@/components/ui";
import {
  Eye,
  Pencil,
  Archive,
  Check,
  X as XIcon,
  PackageCheck,
} from "lucide-react";

export function RowActions({
  onView,
  onEdit,
  onDelete,
  onApprove,
  onDeny,
  onRelease,
}) {
  const isReview = Boolean(onApprove || onDeny);

  if (isReview) {
    return (
      <div className="flex items-center justify-end gap-1">
        {onView && <IconButton icon={Eye} label="View" onClick={onView} />}
        {onApprove && (
          <IconButton
            icon={Check}
            label="Approve"
            tone="success"
            onClick={onApprove}
          />
        )}
        {onDeny && (
          <IconButton
            icon={XIcon}
            label="Deny"
            tone="danger"
            onClick={onDeny}
          />
        )}
        {onRelease && (
          <IconButton
            icon={PackageCheck}
            label="Release"
            tone="success"
            onClick={onRelease}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {onView && <IconButton icon={Eye} label="View" onClick={onView} />}
      {onEdit && <IconButton icon={Pencil} label="Edit" onClick={onEdit} />}
      {onRelease && (
        <IconButton
          icon={PackageCheck}
          label="Release"
          tone="success"
          onClick={onRelease}
        />
      )}
      {onDelete && (
        <IconButton
          icon={Archive}
          label="Archive"
          tone="danger"
          onClick={onDelete}
        />
      )}
    </div>
  );
}
````

### frontend/src/utils/request.js

````js
const STAGE_ORDER = ["coordinator", "governor", "head"];

// Mirrors the actual approval chain per entity type in
// updateRequestApproval on the backend: equipment goes through all three
// stages, livestock skips governor entirely (coordinator -> head).
function getApprovalChain(entityType) {
    return entityType === "livestock"
        ? ["coordinator", "head"]
        : STAGE_ORDER;
}

// Mirrors buildOverallStatusFilter in request.service.js
export function getOverallStatus(request) {
    const stages = request.approvalStatus || {};
    const deniedAtAnyStage = STAGE_ORDER.some(
        (stage) => stages[stage]?.status === "denied",
    );
    if (deniedAtAnyStage) return "denied";
    if (stages.head?.status === "approved") return "approved";
    return "pending";
}

// The stage currently awaiting review, or null if the request is fully
// resolved (approved/denied) or hasn't been created with any stage yet.
export function getCurrentStage(request) {
    const stages = request.approvalStatus || {};
    return (
        STAGE_ORDER.find((stage) => stages[stage]?.status === "pending") ?? null
    );
}

// True once every stage in this request's actual chain (entity-type
// aware — see getApprovalChain) has approved. This is the gate for
// showing the release action: coordinator is the one who releases once
// the whole chain has signed off.
export function isFullyApproved(request) {
    const stages = request.approvalStatus || {};
    const chain = getApprovalChain(request.entityType);
    return chain.every((stage) => stages[stage]?.status === "approved");
}

// All roles see the same overall pipeline status — a request stays
// "pending" until head has approved it, regardless of who's viewing.
export function getDisplayStatus(row) {
    return getOverallStatus(row);
}

export const statusTone = {
    pending: "warning",
    approved: "success",
    denied: "danger",
};

export const statusLabel = {
    pending: "Pending",
    approved: "Approved",
    denied: "Denied",
};

export const releaseStatusTone = {
    pending: "warning",
    partial: "info",
    released: "success",
};

export const releaseStatusLabel = {
    pending: "Unreleased",
    partial: "Partially Released",
    released: "Released",
};

export const REQUEST_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "denied", label: "Denied" },
];
````

### frontend/src/components/modal/LivestockDrawer.jsx

````jsx
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
                ["Release Date", row.birthDate ? fmtDate(row.birthDate) : "—"],
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
````

### frontend/src/schemas/livestock.schema.js

````js
import { z } from "zod";
import { GENDER_OPTIONS, LIVESTOCK_HEALTH_OPTIONS } from "@/constants/data";

const GENDERS = GENDER_OPTIONS.map((o) => o.value);
const HEALTH_STATUSES = LIVESTOCK_HEALTH_OPTIONS.map((o) => o.value);
const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const livestockFormSchema = z.object({
    propertyNumber: z
        .string({ required_error: "Property number is required" })
        .trim()
        .min(1, "Property number is required")
        .max(30, "Property number must not exceed 30 characters"),
    animal: z
        .string({ required_error: "Animal type is required" })
        .trim()
        .min(2, "Animal type must be at least 2 characters")
        .max(50, "Animal type must not exceed 50 characters"),
    breed: z
        .string({ required_error: "Breed is required" })
        .trim()
        .min(2, "Breed must be at least 2 characters")
        .max(50, "Breed must not exceed 50 characters"),
    gender: z.enum(GENDERS),
    health: z.enum(HEALTH_STATUSES),
    dob: z
        .string({ error: "Release date is required" })
        .trim()
        .min(1, "Release date is required"),
    color: z
        .string({ required_error: "Color is required" })
        .trim()
        .min(1, "Color is required")
        .max(50, "Color must not exceed 50 characters"),
    weight: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : val),
        z.union([z.number(), z.string()]).optional(),
    ).transform((val, ctx) => {
        if (val === undefined) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Weight is required" });
            return z.NEVER;
        }
        const num = typeof val === "number" ? val : Number(val);
        if (Number.isNaN(num)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Weight must be a number" });
            return z.NEVER;
        }
        if (num < 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Weight must be zero or greater" });
            return z.NEVER;
        }
        return num;
    }),
    associationId: z.union([objectId("Invalid association id"), z.literal("")]).optional(),
});

export const livestockUpdateSchema = livestockFormSchema.partial();
````

### frontend/src/pages/public/AnalyticsPage.jsx

````jsx
import { useMemo, useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Tractor,
  Beef,
  Wheat,
  Leaf,
  Download,
  Search,
  ChevronDown,
  Check,
  Loader2,
  LayoutGrid,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { PageHeader, StatCard, ExportDropdown } from "@/components/public";
import { Button, Select } from "@/components/ui";
import {
  useAnalytics,
  downloadAnalyticsPdf,
  downloadAnalyticsExcel,
} from "@/hooks/useAnalytics";
import { useAssociations } from "@/hooks/useAssociations";
import { ModalShell } from "@/components/modal/ModalShell";
import {
  ANALYTICS_CHART_COLORS,
  ANALYTICS_PERIOD_OPTIONS,
  ANALYTICS_MONTH_LABELS,
  ALL_ASSOCIATIONS_OPTION,
} from "@/constants/data";

const EXPORT_SECTIONS = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "equipment", label: "Equipment", icon: Tractor },
  { value: "livestock", label: "Livestock", icon: Beef },
  { value: "farm", label: "Crop", icon: Wheat },
];

const EXPORT_FORMATS = [
  { value: "xlsx", label: "Excel", icon: FileSpreadsheet },
  { value: "pdf", label: "PDF", icon: FileText },
];

/* ---------------- Helpers ---------------- */
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Pivots the backend's long-format monthly rows into the wide shape
// LineChart expects: one row per month, one key per farm. Farms with no
// harvest logged in a given month are filled with 0 rather than left
// undefined, so lines stay continuous instead of showing gaps.
function buildMonthlyChartData(monthlyYieldRows, farmNames) {
  const byMonth = new Map();
  for (let m = 1; m <= 12; m++) {
    const row = { month: ANALYTICS_MONTH_LABELS[m - 1] };
    for (const farm of farmNames) row[farm] = 0;
    byMonth.set(m, row);
  }
  for (const r of monthlyYieldRows) {
    const entry = byMonth.get(r.month);
    if (entry) entry[r.farm] = r.harvested;
  }
  return Array.from(byMonth.values());
}

function ChartCard({ title, subtitle, children, height = 280 }) {
  return (
    <div className="border border-border bg-surface p-5">
      <div className="mb-4">
        <h3 className="font-display text-base tracking-tight text-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-secondary">{subtitle}</p>
        )}
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

// value/options now work off association id (null = "All Associations")
// instead of raw display strings, since the backend needs a real ObjectId.
function AssociationFilter({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = options.find((o) => o.id === value) ?? options[0];

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={rootRef} className="relative w-full sm:w-64">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border border-border bg-surface px-3 py-2 text-sm text-foreground hover:border-foreground"
      >
        <span className="truncate">{selected?.name}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-secondary" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full border border-border bg-surface shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-secondary" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search association…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-secondary"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-secondary">
                No matches found.
              </li>
            )}
            {filtered.map((option) => (
              <li key={option.id ?? "all"}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <span className="truncate">{option.name}</span>
                  {option.id === value && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FilterBar({
  period,
  onPeriodChange,
  association,
  onAssociationChange,
  associationOptions,
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="w-full sm:w-48">
        <Select
          value={period}
          onChange={onPeriodChange}
          options={ANALYTICS_PERIOD_OPTIONS}
        />
      </div>
      <AssociationFilter
        value={association}
        onChange={onAssociationChange}
        options={associationOptions}
      />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, onExport, isExporting }) {
  return (
    <div className="mb-4 mt-8 flex items-center justify-between gap-3 first:mt-0">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center bg-accent-soft text-foreground">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h2 className="font-display text-xl tracking-tight text-foreground">
            {title}
          </h2>
        </div>
      </div>
      {onExport && (
        <ExportDropdown
          label="Generate Detailed Report"
          variant="outline"
          onExport={onExport}
          isExporting={isExporting}
        />
      )}
    </div>
  );
}

function DualSectionHeader({ left, right }) {
  return (
    <div className="mb-4 mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 first:mt-0">
      {[left, right].map((section, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center bg-accent-soft text-foreground">
              <section.icon className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="font-display text-xl tracking-tight text-foreground">
                {section.title}
              </h2>
            </div>
          </div>
          {section.onExport && (
            <ExportDropdown
              label="Generate Detailed Report"
              variant="outline"
              onExport={section.onExport}
              isExporting={section.isExporting}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Page ---------------- */
export function AnalyticsPage() {
  const [period, setPeriod] = useState("month");
  const [associationId, setAssociationId] = useState(null); // null = All Associations
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportSection, setExportSection] = useState(null);
  const [exportError, setExportError] = useState(null);

  // Tracks which section's PDF is currently rendering — null when none is.
  // "all" | "equipment" | "livestock" | "farm" | null
  const [exportingSection, setExportingSection] = useState(null);

  const { data: associationsRes } = useAssociations({ all: true });

  const associationOptions = useMemo(() => {
    const list = associationsRes?.associations ?? [];
    return [
      ALL_ASSOCIATIONS_OPTION,
      ...list.map((a) => ({ id: a._id, name: a.name })),
    ];
  }, [associationsRes]);

  const filters = useMemo(
    () => ({
      period,
      ...(associationId && { association: associationId }),
    }),
    [period, associationId],
  );

  const { data: analyticsRes, isLoading, isError } = useAnalytics(filters);
  const analytics = analyticsRes?.data;

  const equipmentStatus = useMemo(
    () =>
      (analytics?.equipment?.statusDistribution ?? []).map((s) => ({
        name: capitalize(s.name),
        value: s.value,
      })),
    [analytics],
  );

  const livestockHealth = useMemo(
    () =>
      (analytics?.livestock?.healthStatus ?? []).map((s) => ({
        name: capitalize(s.name),
        value: s.value,
      })),
    [analytics],
  );

  const cropStatus = useMemo(
    () =>
      (analytics?.farm?.cropStatus ?? []).map((s) => ({
        name: capitalize(s.name),
        value: s.value,
      })),
    [analytics],
  );

  const yieldPerFarm = analytics?.farm?.yieldPerFarm ?? [];

  const monthlyYieldRows = analytics?.farm?.monthlyYieldTrend ?? [];
  const farmNames = useMemo(
    () => Array.from(new Set(monthlyYieldRows.map((r) => r.farm))),
    [monthlyYieldRows],
  );
  const monthlyFarmYield = useMemo(
    () => buildMonthlyChartData(monthlyYieldRows, farmNames),
    [monthlyYieldRows, farmNames],
  );

  const kpis = analytics?.kpis ?? {
    equipment: 0,
    livestock: 0,
    farm: 0,
    cropYield: 0,
  };

  // Single handler for every export button — section and format decide which
  // file the backend builds. Guards against double-clicks while one is running.
  const handleExport = async (section, format = "pdf") => {
    if (exportingSection) return false;
    setExportingSection(section);
    setExportError(null);
    try {
      if (format === "xlsx") {
        await downloadAnalyticsExcel(filters, section);
      } else {
        await downloadAnalyticsPdf(filters, section);
      }
      return true;
    } catch (err) {
      console.error(`Failed to export ${format}:`, err);
      setExportError("Failed to export report. Please try again.");
      return false;
    } finally {
      setExportingSection(null);
    }
  };

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Analytics"
          subtitle="Consolidated report across equipment, livestock, farms, and crops."
        />
        <p className="mt-6 text-sm text-secondary">
          Couldn't load analytics data. Try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Consolidated report across equipment, livestock, farms, and crops."
        action={
          <Button
            variant="accent"
            disabled={isLoading || !!exportingSection}
            onClick={() => {
              setExportSection(null);
              setExportError(null);
              setExportModalOpen(true);
            }}
          >
            {exportingSection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exportingSection ? "Exporting…" : "Export Report"}
          </Button>
        }
      />

      <FilterBar
        period={period}
        onPeriodChange={setPeriod}
        association={associationId}
        onAssociationChange={setAssociationId}
        associationOptions={associationOptions}
      />

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div role="status" className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
            <p className="text-sm text-secondary">Loading analytics…</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Equipment"
              value={kpis.equipment}
              icon={Tractor}
              color="blue"
            />
            <StatCard
              label="Livestock"
              value={kpis.livestock}
              icon={Beef}
              color="amber"
            />
            <StatCard
              label="Farms"
              value={kpis.farm}
              icon={Wheat}
              color="green"
            />
            <StatCard
              label="Crop Yield"
              value={kpis.cropYield.toLocaleString()}
              icon={Leaf}
              color="lime"
            />
          </div>

          {/* Equipment + Livestock, side by side */}
          <DualSectionHeader
            left={{
              icon: Tractor,
              title: "Equipment",
              onExport: (format) => handleExport("equipment", format),
              isExporting: exportingSection === "equipment",
            }}
            right={{
              icon: Beef,
              title: "Livestock",
              onExport: (format) => handleExport("livestock", format),
              isExporting: exportingSection === "livestock",
            }}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Status Distribution"
              subtitle="Current fleet condition."
            >
              <PieChart>
                <Pie
                  data={equipmentStatus}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                >
                  {equipmentStatus.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ANALYTICS_CHART_COLORS[
                          i % ANALYTICS_CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartCard>
            <ChartCard
              title="Health Status"
              subtitle="Livestock health status."
            >
              <PieChart>
                <Pie
                  data={livestockHealth}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  label
                >
                  {livestockHealth.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ANALYTICS_CHART_COLORS[
                          i % ANALYTICS_CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartCard>
          </div>

          {/* Farm */}
          <SectionHeader
            icon={Wheat}
            title="Farm"
            onExport={(format) => handleExport("farm", format)}
            isExporting={exportingSection === "farm"}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Yield per Farm"
              subtitle="Quantity harvested per farm."
            >
              <BarChart data={yieldPerFarm}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="farm" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "quantity",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} (${props.payload.size} ha)`,
                    "Harvested",
                  ]}
                />
                <Bar
                  dataKey="harvested"
                  fill="#166534"
                  name="Harvested (quantity)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartCard>
            <ChartCard
              title="Crop Status"
              subtitle="Distribution across lifecycle."
            >
              <PieChart>
                <Pie
                  data={cropStatus}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                >
                  {cropStatus.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ANALYTICS_CHART_COLORS[
                          i % ANALYTICS_CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartCard>
          </div>
          <div className="mt-4">
            <ChartCard
              title="Monthly Yield Trend"
              subtitle="Quantity harvested per month, by farm (full current year)."
              height={320}
            >
              <LineChart data={monthlyFarmYield}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {farmNames.map((farm, i) => (
                  <Line
                    key={farm}
                    type="monotone"
                    dataKey={farm}
                    stroke={
                      ANALYTICS_CHART_COLORS[i % ANALYTICS_CHART_COLORS.length]
                    }
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ChartCard>
          </div>
        </>
      )}
      {exportModalOpen && (
        <ModalShell
          title={exportSection ? "Select Export Format" : "Export Report"}
          eyebrow={exportSection ? EXPORT_SECTIONS.find((section) => section.value === exportSection)?.label : "Analytics"}
          maxWidth="max-w-md"
          onClose={() => { if (!exportingSection) setExportModalOpen(false); }}
          footer={
            <Button
              variant="outline"
              disabled={!!exportingSection}
              onClick={() => {
                if (exportSection) {
                  setExportSection(null);
                  setExportError(null);
                } else {
                  setExportModalOpen(false);
                }
              }}
            >
              {exportSection ? "Back" : "Cancel"}
            </Button>
          }
        >
          <p className="text-sm text-secondary mb-4">
            {exportSection ? "Choose Excel or PDF to export your report." : "Choose which data to include in your report."}
          </p>
          {exportError && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{exportError}</p>}
          <div className="grid grid-cols-2 gap-3">
            {exportSection ? EXPORT_FORMATS.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                disabled={!!exportingSection}
                onClick={async () => {
                  if (await handleExport(exportSection, value)) setExportModalOpen(false);
                }}
              >
                <Icon className="h-4 w-4" /> {label}
              </Button>
            )) : EXPORT_SECTIONS.map(({ value, label, icon: Icon }) => (
              <Button key={value} type="button" variant="outline" onClick={() => setExportSection(value)}>
                <Icon className="h-4 w-4" /> {label}
              </Button>
            ))}
          </div>
        </ModalShell>
      )}
    </div>
  );
}
````

### frontend/src/components/modal/ReportModal.jsx

````jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useAuth from "@/hooks/useAuth";
import {
  Button,
  Field,
  SingleSelect,
  MultiSelect,
  TextInput,
  FullSelect,
} from "@/components/ui";
import { FileUploader } from "@/components/public";
import { ModalShell } from "./ModalShell";
import {
  SEVERITY_OPTIONS,
  EQUIPMENT_CONDITION_OPTIONS,
  LIVESTOCK_HEALTH_OPTIONS,
} from "@/constants/data";
import {
  createReportFormSchema,
  createReportUpdateSchema,
} from "@/schemas/report.schema";
import { useCreateReport, useUpdateReport } from "@/hooks/useReports";
import { useAssociations } from "@/hooks/useAssociations";
import { useFarms } from "@/hooks/useFarms";
import { useLivestocks } from "@/hooks/useLivestocks";
import { useEquipments } from "@/hooks/useEquipments";

const ENTITY_TYPE_OPTIONS = [
  { value: "farm", label: "Crop" },
  { value: "livestock", label: "Livestock" },
  { value: "equipment", label: "Equipment" },
];

// Crop has no dedicated "condition" field on its own model — the closest
// analog is the status a crop carries while attached to a farm
// (farmCropSchema.status), so this is hardcoded to mirror that enum
// rather than pulled from a shared constant.
const CROP_CONDITION_OPTIONS = [
  { value: "planted", label: "Planted" },
  { value: "growing", label: "Growing" },
  { value: "withered", label: "Withered" },
  { value: "harvested", label: "Harvested" },
  { value: "damaged", label: "Damaged" },
];

const CONDITION_OPTIONS_BY_TYPE = {
  farm: CROP_CONDITION_OPTIONS,
  livestock: LIVESTOCK_HEALTH_OPTIONS,
  equipment: EQUIPMENT_CONDITION_OPTIONS,
};

// Maps a backend report record onto the form's field names.
function toFormShape(report) {
  return {
    id: report._id,
    title: report.title,
    severity: report.severity,
    entityType: report.entityType,
    farm: report.parentId ?? report.parent?._id ?? "",
    itemIds: (report.itemIds ?? report.items ?? []).map((i) =>
      typeof i === "string" ? i : i._id,
    ),
    condition: report.condition,
    details: report.details,
    files: report.attachments || [],
    association: report.association?._id ?? report.association ?? "",
  };
}

export function ReportModal({ mode, initial, onClose, onSave }) {
  const { role, user } = useAuth();
  const isFar = role === "far";
  const isEdit = mode === "edit";
  const [submitError, setSubmitError] = useState(null);
  const previousInitialIdRef = useRef(null);

  const { data: associationsData } = useAssociations(
    { all: true },
    { enabled: !isFar },
  );
  const associationOptions = (associationsData?.associations ?? []).map(
    (a) => ({ value: a._id, label: a.name }),
  );

  const resolver = useMemo(
    () =>
      zodResolver(
        isEdit ? createReportUpdateSchema() : createReportFormSchema(isFar),
      ),
    [isEdit, isFar],
  );

  const normalizedInitial = useMemo(
    () => (initial ? toFormShape(initial) : initial),
    [initial],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver,
    defaultValues: {
      severity: "medium",
      entityType: normalizedInitial?.entityType || "farm",
      itemIds: [],
      association: normalizedInitial?.association ?? "",
      ...normalizedInitial,
    },
  });

  useEffect(() => {
    const nextValues = {
      severity: "medium",
      entityType: normalizedInitial?.entityType || "farm",
      itemIds: [],
      association: normalizedInitial?.association ?? "",
      ...normalizedInitial,
    };

    const initialId = normalizedInitial?.id ?? normalizedInitial?._id ?? null;
    const isSameInitial = previousInitialIdRef.current === initialId;

    if (!isSameInitial) {
      previousInitialIdRef.current = initialId;
      reset(nextValues, { keepDirty: false, keepDirtyValues: false });
    }
  }, [normalizedInitial, reset]);

  const entityType = watch("entityType");
  const farmValue = watch("farm");
  const selectedAssociation =
    watch("association") || (isFar ? (user?.association ?? "") : "");
  const associationFilter = selectedAssociation || undefined;
  const associationChangeRef = useRef(null);

  // far users are always scoped to their own association, so the
  // "pick an association first" gate only applies to non-far roles who
  // have an explicit association selector to fill in.
  const associationRequiredButMissing = !isFar && !selectedAssociation;

  // Item pool + condition options depend on entityType, and the crop pool
  // additionally depends on which farm is picked — clear stale selections
  // whenever the thing they depend on changes.
  useEffect(() => {
    if (!normalizedInitial?.id && !normalizedInitial?._id) {
      setValue("itemIds", []);
      setValue("condition", "");
      if (entityType !== "farm") setValue("farm", "");
    }
  }, [entityType, normalizedInitial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!normalizedInitial?.id && !normalizedInitial?._id) {
      setValue("itemIds", []);
    }
  }, [farmValue, normalizedInitial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      associationChangeRef.current !== null &&
      associationChangeRef.current !== selectedAssociation
    ) {
      setValue("itemIds", []);
      setValue("condition", "");
      setValue("farm", "");
    }
    associationChangeRef.current = selectedAssociation;
  }, [selectedAssociation, setValue]);

  const { data: farmsData } = useFarms(
    {
      all: true,
      ...(associationFilter ? { associationId: associationFilter } : {}),
    },
    { enabled: entityType === "farm" && !associationRequiredButMissing },
  );
  const { data: livestockData } = useLivestocks(
    {
      all: true,
      ...(associationFilter ? { associationId: associationFilter } : {}),
    },
    { enabled: entityType === "livestock" && !associationRequiredButMissing },
  );
  const { data: equipmentData } = useEquipments(
    {
      all: true,
      ...(associationFilter ? { associationId: associationFilter } : {}),
    },
    { enabled: entityType === "equipment" && !associationRequiredButMissing },
  );

  const farmOptions = (farmsData?.farms ?? []).map((f) => ({
    value: f._id,
    label: f.tag,
  }));

  const itemOptions = useMemo(() => {
    if (entityType === "livestock") {
      return (livestockData?.livestocks ?? []).map((l) => ({
        value: l._id,
        label: `${l.animal} (${l.propertyNumber})`,
      }));
    }
    if (entityType === "equipment") {
      return (equipmentData?.equipments ?? []).map((e) => ({
        value: e._id,
        label: `${e.name} (${e.propertyNumber})`,
      }));
    }
    if (entityType === "farm" && farmValue) {
      const farm = (farmsData?.farms ?? []).find((f) => f._id === farmValue);
      return (farm?.crops ?? []).map((c) => ({
        value: c.crop?._id ?? c.crop,
        label: `${c.crop.name}`,
      }));
    }
    return [];
  }, [entityType, farmValue, livestockData, equipmentData, farmsData]);

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateReport({
      onError: (err) =>
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        ),
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateReport({
      onError: (err) =>
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        ),
    });

  const busy = isCreating || isUpdating;

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      const payload = {
        title: values.title,
        severity: values.severity,
        entityType: values.entityType,
        condition: values.condition,
        itemIds: values.itemIds,
        details: values.details,
        files: values.files, // hook resolves this into `attachments`
        ...(values.entityType === "farm" ? { parentId: values.farm } : {}),
        ...(!isFar && values.association
          ? { associationId: values.association }
          : {}),
      };

      if (mode === "add") {
        const { report } = await createMutateAsync(payload);
        onSave?.(toFormShape(report));
      } else if (initial) {
        const { report } = await updateMutateAsync({
          id: initial._id,
          ...payload,
        });
        onSave?.(toFormShape(report));
      }
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message || err?.message || "Failed to save report",
      );
    }
  };

  const conditionOptions = CONDITION_OPTIONS_BY_TYPE[entityType] ?? [];

  // Guard against mode === "edit" firing with a null/undefined `initial`
  // (e.g. a stale row reference) instead of assuming "not add" always
  // means "edit with a valid record".
  const modalTitle =
    mode === "edit" && initial ? `Edit ${initial.title}` : "Add New Report";

  return (
    <ModalShell
      eyebrow="Report"
      title={modalTitle}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            type="button"
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            variant="accent"
            type="submit"
            form="report-form"
            disabled={busy}
          >
            {busy ? "Saving…" : mode === "add" ? "Add Report" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="report-form" onSubmit={handleSubmit(onSubmit)}>
        {submitError && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" full error={errors.title?.message}>
            <TextInput {...register("title")} placeholder="Short summary" />
          </Field>

          <Field label="Type" full error={errors.entityType?.message}>
            <Controller
              name="entityType"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={ENTITY_TYPE_OPTIONS}
                />
              )}
            />
          </Field>

          {!isFar && (
            <Field label="Association" full error={errors.association?.message}>
              <Controller
                name="association"
                control={control}
                render={({ field }) => (
                  <SingleSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={associationOptions}
                    placeholder="Select association…"
                    searchPlaceholder="Search association…"
                  />
                )}
              />
            </Field>
          )}

          {entityType === "farm" && (
            <Field label="Farm" full error={errors.farm?.message}>
              {associationRequiredButMissing ? (
                <div className="w-full border border-border bg-muted px-3 py-2.5 text-sm text-secondary">
                  Select an association first…
                </div>
              ) : (
                <Controller
                  name="farm"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={farmOptions}
                      placeholder="Select farm…"
                      searchPlaceholder="Search farm…"
                    />
                  )}
                />
              )}
            </Field>
          )}

          <Field
            label={entityType === "farm" ? "Crops" : "Items"}
            full
            error={errors.itemIds?.message}
          >
            {associationRequiredButMissing ? (
              <div className="w-full border border-border bg-muted px-3 py-2.5 text-sm text-secondary">
                Select an association first…
              </div>
            ) : entityType === "farm" && !farmValue ? (
              <div className="w-full border border-border bg-muted px-3 py-2.5 text-sm text-secondary">
                Select a farm first…
              </div>
            ) : (
              <Controller
                name="itemIds"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    values={field.value}
                    onChange={field.onChange}
                    options={itemOptions}
                    placeholder="Select items…"
                    searchPlaceholder="Search…"
                  />
                )}
              />
            )}
          </Field>

          <Field label="Condition" error={errors.condition?.message}>
            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={conditionOptions}
                  placeholder="Select condition…"
                />
              )}
            />
          </Field>

          <Field label="Severity" error={errors.severity?.message}>
            <Controller
              name="severity"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={SEVERITY_OPTIONS}
                  defaultValue="medium"
                />
              )}
            />
          </Field>

          <Field label="Details" full error={errors.details?.message}>
            <textarea
              {...register("details")}
              placeholder="Describe the report…"
              rows={5}
              className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground resize-y"
            />
          </Field>

          <Field label="Attachments (Optional)" full>
            <Controller
              name="files"
              control={control}
              render={({ field }) => (
                <FileUploader value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
````

## 3. Forms & Validation

- Equipment/livestock property-number checks return 409 with Property number is already in use, exclude self on edit, and appear on the field through getErrorMessage. Existing property-number indexes also protect concurrent writes.
- Farmer placeholders are Dela Cruz, Juan, Recto. Contact-number validation applies to the only editable contact-number field found: FarmerModal contact, mapped to farmer.contactNumber; create and edit share the field/schema.
- The contact input strips non-digits, caps at 11 characters, and both frontend/backend schemas require /^09\d{9}$/ with the requested error message. The backend validator already delegates to this schema.
- Seven officer positions are unique per active association membership, excluding self on edit; member and director repeat. Service checks plus a partial unique index protect the rule.
- Added municipality/barangay fields because neither existed, with case-insensitive uniqueness checks, a partial unique index, and the requested field error. Existing Field/TextInput components are reused.
- Association names and report titles share matching small meaningful-name validators on frontend/backend, rejecting the specified casing/junk patterns.
- Replaced the RSBSA upload field with one image-only profile upload through FileUploader and the existing Cloudinary upload service. Added profileImage without removing legacy attachments; partial updates no longer default-away legacy attachments or officer positions.
- FarmerDrawer displays the image inside its existing avatar location. Denial placeholders and the four requested suggestion Buttons are shared by requests/reports.

### frontend/src/utils/meaningfulName.js

````js
export const MEANINGFUL_NAME_ERROR = "Enter a meaningful name in proper case";

export function isMeaningfulName(value) {
    const text = value.trim();
    const letters = text.replace(/[^a-z]/gi, "");
    return letters.length >= 3 &&
        text !== text.toLowerCase() && text !== text.toUpperCase() &&
        /[aeiou]/i.test(letters) && !/^(.)\1+$/i.test(letters) &&
        !/^(abc|asdf|qwerty|test|testing|xyz|junk|sample|123)$/i.test(text);
}
````

### backend/src/utils/meaningfulName.js

````js
export const MEANINGFUL_NAME_ERROR = "Enter a meaningful name in proper case";

export function isMeaningfulName(value) {
    const text = value.trim();
    const letters = text.replace(/[^a-z]/gi, "");
    return letters.length >= 3 &&
        text !== text.toLowerCase() && text !== text.toUpperCase() &&
        /[aeiou]/i.test(letters) && !/^(.)\1+$/i.test(letters) &&
        !/^(abc|asdf|qwerty|test|testing|xyz|junk|sample|123)$/i.test(text);
}
````

### frontend/src/schemas/farmer.schema.js

````js
import { z } from "zod";

export const POSITIONS = [
    "president",
    "vice_president",
    "secretary",
    "treasurer",
    "auditor",
    "pio",
    "project_manager",
    "director",
    "member",
];

export const STATUSES = ["active", "inactive"];

const baseFarmerFormSchema = z.object({
    lastName: z
        .string({ required_error: "Last name is required" })
        .trim()
        .min(1, "Last name is required")
        .max(50, "Last name must not exceed 50 characters"),
    firstName: z
        .string({ required_error: "First name is required" })
        .trim()
        .min(1, "First name is required")
        .max(50, "First name must not exceed 50 characters"),
    middleName: z
        .string()
        .trim()
        .max(50, "Middle name must not exceed 50 characters")
        .optional(),
    contact: z
        .string({ error: "Contact number must be 11 digits and start with 09" })
        .trim()
        .regex(/^09\d{9}$/, "Contact number must be 11 digits and start with 09"),
    // Optional to mirror the backend, which does not require emailAddress.
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email format")
        .optional()
        .or(z.literal("")),
    gender: z.enum(["male", "female"], {
        required_error: "Gender is required",
    }),
    dob: z
        .string({ required_error: "Birth date is required" })
        .min(1, "Birth date is required"),
    address: z
        .string({ required_error: "Address is required" })
        .trim()
        .min(2, "Address must be at least 2 characters"),
    position: z.enum(POSITIONS).optional().default("member"),
    // Backend may send null for an unset association (see toFormShape),
    // and the form can also start with "" — accept all three "empty"
    // shapes here; whether it's actually required is decided below,
    // since that depends on the creator's role, not the field itself.
    association: z.string().nullable().optional(),
    farms: z.array(z.any()).optional().default([]),
    livestock: z.array(z.any()).optional().default([]),
    equipment: z.array(z.any()).optional().default([]),
    profileImage: z.array(z.union([
        z.object({ url: z.string().url(), publicId: z.string(), resourceType: z.literal("image").optional() }),
        z.object({ file: z.instanceof(File).refine((file) => file.type.startsWith("image/"), "Select an image") }).passthrough(),
    ])).max(1, "Select one profile image").optional().default([]),
});

// isFar is passed in from the caller (it comes from useAuth, not from the
// form itself) since a FAR user never sets association — it's resolved
// server-side from their own account — while anyone else must pick one.
export const createFarmerFormSchema = (isFar) =>
    baseFarmerFormSchema.superRefine((data, ctx) => {
        if (!isFar && !data.association) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Association is required",
                path: ["association"],
            });
        }
    });

// All fields optional — mirrors backend's PATCH semantics (partial update).
// For edits, the existing farmer record already has an association, so we
// should not block the form just because the field was not re-selected.
export const createFarmerUpdateSchema = () =>
    baseFarmerFormSchema.extend({
        status: z.enum(STATUSES).optional(),
    }).partial();

// Kept for any other call sites that import the static schema directly
// (e.g. relying on default non-far behavior). Prefer the factory
// functions above wherever the creator's role is known.
export const farmerFormSchema = createFarmerFormSchema(false);
export const farmerUpdateSchema = createFarmerUpdateSchema();
````

### backend/src/schemas/farmer.schema.js

````js
import { z } from "zod";

const POSITIONS = [
    "president",
    "vice_president",
    "secretary",
    "treasurer",
    "auditor",
    "pio",
    "project_manager",
    "director",
    "member",
];

const STATUSES = ["active", "inactive"];

const attachmentSchema = z.object({
    url: z.string().trim().url("Invalid attachment URL"),
    publicId: z.string().trim().min(1, "Missing attachment public id"),
    resourceType: z.enum(["image", "raw", "video"]).optional().default("image"),
});

export const createFarmerSchema = z.object({
    associationId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid association id")
        .optional(),
    lastName: z
        .string({ required_error: "Last name is required" })
        .trim()
        .min(1, "Last name must be at least 1 character")
        .max(50, "Last name must not exceed 50 characters"),
    firstName: z
        .string({ required_error: "First name is required" })
        .trim()
        .min(1, "First name must be at least 1 character")
        .max(50, "First name must not exceed 50 characters"),
    middleName: z
        .string()
        .trim()
        .max(50, "Middle name must not exceed 50 characters")
        .optional(),
    contactNumber: z
        .string({ error: "Contact number must be 11 digits and start with 09" })
        .trim()
        .regex(/^09\d{9}$/, "Contact number must be 11 digits and start with 09"),
    emailAddress: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email format")
        .optional(),
    gender: z.enum(["male", "female"], {
        required_error: "Gender is required",
    }),
    birthDate: z.coerce.date({
        required_error: "Birth date is required",
        invalid_type_error: "Invalid birth date",
    }),
    address: z
        .string({ required_error: "Address is required" })
        .trim()
        .min(2, "Address must be at least 2 characters"),
    position: z.enum(POSITIONS).optional().default("member"),
    attachments: z.array(attachmentSchema).optional().default([]),
    profileImage: attachmentSchema.extend({ resourceType: z.literal("image").default("image") }).nullable().optional(),
});

export const updateFarmerSchema = createFarmerSchema
    .extend({
        status: z.enum(STATUSES).optional(),
        position: z.enum(POSITIONS).optional(),
        attachments: z.array(attachmentSchema).optional(),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const farmerIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid farmer id"),
});

export const getFarmersQuerySchema = z.object({
    status: z.enum(STATUSES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    associationId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid association id")
        .optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});

export const farmerAssociationIdParamSchema = z.object({
    associationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid association id"),
});
````

### frontend/src/schemas/association.schema.js

````js
import { z } from "zod";
import { isMeaningfulName, MEANINGFUL_NAME_ERROR } from "@/utils/meaningfulName";

export const associationFormSchema = z.object({
    name: z
        .string({ required_error: "Association name is required" })
        .trim()
        .max(100, "Association name must not exceed 100 characters")
        .refine(isMeaningfulName, MEANINGFUL_NAME_ERROR),
    municipality: z.string().trim().min(1, "Municipality is required"),
    barangay: z.string().trim().min(1, "Barangay is required"),
    assignedUser: z.string().optional(),
});

// All fields optional — mirrors backend's PATCH semantics (partial update).
export const associationUpdateSchema = associationFormSchema.partial();
````

### backend/src/schemas/association.schema.js

````js
import { z } from "zod";
import { isMeaningfulName, MEANINGFUL_NAME_ERROR } from "../utils/meaningfulName.js";

export const createAssociationSchema = z.object({
    name: z
        .string({ required_error: "Association name is required" })
        .trim()
        .max(100, "Name must not exceed 100 characters")
        .refine(isMeaningfulName, MEANINGFUL_NAME_ERROR),
    municipality: z.string().trim().min(1, "Municipality is required"),
    barangay: z.string().trim().min(1, "Barangay is required"),
});

export const updateAssociationSchema = createAssociationSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const associationIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid association id"),
});

export const getAssociationsQuerySchema = z.object({
    search: z.string().trim().min(1).max(100).optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});

export const getAvailableAssociationsQuerySchema = z.object({
    includeId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid association id")
        .optional(),
});
````

### frontend/src/schemas/report.schema.js

````js
import { z } from "zod";
import { isMeaningfulName, MEANINGFUL_NAME_ERROR } from "@/utils/meaningfulName";

const SEVERITIES = ["low", "medium", "high", "critical"];
const ENTITY_TYPES = ["farm", "livestock", "equipment"];

const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

// An attachment that has already been uploaded to Cloudinary and resolved
// (either loaded from an existing report, or already finished uploading).
const attachmentSchema = z.object({
    url: z.string(),
    publicId: z.string(),
    resourceType: z.string().optional(),
});

// A file the user just picked in FileUploader but that hasn't been sent to
// Cloudinary yet — resolveAttachments() (in useReports) turns this into an
// attachmentSchema shape at submit time. We must accept this shape here too,
// otherwise validation fails before resolveAttachments ever runs.
// `.passthrough()` preserves id/name/size/progress/status, which FileUploader
// relies on for its uploading-row UI.
const pendingFileSchema = z
    .object({
        file: z.instanceof(File),
    })
    .passthrough();

const fileFieldSchema = z.union([attachmentSchema, pendingFileSchema]);

const baseReportForm = z.object({
    title: z
        .string({ required_error: "Title is required" })
        .trim()
        .max(100, "Title must not exceed 100 characters")
        .refine(isMeaningfulName, MEANINGFUL_NAME_ERROR),
    severity: z.enum(SEVERITIES).default("medium"),
    entityType: z.enum(ENTITY_TYPES, { required_error: "Select a type" }),
    farm: z.union([objectId("Select a farm"), z.literal("")]).optional(),
    itemIds: z
        .array(objectId("Invalid item"))
        .min(1, "Select at least one item"),
    condition: z
        .string({ required_error: "Condition is required" })
        .min(1, "Condition is required"),
    details: z
        .string({ required_error: "Details are required" })
        .trim()
        .min(10, "Details must be at least 10 characters")
        .max(1000, "Details must not exceed 1000 characters"),
    files: z.array(fileFieldSchema).optional().default([]),
    association: z
        .union([objectId("Select an association"), z.literal("")])
        .optional(),
});

// far never sends association (server derives it); aew must pick one.
export function createReportFormSchema(isFar) {
    return baseReportForm
        .refine((data) => data.entityType !== "farm" || !!data.farm, {
            message: "Farm is required for farm reports",
            path: ["farm"],
        })
        .refine((data) => isFar || !!data.association, {
            message: "Association is required",
            path: ["association"],
        });
}

export function createReportUpdateSchema() {
    return baseReportForm
        .partial()
        .refine(
            (data) => !data.entityType || data.entityType !== "farm" || !!data.farm,
            { message: "Farm is required for farm reports", path: ["farm"] },
        );
}
````

### backend/src/schemas/report.schema.js

````js
import { z } from "zod";
import { isMeaningfulName, MEANINGFUL_NAME_ERROR } from "../utils/meaningfulName.js";

const SEVERITIES = ["low", "medium", "high", "critical"];
const ENTITY_TYPES = ["farm", "livestock", "equipment"];
const OVERALL_STATUSES = ["pending", "approved", "denied"];
const STAGES = ["far", "aew", "coordinator"];
const APPROVAL_DECISIONS = ["approved", "denied"];

const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

const attachmentSchema = z.object({
    url: z.string().trim().url("Invalid attachment URL"),
    publicId: z.string().trim().min(1, "Missing attachment public id"),
    resourceType: z.enum(["image", "raw", "video"]).optional().default("image"),
});

// associationId is optional here: far never sends it (derived from the
// authenticated user in report.service.js), aew must send it.
const baseReportObject = z.object({
    associationId: objectId("Invalid association id").optional(),
    title: z
        .string({ required_error: "Title is required" })
        .trim()
        .max(100, "Title must not exceed 100 characters")
        .refine(isMeaningfulName, MEANINGFUL_NAME_ERROR),
    severity: z.enum(SEVERITIES).optional().default("medium"),
    entityType: z.enum(ENTITY_TYPES, { required_error: "Entity type is required" }),
    parentId: objectId("Invalid farm id").optional(),
    condition: z
        .string({ required_error: "Condition is required" })
        .trim()
        .min(1, "Condition is required"),
    itemIds: z
        .array(objectId("Invalid item id"))
        .min(1, "Select at least one item")
        .refine((arr) => new Set(arr).size === arr.length, {
            message: "Duplicate items are not allowed",
        }),
    details: z
        .string({ required_error: "Details are required" })
        .trim()
        .min(10, "Details must be at least 10 characters")
        .max(1000, "Details must not exceed 1000 characters"),
    attachments: z.array(attachmentSchema).optional().default([]),
});

export const createReportSchema = baseReportObject.refine(
    (data) => data.entityType !== "farm" || !!data.parentId,
    {
        message: "parentId (farm) is required for farm reports",
        path: ["parentId"],
    },
);

export const updateReportSchema = baseReportObject
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const updateReportApprovalSchema = z
    .object({
        status: z.enum(APPROVAL_DECISIONS, { required_error: "Status is required" }),
        remarks: z
            .string()
            .trim()
            .max(500, "Remarks must not exceed 500 characters")
            .optional()
            .default(""),
    })
    .refine(
        (data) => data.status !== "denied" || data.remarks.length >= 5,
        {
            message: "Remarks are required when denying a report (at least 5 characters)",
            path: ["remarks"],
        },
    );

export const reportIdParamSchema = z.object({
    id: objectId("Invalid report id"),
});

export const getReportsQuerySchema = z.object({
    date: z.string().date("Invalid report date").optional(),
    timezoneOffset: z.coerce.number().int().min(-840).max(840).optional().default(0),
    status: z.enum(OVERALL_STATUSES).optional(),
    severity: z.enum(SEVERITIES).optional(),
    entityType: z.enum(ENTITY_TYPES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    stage: z.enum(STAGES).optional(),
    associationId: objectId("Invalid association id").optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});
````

### backend/src/models/association.model.js

````js
import mongoose from "mongoose";

const associationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            minlength: 2,
            maxlength: 100,
        },
        municipality: { type: String, trim: true },
        barangay: { type: String, trim: true },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

associationSchema.index(
    { municipality: 1, barangay: 1 },
    {
        unique: true,
        partialFilterExpression: {
            deletedAt: null,
            municipality: { $type: "string" },
            barangay: { $type: "string" },
        },
        collation: { locale: "en", strength: 2 },
    },
);

export default mongoose.model("Association", associationSchema);
````

### backend/src/models/farmer.model.js

````js
import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
            trim: true,
        },
        publicId: {
            type: String,
            required: true,
            trim: true,
        },
        resourceType: {
            type: String,
            enum: ["image", "raw", "video"],
            default: "image",
        },
    },
    {
        _id: false,
        timestamps: true,
    },
);

const farmerSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        middleName: {
            type: String,
            trim: true,
        },
        contactNumber: {
            type: String,
            required: true,
            trim: true,
        },
        emailAddress: {
            type: String,
            trim: true,
            lowercase: true,
        },
        gender: {
            type: String,
            enum: ["male", "female"],
            required: true,
        },
        birthDate: {
            type: Date,
            required: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        position: {
            type: String,
            enum: [
                "president",
                "vice_president",
                "secretary",
                "treasurer",
                "auditor",
                "pio",
                "project_manager",
                "director",
                "member",
            ],
            default: "member",
        },
        attachments: [attachmentSchema],
        profileImage: { type: attachmentSchema, default: null },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Builds a full name from any object/document that has firstName/lastName.
// Static so it can be reused with partial docs (e.g. .select("firstName lastName"))
// or plain objects, not just full Farmer instances.
farmerSchema.statics.buildFullName = function (source = {}) {
    const firstName = source.firstName?.trim();
    const lastName = source.lastName?.trim();
    return [firstName, lastName].filter(Boolean).join(" ");
};

// Instance convenience method, e.g. farmer.getFullName()
farmerSchema.methods.getFullName = function () {
    return this.constructor.buildFullName(this);
};

// Virtual so farmer.fullName / JSON responses expose it automatically
farmerSchema.virtual("fullName").get(function () {
    return this.constructor.buildFullName(this);
});

farmerSchema.index(
    { association: 1, position: 1 },
    {
        unique: true,
        partialFilterExpression: {
            deletedAt: null,
            association: { $type: "objectId" },
            position: { $in: ["president", "vice_president", "secretary", "treasurer", "auditor", "pio", "project_manager"] },
        },
    },
);

const Farmer = mongoose.model("Farmer", farmerSchema);

export default Farmer;
````

### backend/src/services/association.service.js

````js
import mongoose from "mongoose";
import Association from "../models/association.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";

async function checkLocation(municipality, barangay, id) {
    if (!municipality || !barangay) return;
    const existing = await Association.exists({
        municipality: new RegExp(`^${escapeRegex(municipality.trim())}$`, "i"),
        barangay: new RegExp(`^${escapeRegex(barangay.trim())}$`, "i"),
        deletedAt: null,
        ...(id ? { _id: { $ne: id } } : {}),
    });
    if (existing) {
        const error = new Error("This municipality and barangay is already assigned to another association");
        error.statusCode = 409;
        throw error;
    }
}

export const createAssociation = async (data) => {
    await checkLocation(data.municipality, data.barangay);
    const existing = await Association.findOne({
        name: new RegExp(`^${escapeRegex(data.name.trim())}$`, "i"),
        deletedAt: null,
    });

    if (existing) {
        const conflictError = new Error("Association already exists");
        conflictError.statusCode = 409;
        throw conflictError;
    }

    const association = await Association.create(data);
    return association;
};

export const updateAssociation = async (id, data) => {
    const previous = await Association.findOne({ _id: id, deletedAt: null });
    await checkLocation(data.municipality ?? previous?.municipality, data.barangay ?? previous?.barangay, id);
    const association = await Association.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: data },
        { returnDocument: "after", runValidators: true }
    );

    if (!association) {
        const notFoundError = new Error("Association not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return association;
};

export const deleteAssociation = async (id) => {
    const association = await Association.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() }, $unset: { user: "" } },
        { returnDocument: "after" }
    );

    if (!association) {
        const notFoundError = new Error("Association not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    await Farmer.updateMany(
        { association: association._id },
        { $set: { association: null } },
    );

    return association;
};

export const restoreAssociation = async (id) => {
    // Restoring can collide with an active association that has since
    // taken the same name, so guard against that up front.
    const toRestore = await Association.findOne({ _id: id, deletedAt: { $ne: null } });

    if (!toRestore) {
        const notFoundError = new Error("Deleted association not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const nameTaken = await Association.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${escapeRegex(toRestore.name.trim())}$`, "i"),
        deletedAt: null,
    });

    if (nameTaken) {
        const conflictError = new Error("An active association with this name already exists");
        conflictError.statusCode = 409;
        throw conflictError;
    }

    await checkLocation(toRestore.municipality, toRestore.barangay, id);
    toRestore.deletedAt = null;
    await toRestore.save();
    return toRestore;
};

const attachMembers = async (associations) => {
    const associationIds = associations.map((a) => a._id);

    const userIds = associations
        .map((a) => a.user)
        .filter(Boolean)
        .map((u) => u.toString());

    // FAR user for each association, keyed by user id — the association
    // now points at its user directly, so we just resolve those ids.
    const farUsers = await User.find({
        _id: { $in: userIds },
        role: "far",
    }).select("_id fullname");

    const farUserById = new Map();
    for (const u of farUsers) {
        farUserById.set(u._id.toString(), u);
    }

    const farmers = await Farmer.find({
        association: { $in: associationIds },
    }).select("firstName lastName position association");

    const membersByAssociationId = new Map();
    for (const farmer of farmers) {
        const key = farmer.association?.toString();
        if (!key) continue;
        if (!membersByAssociationId.has(key)) membersByAssociationId.set(key, []);
        membersByAssociationId.get(key).push({
            name: farmer.getFullName(),
            position: farmer.position,
        });
    }

    return associations.map((a) => {
        const obj = typeof a.toObject === "function" ? a.toObject() : a;
        const key = obj._id.toString();
        const farUser = obj.user ? farUserById.get(obj.user.toString()) : null;
        const farmerMembers = membersByAssociationId.get(key) ?? [];

        const members = farUser
            ? [
                {
                    name: farUser.fullname,
                    position: "far",
                    userId: farUser._id,
                },
                ...farmerMembers,
            ]
            : farmerMembers;

        return {
            ...obj,
            assignedUser: farUser?._id ?? null,
            far: farUser?.fullname ?? null,
            members,
        };
    });
};

export const getAssociations = async ({ search, all, page, limit, includeDeleted = false }) => {
    const filter = includeDeleted ? {} : { deletedAt: null };

    if (search) {
        filter.name = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const associations = await Association.find(filter).sort({ createdAt: -1 });
        return {
            associations: await attachMembers(associations),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [associations, total] = await Promise.all([
        Association.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Association.countDocuments(filter),
    ]);

    return {
        associations: await attachMembers(associations),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

export const getAvailableAssociations = async ({ includeId } = {}) => {
    const validIncludeId = mongoose.isValidObjectId(includeId) ? includeId : null;

    const filter = {
        deletedAt: null,
        $or: [
            { user: null },
            ...(validIncludeId ? [{ _id: validIncludeId }] : []),
        ],
    };

    return Association.find(filter).sort({ name: 1 });
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
````

### backend/src/services/farmer.service.js

````js
import Farmer from "../models/farmer.model.js";
import Farm from "../models/farm.model.js";
import Livestock from "../models/livestock.model.js";
import Equipment from "../models/equipment.model.js";
import Crop from "../models/crop.model.js";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";
import cloudinary from "../config/cloudinary.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const association = await Association.findOne({
        user: authenticatedUserId,
        deletedAt: null,
    }).select("_id");

    return association?._id ?? undefined;
};

async function checkPosition(association, position, id) {
    if (!association || !["president", "vice_president", "secretary", "treasurer", "auditor", "pio", "project_manager"].includes(position)) return;
    const existing = await Farmer.exists({ association, position, deletedAt: null, ...(id ? { _id: { $ne: id } } : {}) });
    if (existing) {
        const error = new Error("This position is already taken in this association");
        error.statusCode = 409;
        throw error;
    }
}

export const createFarmer = async (data, authenticatedUserId) => {
    const { associationId, ...farmerData } = data;

    if (farmerData.emailAddress) {
        const existing = await Farmer.findOne({ emailAddress: farmerData.emailAddress, deletedAt: null });

        if (existing) {
            throw new Error("A farmer with this email already exists");
        }
    }

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    await checkPosition(resolvedAssociationId, farmerData.position);
    const farmer = await Farmer.create({
        ...farmerData,
        association: resolvedAssociationId || undefined,
    });

    await createLog({
        entityType: "farmer",
        entityId: farmer._id,
        association: farmer.association,
        message: `${farmer.getFullName()} was registered as a new farmer.`,
    });

    if (farmer.association) {
        const association = await Association.findById(farmer.association).select("name");

        await createLog({
            entityType: "farmer",
            entityId: farmer._id,
            association: farmer.association,
            message: `${farmer.getFullName()} was assigned to ${association?.name ?? "an association"}.`,
        });
    }

    return farmer;
};

export const updateFarmer = async (id, data) => {
    const { associationId, ...farmerData } = data;
    if (associationId !== undefined) {
        farmerData.association = associationId;
    }

    if (farmerData.emailAddress) {
        const existing = await Farmer.findOne({
            emailAddress: farmerData.emailAddress,
            _id: { $ne: id },
            deletedAt: null,
        });

        if (existing) {
            throw new Error("A farmer with this email already exists");
        }
    }

    const needsPrevious =
        farmerData.association !== undefined || farmerData.position !== undefined;
    const previousFarmer = needsPrevious
        ? await Farmer.findOne({ _id: id, deletedAt: null }).select("association position")
        : null;

    if (needsPrevious) {
        await checkPosition(
            farmerData.association !== undefined ? farmerData.association : previousFarmer?.association,
            farmerData.position ?? previousFarmer?.position,
            id,
        );
    }

    const previousImage = farmerData.profileImage !== undefined
        ? (await Farmer.findOne({ _id: id, deletedAt: null }).select("profileImage"))?.profileImage
        : null;
    let removedAttachments = [];
    if (farmerData.attachments) {
        const existingFarmer = await Farmer.findOne({ _id: id, deletedAt: null }).select("attachments");
        if (existingFarmer) {
            const keptPublicIds = new Set(
                farmerData.attachments.map((a) => a.publicId),
            );
            removedAttachments = existingFarmer.attachments.filter(
                (a) => !keptPublicIds.has(a.publicId),
            );
        }
    }

    const farmer = await Farmer.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: farmerData },
        { new: true, runValidators: true }
    );

    if (!farmer) {
        const notFoundError = new Error("Farmer not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (removedAttachments.length) {
        await deleteCloudinaryAttachments(removedAttachments);
    }
    if (previousImage && previousImage.publicId !== farmer.profileImage?.publicId) {
        await deleteCloudinaryAttachments([previousImage]);
    }

    if (
        farmerData.association !== undefined &&
        String(previousFarmer?.association ?? "") !== String(farmer.association ?? "")
    ) {
        if (farmer.association) {
            const association = await Association.findById(farmer.association).select("name");

            await createLog({
                entityType: "farmer",
                entityId: farmer._id,
                association: farmer.association,
                message: `${farmer.getFullName()} was assigned to ${association?.name ?? "an association"}.`,
            });
        } else {
            const previousAssociation = previousFarmer?.association
                ? await Association.findById(previousFarmer.association).select("name")
                : null;

            await createLog({
                entityType: "farmer",
                entityId: farmer._id,
                association: previousFarmer?.association,
                message: `${farmer.getFullName()} was removed from ${previousAssociation?.name ?? "their association"}.`,
            });
        }
    }

    if (
        farmerData.position !== undefined &&
        previousFarmer?.position !== farmer.position
    ) {
        await createLog({
            entityType: "farmer",
            entityId: farmer._id,
            association: farmer.association,
            message: `${farmer.getFullName()}'s position changed from ${humanize(previousFarmer?.position)} to ${humanize(farmer.position)}.`,
        });
    }

    return farmer;
};

export const deleteFarmer = async (id) => {
    const farmer = await Farmer.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!farmer) {
        const notFoundError = new Error("Farmer not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return farmer;
};

export const restoreFarmer = async (id) => {
    const toRestore = await Farmer.findOne({ _id: id, deletedAt: { $ne: null } });

    if (!toRestore) {
        const notFoundError = new Error("Deleted farmer not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (toRestore.emailAddress) {
        const emailTaken = await Farmer.findOne({
            _id: { $ne: id },
            emailAddress: toRestore.emailAddress,
            deletedAt: null,
        });

        if (emailTaken) {
            const conflictError = new Error("An active farmer with this email already exists");
            conflictError.statusCode = 409;
            throw conflictError;
        }
    }

    await checkPosition(toRestore.association, toRestore.position, id);
    toRestore.deletedAt = null;
    await toRestore.save();
    return toRestore;
};

const attachRelatedRecords = async (farmers, associationId) => {
    const farmerIds = farmers.map((f) => f._id);

    if (!farmerIds.length) return [];

    // assignedFarmers is an array of { farmer, classification } subdocuments
    // (see farm.model.js), not an array of bare farmer ids — the query and
    // the grouping below both need to reach into the nested "farmer" field.
    const farms = await Farm.find({
        "assignedFarmers.farmer": { $in: farmerIds },
        deletedAt: null,
    }).select("tag address assignedFarmers");

    const farmsByFarmerId = new Map();
    for (const farm of farms) {
        for (const assignment of farm.assignedFarmers) {
            const key = assignment.farmer.toString();
            if (!farmsByFarmerId.has(key)) farmsByFarmerId.set(key, []);
            farmsByFarmerId.get(key).push({ id: farm._id, tag: farm.tag, address: farm.address });
        }
    }

    const livestocks = await Livestock.find({
        assignedFarmer: { $in: farmerIds },
        deletedAt: null,
    }).select("propertyNumber animal breed condition status assignedFarmer association");

    const livestockByFarmerId = new Map();
    for (const livestock of livestocks) {
        const key = livestock.assignedFarmer.toString();
        if (!livestockByFarmerId.has(key)) livestockByFarmerId.set(key, []);
        livestockByFarmerId.get(key).push({
            id: livestock._id,
            propertyNumber: livestock.propertyNumber,
            animal: livestock.animal,
            breed: livestock.breed,
            condition: livestock.condition,
            status: livestock.association ? "assigned" : "available",
        });
    }

    const equipments = await Equipment.find({
        assignedFarmer: { $in: farmerIds },
        deletedAt: null,
    }).select("propertyNumber name condition status assignedFarmer association");

    const equipmentByFarmerId = new Map();
    for (const equipment of equipments) {
        const key = equipment.assignedFarmer.toString();
        if (!equipmentByFarmerId.has(key)) equipmentByFarmerId.set(key, []);
        equipmentByFarmerId.get(key).push({
            id: equipment._id,
            propertyNumber: equipment.propertyNumber,
            name: equipment.name,
            condition: equipment.condition,
            status: equipment.association ? "assigned" : "available",
        });
    }

    const logsByFarmerId = await getLogsForEntities("farmer", farmerIds, associationId);

    return farmers.map((f) => {
        const obj = typeof f.toObject === "function" ? f.toObject() : f;
        const key = obj._id.toString();
        return {
            ...obj,
            farms: farmsByFarmerId.get(key) ?? [],
            livestock: livestockByFarmerId.get(key) ?? [],
            equipment: equipmentByFarmerId.get(key) ?? [],
            history: logsByFarmerId.get(key) ?? [],
        };
    });
};

export const getFarmersByAssociationId = async (associationId) => {
    const farmers = await Farmer.find({ association: associationId, deletedAt: null })
        .sort({ createdAt: -1 })
        .populate("association", "name");
    return attachRelatedRecords(farmers, associationId);
};

export const getCropsByFarmerId = async (farmerId) => {
    const farmer = await Farmer.findOne({ _id: farmerId, deletedAt: null }).select("_id");

    if (!farmer) {
        const notFoundError = new Error("Farmer not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const crops = await Crop.find({
        assignedFarmer: farmerId,
        deletedAt: null,
        isDistributed: true,
        unplanted: { $gt: 0 },
    })
        .populate("association", "name")
        .sort({ createdAt: -1 });

    return crops;
};

export const getFarmers = async ({ status, search, associationId, all, page, limit, includeDeleted = false }) => {
    const filter = includeDeleted ? {} : { deletedAt: null };
    if (status) filter.status = status;
    if (associationId) filter.association = associationId;

    if (search) {
        const searchRegex = new RegExp(escapeRegex(search), "i");
        filter.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { middleName: searchRegex },
        ];
    }

    if (all) {
        const farmers = await Farmer.find(filter)
            .sort({ createdAt: -1 })
            .populate("association", "name");
        return {
            farmers: await attachRelatedRecords(farmers, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [farmers, total] = await Promise.all([
        Farmer.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("association", "name"),
        Farmer.countDocuments(filter),
    ]);

    return {
        farmers: await attachRelatedRecords(farmers, associationId),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

async function deleteCloudinaryAttachments(attachments = []) {
    if (!attachments.length) return;

    const results = await Promise.allSettled(
        attachments.map((a) =>
            cloudinary.uploader.destroy(a.publicId, {
                resource_type: a.resourceType || "image",
            }),
        ),
    );

    results.forEach((result, i) => {
        if (result.status === "rejected") {
            console.error(
                `Failed to delete Cloudinary asset ${attachments[i].publicId}:`,
                result.reason,
            );
        }
    });
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
````

### backend/src/middlewares/error.middleware.js

````js
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const propertyConflict = err.code === 11000 && err.keyPattern?.propertyNumber;
  const positionConflict = err.code === 11000 && err.keyPattern?.association && err.keyPattern?.position;
  const locationConflict = err.code === 11000 && err.keyPattern?.municipality && err.keyPattern?.barangay;
  const conflictMessage = propertyConflict ? "Property number is already in use"
    : positionConflict ? "This position is already taken in this association"
    : locationConflict ? "This municipality and barangay is already assigned to another association" : null;
  const statusCode = conflictMessage ? 409 : err.statusCode || err.status || 500;

  return res.status(statusCode).json({
    message: conflictMessage || err.message || "Server Error",
  });
};
````

### frontend/src/components/modal/EquipmentModal.jsx

````jsx
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, FullSelect, TextInput } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { EQUIPMENT_CONDITION_OPTIONS } from "@/constants/data";
import { useAssociations } from "@/hooks/useAssociations";
import { useCreateEquipment, useUpdateEquipment } from "@/hooks/useEquipments";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { assignmentReason } from "@/utils/assignment";
import {
  equipmentFormSchema,
  equipmentUpdateSchema,
} from "@/schemas/equipment.schema";

export function EquipmentModal({ mode, initial, onClose, onSave }) {
  const isEdit = mode === "edit";
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver((isEdit ? equipmentUpdateSchema : equipmentFormSchema).superRefine((values, ctx) => {
      const reason = assignmentReason("equipment", values.condition);
      if (reason && values.associationId && (!isEdit || values.associationId !== initial.associationId)) {
        ctx.addIssue({ code: "custom", message: reason, path: ["associationId"] });
      }
    })),
    defaultValues: {
      propertyNumber: initial.id,
      name: initial.name,
      condition: initial.condition,
      associationId: initial.associationId || "",
    },
  });

  const { data: associationsData } = useAssociations({ all: true });

  const associationOptions = [
    { value: "", label: "No Association (Return Equipment)" },
    ...(associationsData?.associations ?? []).map((a) => ({
      value: a._id,
      label: a.name,
    })),
  ];

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateEquipment({
      onError: (err) =>
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        ),
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateEquipment({
      onError: (err) =>
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        ),
    });

  const busy = isCreating || isUpdating;

  const onSubmit = async (values) => {
    setSubmitError(null);

    const clearingAssociation = isEdit && !values.associationId;
    const derivedStatus = values.associationId ? "assigned" : "available";

    const payload = {
      propertyNumber: values.propertyNumber,
      name: values.name,
      condition: values.condition,
      status: derivedStatus,
      ...(isEdit
        ? { associationId: values.associationId || null }
        : values.associationId
          ? { associationId: values.associationId }
          : {}),
      ...(isEdit
        ? {
            assignedFarmer: clearingAssociation ? null : initial.farmer || null,
          }
        : initial.farmer
          ? { assignedFarmer: initial.farmer }
          : {}),
    };

    try {
      if (mode === "add") {
        const { equipment } = await createMutateAsync(payload);
        onSave?.(equipment);
      } else {
        const { equipment } = await updateMutateAsync({
          id: initial._id,
          ...payload,
        });
        onSave?.(equipment);
      }
    } catch (err) {
      const message = getErrorMessage(err, "Failed to save equipment");
      if (message === "Property number is already in use") {
        setError("propertyNumber", { type: "server", message });
      }
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save equipment",
      );
    }
  };

  return (
    <ModalShell
      eyebrow={`Equipment · ${initial.id || "New"}`}
      title={mode === "add" ? "Add New Equipment" : `Edit ${initial.id}`}
      onClose={onClose}
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            type="button"
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            variant="accent"
            type="submit"
            form="equipment-form"
            disabled={busy}
          >
            {busy
              ? "Saving…"
              : mode === "add"
                ? "Add Equipment"
                : "Save Changes"}
          </Button>
        </>
      }
    >
      {submitError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {submitError}
        </div>
      )}
      <form
        id="equipment-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <Field label="Property Number" error={errors.propertyNumber?.message}>
          <TextInput {...register("propertyNumber")} placeholder="EQ-001" />
        </Field>
        <Field label="Equipment Name" error={errors.name?.message}>
          <TextInput
            {...register("name")}
            placeholder="Tractor, Plough, Harvester…"
          />
        </Field>
        <Field label="Condition" error={errors.condition?.message}>
          <Controller
            name="condition"
            control={control}
            render={({ field }) => (
              <FullSelect
                value={field.value}
                onChange={field.onChange}
                options={EQUIPMENT_CONDITION_OPTIONS}
              />
            )}
          />
        </Field>
        {!initial.reservedBy && (
          <Field label="Association" error={errors.associationId?.message}>
            <Controller
              name="associationId"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={associationOptions}
                  defaultValue=""
                />
              )}
            />
          </Field>
        )}
      </form>
    </ModalShell>
  );
}
````

### frontend/src/components/modal/LivestockModal.jsx

````jsx
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, FullSelect, TextInput } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { GENDER_OPTIONS, LIVESTOCK_HEALTH_OPTIONS } from "@/constants/data";
import { useAssociations } from "@/hooks/useAssociations";
import { useCreateLivestock, useUpdateLivestock } from "@/hooks/useLivestocks";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { assignmentReason } from "@/utils/assignment";
import {
  livestockFormSchema,
  livestockUpdateSchema,
} from "@/schemas/livestock.schema";

export function LivestockModal({ mode, initial, onClose, onSave }) {
  const isEdit = mode === "edit";
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver((isEdit ? livestockUpdateSchema : livestockFormSchema).superRefine((values, ctx) => {
      const reason = assignmentReason("livestock", values.health);
      if (reason && values.associationId && (!isEdit || values.associationId !== initial.associationId)) {
        ctx.addIssue({ code: "custom", message: reason, path: ["associationId"] });
      }
    })),
    defaultValues: {
      propertyNumber: initial.propertyNumber,
      animal: initial.animal,
      breed: initial.breed,
      gender: initial.gender,
      health: initial.health,
      dob: initial.dob?.slice(0, 10),
      color: initial.color,
      weight: initial.weight,
      associationId: initial.associationId || "",
    },
  });

  const { data: associationsData } = useAssociations({ all: true });

  const associationOptions = [
    { value: "", label: "No Association (Return Livestock)" },
    ...(associationsData?.associations ?? []).map((a) => ({
      value: a._id,
      label: a.name,
    })),
  ];

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateLivestock({
      onError: (err) =>
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        ),
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateLivestock({
      onError: (err) =>
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        ),
    });

  const busy = isCreating || isUpdating;

  const onSubmit = async (values) => {
    setSubmitError(null);

    const clearingAssociation = isEdit && !values.associationId;
    const derivedStatus = values.associationId ? "assigned" : "available";

    const payload = {
      propertyNumber: values.propertyNumber,
      animal: values.animal,
      breed: values.breed,
      gender: values.gender,
      condition: values.health,
      birthDate: values.dob,
      color: values.color,
      weight: values.weight,
      status: derivedStatus,
      ...(isEdit
        ? { associationId: values.associationId || null }
        : values.associationId
          ? { associationId: values.associationId }
          : {}),
      ...(isEdit
        ? {
            assignedFarmer: clearingAssociation ? null : initial.farmer || null,
          }
        : initial.farmer
          ? { assignedFarmer: initial.farmer }
          : {}),
    };

    try {
      if (mode === "add") {
        const { livestock } = await createMutateAsync(payload);
        onSave?.(livestock);
      } else {
        const { livestock } = await updateMutateAsync({
          id: initial._id,
          ...payload,
        });
        onSave?.(livestock);
      }
    } catch (err) {
      const message = getErrorMessage(err, "Failed to save livestock");
      if (message === "Property number is already in use") {
        setError("propertyNumber", { type: "server", message });
      }
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save livestock",
      );
    }
  };

  return (
    <ModalShell
      eyebrow={`Livestock · ${initial.id || "New"}`}
      title={mode === "add" ? "Add New Livestock" : `Edit ${initial.id}`}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            type="button"
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            variant="accent"
            type="submit"
            form="livestock-form"
            disabled={busy}
          >
            {busy
              ? "Saving…"
              : mode === "add"
                ? "Add Livestock"
                : "Save Changes"}
          </Button>
        </>
      }
    >
      {submitError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {submitError}
        </div>
      )}
      <form
        id="livestock-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Field
          label="Property Number"
          error={errors.propertyNumber?.message}
          full
        >
          <TextInput
            {...register("propertyNumber")}
            placeholder="e.g. LVS-001"
          />
        </Field>
        <Field label="Animal Type" error={errors.animal?.message} full>
          <TextInput
            {...register("animal")}
            placeholder="e.g. Cow, Goat, Sheep"
          />
        </Field>
        <Field label="Breed Type" error={errors.breed?.message}>
          <TextInput
            {...register("breed")}
            placeholder="e.g. Hereford, Angus"
          />
        </Field>
        <Field label="Color" error={errors.color?.message}>
          <TextInput {...register("color")} placeholder="e.g. Brown & White" />
        </Field>
        <Field label="Gender" error={errors.gender?.message}>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <FullSelect
                value={field.value}
                onChange={field.onChange}
                options={GENDER_OPTIONS}
              />
            )}
          />
        </Field>
        <Field label="Condition" error={errors.health?.message}>
          <Controller
            name="health"
            control={control}
            render={({ field }) => (
              <FullSelect
                value={field.value}
                onChange={field.onChange}
                options={LIVESTOCK_HEALTH_OPTIONS}
              />
            )}
          />
        </Field>
        <Field label="Release Date" error={errors.dob?.message}>
          <TextInput type="date" {...register("dob")} />
        </Field>
        <Field label="Weight (kg)" error={errors.weight?.message}>
          <TextInput
            type="number"
            min="0"
            step="0.1"
            {...register("weight")}
            placeholder="0.0"
          />
        </Field>
        {!initial.reservedBy && (
          <Field label="Association" error={errors.associationId?.message} full>
            <Controller
              name="associationId"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={associationOptions}
                  defaultValue=""
                />
              )}
            />
          </Field>
        )}
      </form>
    </ModalShell>
  );
}
````

### frontend/src/components/modal/FarmerModal.jsx

````jsx
import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useAuth from "@/hooks/useAuth";
import {
  Button,
  Field,
  SingleSelect,
  TextInput,
  FullSelect,
} from "@/components/ui";
import { GENDER_OPTIONS, POSITION_OPTIONS } from "@/constants/data";
import { FileUploader } from "@/components/public";
import { ModalShell } from "./ModalShell";
import {
  createFarmerFormSchema,
  createFarmerUpdateSchema,
} from "@/schemas/farmer.schema";
import { useCreateFarmer, useUpdateFarmer } from "@/hooks/useFarmers";
import { useAssociations } from "@/hooks/useAssociations";
import { getErrorMessage } from "@/utils/getErrorMessage";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Maps a backend farmer record onto the form's field names.
function toFormShape(farmer, extra = {}) {
  return {
    id: farmer._id,
    lastName: farmer.lastName,
    firstName: farmer.firstName,
    middleName: farmer.middleName || "",
    contact: farmer.contactNumber,
    email: farmer.emailAddress,
    gender: farmer.gender,
    dob: farmer.birthDate?.slice
      ? farmer.birthDate.slice(0, 10)
      : farmer.birthDate,
    address: farmer.address,
    position: farmer.position,
    status: farmer.status,
    profileImage: farmer.profileImage ? [farmer.profileImage] : [],
    association: farmer.association?._id ?? farmer.association,
    ...extra,
  };
}

export function FarmerModal({ mode, initial, onClose, onSave }) {
  const { role } = useAuth();
  const isFar = role === "far";
  const [submitError, setSubmitError] = useState(null);
  const isEdit = mode === "edit";

  const { data: associationsData } = useAssociations(
    { all: true },
    { enabled: !isFar },
  );

  const associationOptions = (associationsData?.associations ?? []).map(
    (a) => ({ value: a._id, label: a.name }),
  );

  const normalizedInitial = useMemo(() => {
    if (!initial) return initial;

    return {
      ...initial,
      association:
        initial.association == null
          ? initial.association
          : typeof initial.association === "string"
            ? initial.association
            : initial.association._id,
    };
  }, [initial]);

  const resolver = useMemo(
    () =>
      zodResolver(
        isEdit ? createFarmerUpdateSchema() : createFarmerFormSchema(isFar),
      ),
    [isEdit, isFar],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver,
    defaultValues: {
      gender: "male",
      position: normalizedInitial?.position || "member",
      association: normalizedInitial?.association ?? "",
      ...normalizedInitial,
    },
  });

  useEffect(() => {
    reset(
      {
        gender: "male",
        position: normalizedInitial?.position || "member",
        association: normalizedInitial?.association ?? "",
        ...normalizedInitial,
      },
      { keepDirty: false, keepDirtyValues: false },
    );
  }, [normalizedInitial, reset]);

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateFarmer({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateFarmer({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      const payload = {
        lastName: values.lastName,
        firstName: values.firstName,
        middleName: values.middleName,
        contactNumber: values.contact,
        emailAddress: values.email || undefined,
        gender: values.gender,
        birthDate: values.dob,
        address: values.address,
        position: values.position,
        profileImage: values.profileImage,
        ...(!isFar && values.association
          ? { associationId: values.association }
          : {}),
      };

      if (mode === "add") {
        const { farmer } = await createMutateAsync(payload);
        onSave?.(
          toFormShape(farmer, {
            farms: values.farms,
            livestock: values.livestock,
            equipment: values.equipment,
          }),
        );
      } else {
        const { farmer } = await updateMutateAsync({
          id: initial.id,
          ...payload,
          status: values.status, // only relevant/sent on edit
        });
        onSave?.(
          toFormShape(farmer, {
            farms: values.farms,
            livestock: values.livestock,
            equipment: values.equipment,
          }),
        );
      }
    } catch (err) {
      const message = getErrorMessage(err, "Failed to save farmer");
      if (message === "This position is already taken in this association") {
        setError("position", { type: "server", message });
      }
      setSubmitError(
        err?.response?.data?.message || err?.message || "Failed to save farmer",
      );
    }
  };

  const busy = isCreating || isUpdating;

  const modalTitle =
    mode === "add"
      ? "Add New Farmer"
      : `Edit ${[initial.firstName, initial.lastName].filter(Boolean).join(" ")}`;

  return (
    <ModalShell
      title={modalTitle}
      eyebrow="Farmer"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="accent"
            type="submit"
            form="farmer-form"
            disabled={busy}
          >
            {busy ? "Saving…" : mode === "add" ? "Add Farmer" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="farmer-form" onSubmit={handleSubmit(onSubmit)}>
        {submitError && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Last Name" error={errors.lastName?.message}>
            <TextInput {...register("lastName")} placeholder="Dela Cruz" />
          </Field>
          <Field label="First Name" error={errors.firstName?.message}>
            <TextInput {...register("firstName")} placeholder="Juan" />
          </Field>
          <Field
            label="Middle Name (Optional)"
            error={errors.middleName?.message}
          >
            <TextInput {...register("middleName")} placeholder="Recto" />
          </Field>

          <Field label="Email Address (Optional)" error={errors.email?.message}>
            <TextInput
              type="email"
              {...register("email")}
              placeholder="name@email.com"
            />
          </Field>

          <Field label="Contact Number" full error={errors.contact?.message}>
            <TextInput
              {...register("contact")}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11);
                register("contact").onChange(e);
              }}
              inputMode="numeric"
              maxLength={11}
              placeholder="09123456789"
            />
          </Field>

          <Field label="Gender" error={errors.gender?.message}>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={GENDER_OPTIONS}
                  defaultValue="male"
                />
              )}
            />
          </Field>

          <Field label="Birth Date" error={errors.dob?.message}>
            <TextInput type="date" {...register("dob")} />
          </Field>

          <Field label="Address" full={!isEdit} error={errors.address?.message}>
            <TextInput {...register("address")} placeholder="Street, City" />
          </Field>

          {isEdit && (
            <Field label="Status" error={errors.status?.message}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FullSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={STATUS_OPTIONS}
                  />
                )}
              />
            </Field>
          )}

          {!isFar && (
            <Field label="Association" full error={errors.association?.message}>
              <Controller
                name="association"
                control={control}
                render={({ field }) => (
                  <SingleSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={associationOptions}
                    placeholder="Select association…"
                    searchPlaceholder="Search association…"
                  />
                )}
              />
            </Field>
          )}

          <Field label="Position" full error={errors.position?.message}>
            <Controller
              name="position"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={POSITION_OPTIONS}
                  defaultValue="member"
                />
              )}
            />
          </Field>

          <Field label="Profile Image" full error={errors.profileImage?.message}>
            <Controller
              name="profileImage"
              control={control}
              render={({ field }) => (
                <FileUploader value={field.value} onChange={field.onChange} accept="image/*" multiple={false} />
              )}
            />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
````

### frontend/src/components/modal/FarmerDrawer.jsx

````jsx
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
  FileText,
} from "lucide-react";
import { fmtDate } from "@/utils/format";

// Attachments are { url, publicId, resourceType } objects — derive a
// readable name from the url for display.
function fileNameFromUrl(url) {
  try {
    const clean = url.split("?")[0];
    return decodeURIComponent(clean.split("/").pop() || url);
  } catch {
    return url;
  }
}

export function FarmerDrawer({ row, onClose }) {
  const attachments = row.attachments || [];

  const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  const farmItems = (row.farms || []).map((f) => `${f.tag} · ${f.address}`);
  const livestockItems = (row.livestock || []).map(
    (l) =>
      `${l.propertyNumber} · ${l.animal} (${l.breed}) — ${capitalize(l.condition)}`,
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
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-accent-soft rounded-full font-display text-base text-accent">
                {row.profileImage?.url ? (
                  <img src={row.profileImage.url} alt={row.fullName} className="h-12 w-12 rounded-full" />
                ) : row.fullName?.[0]}
              </div>
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

          <Section icon={FileText} title="Uploaded Files">
            {attachments.length > 0 ? (
              <ul className="space-y-2">
                {attachments.map((a) => (
                  <li
                    key={a.publicId}
                    className="flex items-center gap-3 border border-border bg-muted-30 px-3 py-2"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center bg-surface text-secondary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm font-medium text-foreground hover:underline"
                      >
                        {fileNameFromUrl(a.url)}
                      </a>
                    </div>

                    <a
                      href={a.url}
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
````

### frontend/src/components/modal/AssociationModal.jsx

````jsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, TextInput } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import {
  associationFormSchema,
  associationUpdateSchema,
} from "@/schemas/association.schema";

export function AssociationModal({
  mode,
  initial,
  submitError,
  busy,
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      isEdit ? associationUpdateSchema : associationFormSchema,
    ),
    defaultValues: {
      name: initial?.name ?? "",
      municipality: initial?.municipality ?? "",
      barangay: initial?.barangay ?? "",
    },
  });

  const onSubmit = (values) => {
    onSave(values);
  };

  return (
    <ModalShell
      eyebrow="Association"
      title={mode === "add" ? "Add New Association" : `Edit ${initial.name}`}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="accent"
            type="submit"
            form="association-form"
            disabled={busy}
          >
            {busy
              ? "Saving…"
              : mode === "add"
                ? "Add Association"
                : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="association-form" onSubmit={handleSubmit(onSubmit)}>
        {submitError && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <Field label="Association Name" error={errors.name?.message}>
          <TextInput
            autoFocus
            {...register("name")}
            placeholder="e.g. Boac, Marinduque"
          />
        </Field>
        <Field label="Municipality" error={errors.municipality?.message || (submitError?.includes("municipality and barangay") ? submitError : undefined)}>
          <TextInput {...register("municipality")} placeholder="Municipality" />
        </Field>
        <Field label="Barangay" error={errors.barangay?.message}>
          <TextInput {...register("barangay")} placeholder="Barangay" />
        </Field>
      </form>
    </ModalShell>
  );
}
````

### frontend/src/components/modal/ReviewConfirmModal.jsx

````jsx
import { useState } from "react";
import { AlertTriangle, PackageCheck } from "lucide-react";
import { Button, Field } from "@/components/ui";
import { denyRemarksSchema } from "@/schemas/request.schema";

const VARIANTS = {
  approve: {
    icon: AlertTriangle,
    iconClass: "bg-success/10 text-success",
    title: "Approve Request?",
    verb: "approved",
    buttonVariant: "accent",
    buttonLabel: "Confirm Approve",
  },
  deny: {
    icon: AlertTriangle,
    iconClass: "bg-danger-10 text-danger",
    title: "Deny Request?",
    verb: "rejected",
    buttonVariant: "danger",
    buttonLabel: "Confirm Deny",
  },
  release: {
    icon: PackageCheck,
    iconClass: "bg-success/10 text-success",
    title: "Release Items?",
    verb: "released",
    buttonVariant: "accent",
    buttonLabel: "Confirm Release",
  },
};

export function ReviewConfirmModal({ row, action, onCancel, onConfirm, busy, submitError }) {
  const variant = VARIANTS[action] ?? VARIANTS.approve;
  const Icon = variant.icon;
  const isDeny = action === "deny";

  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState(null);

  const handleConfirm = () => {
    if (!isDeny) {
      onConfirm();
      return;
    }

    const result = denyRemarksSchema.safeParse({ remarks });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Remarks are required");
      return;
    }

    setError(null);
    onConfirm(result.data.remarks);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-surface border border-border shadow-xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`mx-auto mb-4 grid h-12 w-12 place-items-center ${variant.iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg tracking-tight text-foreground mb-1">
          {variant.title}
        </h3>
        <p className="text-sm text-secondary mb-4">
          Mark <strong className="text-foreground">{row.title}</strong> as{" "}
          {variant.verb}?
        </p>

        {isDeny && (
          <div className="mb-4 text-left">
            <Field label="Reason for denial" error={error}>
              <textarea
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g., Out of Stock"
                rows={3}
                className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground resize-y"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              {["Out of Stock", "Item Under Maintenance", "Incomplete Requirements", "Not Eligible"].map((reason) => (
                <Button key={reason} type="button" variant="outline" onClick={() => { setRemarks(reason); setError(null); }}>
                  {reason}
                </Button>
              ))}
            </div>
          </div>
        )}

        {submitError && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</p>}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant={variant.buttonVariant} onClick={handleConfirm} disabled={busy}>
            {variant.buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
````

### frontend/src/components/public/FileUploader.jsx

````jsx
import { fmtBytes } from "@/utils/format";
import { Upload, FileText, Eye, X } from "lucide-react";
import { useEffect, useRef } from "react";

function fileNameFromUrl(url) {
  try {
    const clean = url.split("?")[0];
    return decodeURIComponent(clean.split("/").pop() || url);
  } catch {
    return url;
  }
}

function FileRow({ name, url, onView, onRemove }) {
  return (
    <li className="flex items-center gap-3 border border-border bg-surface px-3 py-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center bg-muted text-secondary">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {name}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="grid h-7 w-7 shrink-0 place-items-center text-secondary hover:bg-muted hover:text-foreground"
        aria-label="View file"
      >
        <Eye className="h-3.5 w-3.5" />
      </a>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-7 w-7 shrink-0 place-items-center text-secondary hover:bg-muted hover:text-foreground"
        aria-label="Remove file"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function UploadingRow({ name, size, progress, onRemove }) {
  return (
    <li className="flex items-center gap-3 border border-border bg-surface px-3 py-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center bg-muted text-secondary">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {name}
          </span>
          <span className="shrink-0 text-xs text-secondary">
            {fmtBytes(size)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-muted">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs text-secondary">
            {progress}%
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-7 w-7 shrink-0 place-items-center text-secondary hover:bg-muted hover:text-foreground"
        aria-label="Remove file"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

export function FileUploader({ value = [], onChange, accept, multiple = true }) {
  const files = Array.isArray(value) ? value : [];
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const setFiles = (updater) =>
    onChange(
      typeof updater === "function" ? updater(filesRef.current) : updater,
    );

  const inputRef = useRef(null);

  const startUpload = (id) => {
    const tick = () => {
      let stillRunning = false;
      setFiles((prev) => {
        const next = prev.map((f) => {
          if (typeof f === "string" || f.id !== id || f.progress >= 100)
            return f;
          const inc = Math.floor(Math.random() * 18) + 7;
          const np = Math.min(100, f.progress + inc);
          if (np < 100) stillRunning = true;
          return {
            ...f,
            progress: np,
            status: np >= 100 ? "done" : "uploading",
          };
        });
        return next;
      });
      if (stillRunning) setTimeout(tick, 250);
    };
    setTimeout(tick, 200);
  };

  const onPick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const mapped = picked.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      file: f,
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
      progress: 0,
      status: "uploading",
    }));
    setFiles((prev) => multiple ? [...prev, ...mapped] : mapped.slice(0, 1));
    mapped.forEach((m) => startUpload(m.id));
    e.target.value = "";
  };

  const remove = (idOrUrl) => {
    setFiles((prev) =>
      prev.filter((f) =>
        typeof f === "string" ? f !== idOrUrl : (f.id ?? f.url) !== idOrUrl,
      ),
    );
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-1.5 border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-secondary hover:border-foreground-40 hover:bg-muted-40"
      >
        <Upload className="h-5 w-5" />
        <span className="font-medium text-foreground">
          {multiple ? "Click to upload files" : "Click to upload image"}
        </span>
        <span className="text-xs">{multiple ? "You can select multiple files" : "You can select one image"}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={onPick}
      />
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => {
            if (typeof f === "string") {
              return (
                <FileRow
                  key={f}
                  name={fileNameFromUrl(f)}
                  url={f}
                  onRemove={() => remove(f)}
                />
              );
            }
            if (f.status === "uploading") {
              return (
                <UploadingRow
                  key={f.id}
                  name={f.name}
                  size={f.size}
                  progress={f.progress}
                  onRemove={() => remove(f.id)}
                />
              );
            }
            return (
              <FileRow
                key={f.id ?? f.url}
                name={f.name || fileNameFromUrl(f.url)}
                url={f.url}
                onRemove={() => remove(f.id ?? f.url)}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
````

### frontend/src/hooks/useFarmers.js

````js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getFarmers,
    getFarmersByAssociationId,
    getCropsByFarmerId,
    createFarmer,
    updateFarmer,
    deleteFarmer,
} from "@/services/farmer.service";
import { uploadToCloudinary } from "@/services/upload.service";

/* ---------------- Query Keys ---------------- */
export const farmerKeys = {
    all: ["farmers"],
    lists: () => [...farmerKeys.all, "list"],
    list: (filters) => [...farmerKeys.lists(), filters],
    details: () => [...farmerKeys.all, "detail"],
    detail: (id) => [...farmerKeys.details(), id],
    byAssociation: (associationId) => [...farmerKeys.all, "byAssociation", associationId],
    crops: (farmerId) => [...farmerKeys.all, "crops", farmerId],
};

/* ---------------- Shared: files -> attachments ---------------- */
async function resolveAttachments(files = []) {
    const existingAttachments = files.filter(
        (f) => f && typeof f === "object" && !(f?.file instanceof File),
    );
    const newFiles = files.filter((f) => f?.file instanceof File);

    if (!newFiles.length) return existingAttachments;

    const uploads = await Promise.all(
        newFiles.map((f) => uploadToCloudinary(f.file, "farmer"))
    );

    return [
        ...existingAttachments,
        ...uploads.map((u) => ({
            url: u.secure_url,
            publicId: u.public_id,
            resourceType: u.resource_type,
        })),
    ];
}

/* ---------------- Queries ---------------- */
export function useFarmers(filters = {}, options = {}) {
    return useQuery({
        queryKey: farmerKeys.list(filters),
        queryFn: () => getFarmers(filters),
        keepPreviousData: true,
        ...options,
    });
}

export function useFarmersByAssociationId(associationId, options = {}) {
    return useQuery({
        queryKey: farmerKeys.byAssociation(associationId),
        queryFn: () => getFarmersByAssociationId(associationId),
        enabled: !!associationId,
        ...options,
    });
}

export function useCropsByFarmerId(farmerId, options = {}) {
    return useQuery({
        queryKey: farmerKeys.crops(farmerId),
        queryFn: () => getCropsByFarmerId(farmerId),
        enabled: !!farmerId,
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
export function useCreateFarmer(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ profileImage, ...formValues }) => {
            const images = await resolveAttachments(profileImage);
            return createFarmer({ ...formValues, profileImage: images[0] ?? null });
        },
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateFarmer(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, profileImage, ...formValues }) => {
            const images = profileImage === undefined ? undefined : await resolveAttachments(profileImage);
            return updateFarmer(id, { ...formValues, ...(images ? { profileImage: images[0] ?? null } : {}) });
        },
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: farmerKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useDeleteFarmer(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteFarmer(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
            queryClient.removeQueries({ queryKey: farmerKeys.detail(variables) });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}
````

### frontend/src/pages/public/AssociationsPage.jsx

````jsx
import { useState } from "react";
import { Plus } from "lucide-react";

import { PageHeader, DataTable, RowActions } from "@/components/public";
import { Button } from "@/components/ui";
import {
  AssociationDrawer,
  DeleteConfirmModal,
  AssociationModal,
} from "@/components/modal";

import {
  useAssociations,
  useCreateAssociation,
  useUpdateAssociation,
  useDeleteAssociation,
} from "@/hooks/useAssociations";

/* ---------------- Page ---------------- */
export function AssociationsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const filters = {
    page,
    limit,
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError, error } = useAssociations(filters, {
    keepPreviousData: true,
  });

  const rows = data?.associations ?? [];
  const pagination = data?.pagination;

  const createMutation = useCreateAssociation({
    onSuccess: () => setModal(null),
  });
  const updateMutation = useUpdateAssociation({
    onSuccess: () => setModal(null),
  });
  const deleteMutation = useDeleteAssociation({
    onSuccess: () => {
      setConfirmDelete(null);
      setDeleteError(null);
    },
    onError: (err) => {
      setDeleteError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to delete association",
      );
    },
  });

  const busy = createMutation.isPending || updateMutation.isPending;

  const openAdd = () => setModal({ mode: "add" });
  const openEdit = (row) => setModal({ mode: "edit", data: { ...row } });
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => {
    setDeleteError(null);
    setConfirmDelete(row);
  };

  const confirmRemove = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete._id);
  };

  const handleSave = (values) => {
    const payload = { name: values.name, municipality: values.municipality, barangay: values.barangay };

    if (modal.mode === "edit") {
      updateMutation.mutate({ id: modal.data._id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleSearchChange = (value) => {
    setPage(1);
    setSearch(value);
  };

  return (
    <div>
      <PageHeader
        title="Associations"
        subtitle="Farmer associations registered in the system."
        action={
          <Button variant="accent" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Association
          </Button>
        }
      />

      {isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load associations"}
        </div>
      )}

      <DataTable
        searchPlaceholder="Search association…"
        search={search}
        onSearchChange={handleSearchChange}
        loading={isLoading}
        data={rows}
        pagination={
          pagination
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                onPageChange: setPage,
              }
            : undefined
        }
        columns={[
          {
            key: "name",
            header: "Association Name",
            cell: (r) => (
              <div className="font-semibold text-foreground">{r.name}</div>
            ),
          },
          {
            key: "far",
            header: "Farmers Representative",
            cell: (r) => r.far || "—",
          },
          {
            key: "membersCount",
            header: "Members",
            cell: (r) => r.members?.length ?? 0,
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => (
              <RowActions
                onView={() => openView(r)}
                onEdit={() => openEdit(r)}
                onDelete={() => askDelete(r)}
              />
            ),
          },
        ]}
      />

      {modal && (
        <AssociationModal
          mode={modal.mode}
          initial={modal.data}
          busy={busy}
          submitError={
            createMutation.error?.response?.data?.message ||
            createMutation.error?.message ||
            updateMutation.error?.response?.data?.message ||
            updateMutation.error?.message
          }
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && (
        <AssociationDrawer row={drawer} onClose={() => setDrawer(null)} />
      )}
      {confirmDelete && (
        <DeleteConfirmModal
          id={confirmDelete._id}
          name={confirmDelete.name}
          error={deleteError}
          busy={deleteMutation.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
````

## 4. Tables, Filters & Display

- Added a server-side association filter to FarmersPage, hidden for FAR. Reports toolbar order is Search, Status, Type, Severity, Date. The date TextInput uses the same responsive width pattern as Select so it stays beside the other filters when space permits; the type default reads All type.
- Added Pending For for pending requests using fmtPendingSince. Other statuses display an em dash. Request item options show names/types rather than property numbers.
- Added Mortality with Alive or Deceased (date); deceasedAt is set on entering deceased and cleared on recovery. Historical missing dates are displayed as Date unknown rather than invented.
- Clicking Export Report on AnalyticsPage opens ModalShell with All, Equipment, Livestock, and Crop icon-and-label Buttons. Picking a category advances to Excel/PDF format Buttons; Back/Cancel are supported, success closes the modal, and errors allow retry. The earlier standalone export selector is removed.
- The chosen category and format use the existing analytics download helpers/backend section parameter, retaining period/association filters. Crop maps to the existing farm section. Section-level Generate Detailed Report dropdowns are unchanged.
- Removed the mistakenly added ReportsPage export UI, frontend download helper, report export routes/controllers, data helper, and report-specific PDF/XLSX generators. ReportsPage retains its requested type/date/severity filters. Previously edited files restored to their original logic are included below for completeness.

### frontend/src/pages/public/FarmersPage.jsx

````jsx
import { useState } from "react";
import { Plus } from "lucide-react";

import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import {
  FarmerDrawer,
  FarmerModal,
  DeleteConfirmModal,
} from "@/components/modal";
import { Button } from "@/components/ui";

import { statusTone, positionLabel } from "@/constants/data";
import { usePermissions } from "@/constants/permissions";
import { useFarmers, useDeleteFarmer } from "@/hooks/useFarmers";
import { useAssociations } from "@/hooks/useAssociations";
import useAuth from "@/hooks/useAuth";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const blankForm = {
  id: "",
  lastName: "",
  firstName: "",
  middleName: "",
  contact: "",
  email: "",
  gender: "male",
  dob: "",
  address: "",
  association: "",
  position: "member",
  farms: [],
  livestock: [],
  equipment: [],
  profileImage: [],
};

/* ---------------- Page ---------------- */
export function FarmersPage() {
  const can = usePermissions("farmers");
  const { role } = useAuth();
  const [associationId, setAssociationId] = useState("");
  const { data: associationsData } = useAssociations({ all: true }, { enabled: role !== "far" });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const filters = {
    page,
    limit,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
    ...(role !== "far" && associationId ? { associationId } : {}),
  };

  const { data, isLoading, isError, error } = useFarmers(filters);
  const rows = data?.farmers ?? [];
  const pagination = data?.pagination;

  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const { mutate: deleteFarmerMutate, isPending: isDeleting } = useDeleteFarmer(
    {
      onSuccess: () => {
        setConfirmDelete(null);
        setDeleteError(null);
      },
      onError: (err) => {
        setDeleteError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to delete farmer",
        );
      },
    },
  );

  const openAdd = () => {
    if (!can.add) return;
    setModal({ mode: "add", data: { ...blankForm } });
  };
  const openEdit = (row) => {
    if (!can.edit) return;
    setModal({
      mode: "edit",
      data: {
        id: row._id,
        lastName: row.lastName,
        firstName: row.firstName,
        middleName: row.middleName || "",
        contact: row.contactNumber,
        email: row.emailAddress,
        gender: row.gender,
        dob: row.birthDate?.slice ? row.birthDate.slice(0, 10) : row.birthDate,
        address: row.address,
        // association comes back populated ({ _id, name }) from the list
        // endpoints; unwrap to the id for the form's <select>.
        association: row.association?._id ?? row.association ?? "",
        position: row.position,
        status: row.status,
        profileImage: row.profileImage ? [row.profileImage] : [],
        farms: row.farms || [],
        livestock: row.livestock || [],
        equipment: row.equipment || [],
        user: row.user,
      },
    });
  };
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => {
    if (!can.delete) return;
    setDeleteError(null);
    setConfirmDelete(row);
  };
  const confirmRemove = () => {
    if (!confirmDelete || !can.delete) return;
    deleteFarmerMutate(confirmDelete._id);
  };

  return (
    <div>
      <PageHeader
        title="Farmers"
        subtitle="All registered farmers and their portfolio."
        action={
          can.add ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Farmer
            </Button>
          ) : null
        }
      />

      {isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load farmers"}
        </div>
      )}

      <DataTable
        searchPlaceholder="Search farmer by name..."
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        loading={isLoading}
        data={rows}
        filters={[
          ...(role !== "far" ? [{
            key: "association",
            label: "Associations",
            options: (associationsData?.associations ?? []).map((a) => ({ value: a._id, label: a.name })),
            value: associationId,
            onChange: (v) => { setPage(1); setAssociationId(v); },
          }] : []),
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            value: status,
            onChange: (v) => {
              setPage(1);
              setStatus(v);
            },
          },
        ]}
        pagination={
          pagination
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                onPageChange: setPage,
              }
            : undefined
        }
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (r) => (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center bg-accent-soft font-display text-xs text-accent rounded-full">
                  {r.fullName?.[0]}
                </div>
                <div className="font-semibold text-foreground">
                  {r.fullName}
                </div>
              </div>
            ),
          },
          {
            key: "association",
            header: "Association",
            cell: (r) => (
              <span className="text-sm text-foreground">
                {r.association?.name || "—"}
              </span>
            ),
          },
          {
            key: "farms",
            header: "Farms",
            cell: (r) => (r.farms || []).length,
          },
          {
            key: "livestock",
            header: "Livestock",
            cell: (r) => (r.livestock || []).length,
          },
          {
            key: "equipment",
            header: "Equipment",
            cell: (r) => (r.equipment || []).length,
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => (
              <StatusPill tone={statusTone[r.status]}>{r.status}</StatusPill>
            ),
          },
          {
            key: "position",
            header: "Position",
            cell: (r) => (
              <span className="text-sm font-medium text-foreground">
                {positionLabel[r.position] || "—"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => (
              <RowActions
                onView={() => openView(r)}
                onEdit={can.edit ? () => openEdit(r) : undefined}
                onDelete={can.delete ? () => askDelete(r) : undefined}
              />
            ),
          },
        ]}
      />

      {modal && (can.add || can.edit) && (
        <FarmerModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={() => setModal(null)}
        />
      )}
      {drawer && <FarmerDrawer row={drawer} onClose={() => setDrawer(null)} />}
      {confirmDelete && can.delete && (
        <DeleteConfirmModal
          id={confirmDelete._id}
          name={confirmDelete.fullName}
          error={deleteError}
          busy={isDeleting}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
````

### frontend/src/pages/public/ReportsPage.jsx

````jsx
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, TextInput } from "@/components/ui";
import { typeLabel, typeTone, sevTone, sevLabel, SEVERITY_OPTIONS } from "@/constants/data";
import { usePermissions } from "@/constants/permissions";
import {
  DeleteConfirmModal,
  ReportDrawer,
  ReportModal,
  ReviewConfirmModal,
} from "@/components/modal";
import {
  getReviewerRole,
  getReportStatus,
  statusTone,
  statusLabel,
  REPORT_STATUS_OPTIONS,
} from "@/utils/report";
import {
  useReports,
  useUpdateReportApproval,
  useDeleteReport,
} from "@/hooks/useReports";
import useAuth from "@/hooks/useAuth";

const REPORT_TYPE_OPTIONS = [
  { value: "farm", label: "Crop" },
  { value: "equipment", label: "Equipment" },
  { value: "livestock", label: "Livestock" },
];

export function ReportsPage() {
  const can = usePermissions("reports");
  const { role } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [entityType, setEntityType] = useState("");
  const [date, setDate] = useState("");
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [reviewRow, setReviewRow] = useState(null); // { row, action: "approve" | "deny" }

  // Debounce search input -> search query param
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, status, entityType, date, severity]);

  const { data, isLoading } = useReports({
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    entityType: entityType || undefined,
    date: date || undefined,
    timezoneOffset: date ? new Date(`${date}T00:00:00`).getTimezoneOffset() : undefined,
    severity: severity || undefined,
  });

  const rows = data?.reports ?? [];
  const pagination = data?.pagination;

  const { mutate: submitApproval, isPending: isReviewing, error: reviewError, reset: resetReview } = useUpdateReportApproval({
    onSuccess: () => { setReviewRow(null); setDrawer(null); },
  });
  const { mutate: removeReport } = useDeleteReport({
    onSuccess: () => setConfirmDelete(null),
  });

  const openAdd = () => {
    if (!can.add) return;
    setModal({ mode: "add", data: null });
  };
  const openEdit = (row) => {
    if (!can.edit) return;
    setModal({ mode: "edit", data: row });
  };
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => {
    if (!can.delete) return;
    setConfirmDelete(row);
  };
  const confirmRemove = () => {
    if (!confirmDelete) return;
    removeReport(confirmDelete._id);
  };

  const askApprove = (row) => { resetReview(); setReviewRow({ row, action: "approve" }); };
  const askDeny = (row) => { resetReview(); setReviewRow({ row, action: "deny" }); };

  const confirmReview = (remarks) => {
    if (!reviewRow) return;

    submitApproval({
      id: reviewRow.row._id,
      status: reviewRow.action === "approve" ? "approved" : "denied",
      ...(remarks ? { remarks } : {}),
    });
  };

  // ReportModal owns its own create/update mutations internally (mirrors
  // RequestModal), so this just closes the modal once it reports success.
  const handleSave = () => {
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Field reports across crops, equipment, and livestock."
        action={
          can.add ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Report
            </Button>
          ) : null
        }
      />
      <DataTable
        loading={isLoading}
        data={rows}
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search report…"
        rightAction={
          <div className="w-full sm:w-44">
            <TextInput type="date" aria-label="Report date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        }
        filters={[
          {
            key: "status",
            label: "Status",
            options: REPORT_STATUS_OPTIONS,
            value: status,
            onChange: setStatus,
          },
          { key: "entityType", label: "Type", allLabel: "All type", options: REPORT_TYPE_OPTIONS, value: entityType, onChange: setEntityType },
          { key: "severity", label: "Severity", options: SEVERITY_OPTIONS, value: severity, onChange: setSeverity },
        ]}
        pagination={
          pagination
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                onPageChange: setPage,
              }
            : undefined
        }
        columns={[
          {
            key: "title",
            header: "Title",
            cell: (r) => (
              <div className="font-semibold text-foreground">{r.title}</div>
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: (r) => (
              <StatusPill tone={typeTone[r.entityType]}>
                {typeLabel[r.entityType] ?? r.entityType}
              </StatusPill>
            ),
          },
          {
            key: "quantity",
            header: "Items",
            cell: (r) => r.items?.length ?? r.itemIds?.length ?? 0,
          },
          {
            key: "condition",
            header: "Condition",
            cell: (r) => r.condition ?? "—",
          },
          {
            key: "severity",
            header: "Severity",
            cell: (r) => (
              <StatusPill tone={sevTone[r.severity]}>
                {sevLabel[r.severity]}
              </StatusPill>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => {
              const displayStatus = getReportStatus(r);
              return (
                <StatusPill tone={statusTone[displayStatus]}>
                  {statusLabel[displayStatus]}
                </StatusPill>
              );
            },
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => {
              const reviewerRole = getReviewerRole(r);
              const reportStatus = getReportStatus(r);

              const canReviewThis =
                can.review &&
                reviewerRole &&
                role === reviewerRole &&
                reportStatus === "pending";

              const canEditThis = can.edit && reportStatus === "pending";
              const canDeleteThis = can.delete && reportStatus === "pending";

              return (
                <RowActions
                  onView={() => openView(r)}
                  onEdit={canEditThis ? () => openEdit(r) : undefined}
                  onDelete={canDeleteThis ? () => askDelete(r) : undefined}
                  onApprove={canReviewThis ? () => askApprove(r) : undefined}
                  onDeny={canReviewThis ? () => askDeny(r) : undefined}
                />
              );
            },
          },
        ]}
      />

      {modal && (can.add || can.edit) && (
        <ReportModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && <ReportDrawer row={drawer} onClose={() => setDrawer(null)}
        onApprove={can.review && role === getReviewerRole(drawer) && getReportStatus(drawer) === "pending" ? () => askApprove(drawer) : undefined}
        onDeny={can.review && role === getReviewerRole(drawer) && getReportStatus(drawer) === "pending" ? () => askDeny(drawer) : undefined}
      />}
      {confirmDelete && can.delete && (
        <DeleteConfirmModal
          id={confirmDelete._id}
          title={confirmDelete.title}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
      {reviewRow && can.review && (
        <ReviewConfirmModal
          row={reviewRow.row}
          action={reviewRow.action}
          onCancel={() => setReviewRow(null)}
          onConfirm={confirmReview}
          busy={isReviewing}
          submitError={reviewError?.response?.data?.message}
        />
      )}
    </div>
  );
}
````

### frontend/src/pages/public/RequestsPage.jsx

````jsx
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button } from "@/components/ui";
import { typeLabel, typeTone, sevTone, sevLabel } from "@/constants/data";
import { usePermissions } from "@/constants/permissions";
import {
  DeleteConfirmModal,
  RequestDrawer,
  RequestModal,
  ReviewConfirmModal,
} from "@/components/modal";
import {
  getCurrentStage,
  getDisplayStatus,
  isFullyApproved,
  statusTone,
  statusLabel,
  releaseStatusTone,
  releaseStatusLabel,
  REQUEST_STATUS_OPTIONS,
} from "@/utils/request";
import {
  useUpdateRequestApproval,
  useReleaseRequest,
  useDeleteRequest,
  useRequests,
} from "@/hooks/useRequests";
import useAuth from "@/hooks/useAuth";
import { fmtPendingSince } from "@/utils/format";

export function RequestsPage() {
  const can = usePermissions("requests");
  const { role } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [reviewRow, setReviewRow] = useState(null); // { row, action: "approve" | "deny" | "release" }

  // Debounce search input -> search query param
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const { data, isLoading } = useRequests({
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
  });

  const rows = data?.requests ?? [];
  const pagination = data?.pagination;

  const { mutate: submitApproval, isPending: isReviewing, error: reviewError, reset: resetReview } = useUpdateRequestApproval({
    onSuccess: () => { setReviewRow(null); setDrawer(null); },
  });
  const { mutate: submitRelease, isPending: isReleasing, error: releaseError, reset: resetRelease } = useReleaseRequest({
    onSuccess: () => setReviewRow(null),
  });
  const { mutate: removeRequest } = useDeleteRequest({
    onSuccess: () => setConfirmDelete(null),
  });

  const openAdd = () => {
    if (!can.add) return;
    setModal({ mode: "add", data: null });
  };
  const openEdit = (row) => {
    if (!can.edit) return;
    setModal({ mode: "edit", data: row });
  };
  const openView = (row) => setDrawer(row);
  const askDelete = (row) => {
    if (!can.delete) return;
    setConfirmDelete(row);
  };
  const confirmRemove = () => {
    if (!confirmDelete) return;
    removeRequest(confirmDelete._id);
  };

  const askApprove = (row) => { resetReview(); setReviewRow({ row, action: "approve" }); };
  const askDeny = (row) => { resetReview(); setReviewRow({ row, action: "deny" }); };
  const askRelease = (row) => { resetRelease(); setReviewRow({ row, action: "release" }); };

  const confirmReview = (remarks) => {
    if (!reviewRow) return;

    if (reviewRow.action === "release") {
      submitRelease(reviewRow.row._id);
      return;
    }

    submitApproval({
      id: reviewRow.row._id,
      status: reviewRow.action === "approve" ? "approved" : "denied",
      ...(remarks ? { remarks } : {}),
    });
  };

  // RequestModal owns its own create/update mutations internally (mirrors
  // FarmerModal), so this just closes the modal once it reports success.
  const handleSave = () => {
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Requests"
        subtitle="Resource requests across equipment and livestock."
        action={
          can.add ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Request
            </Button>
          ) : null
        }
      />
      <DataTable
        loading={isLoading}
        data={rows}
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search request…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: REQUEST_STATUS_OPTIONS,
            value: status,
            onChange: setStatus,
          },
        ]}
        pagination={
          pagination
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                onPageChange: setPage,
              }
            : undefined
        }
        columns={[
          {
            key: "title",
            header: "Title",
            cell: (r) => (
              <div className="font-semibold text-foreground">{r.title}</div>
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: (r) => (
              <StatusPill tone={typeTone[r.entityType]}>
                {typeLabel[r.entityType]}
              </StatusPill>
            ),
          },
          {
            key: "quantity",
            header: "Quantity",
            cell: (r) => r.entities?.length ?? r.entityIds?.length ?? 0,
          },
          {
            key: "severity",
            header: "Severity",
            cell: (r) => (
              <StatusPill tone={sevTone[r.severity]}>
                {sevLabel[r.severity]}
              </StatusPill>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => {
              const displayStatus = getDisplayStatus(r);
              return (
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusPill tone={statusTone[displayStatus]}>
                    {statusLabel[displayStatus]}
                  </StatusPill>
                  {displayStatus === "approved" && (
                    <StatusPill tone={releaseStatusTone[r.releaseStatus]}>
                      {releaseStatusLabel[r.releaseStatus]}
                    </StatusPill>
                  )}
                </div>
              );
            },
          },
          {
            key: "pendingFor",
            header: "Pending For",
            cell: (r) => getDisplayStatus(r) === "pending" ? fmtPendingSince(r.createdAt) : "—",
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) => {
              const currentStage = getCurrentStage(r);
              const canReviewThis =
                can.review && currentStage && role === currentStage && getDisplayStatus(r) === "pending";
              const coordinatorReviewed =
                r.approvalStatus?.coordinator?.status === "approved" ||
                r.approvalStatus?.coordinator?.status === "denied";
              const canEditThis = can.edit && !coordinatorReviewed;
              const canDeleteThis = can.delete && !coordinatorReviewed;

              const canReleaseThis =
                role === "coordinator" &&
                isFullyApproved(r) &&
                r.releaseStatus === "pending";

              return (
                <RowActions
                  onView={() => openView(r)}
                  onEdit={canEditThis ? () => openEdit(r) : undefined}
                  onDelete={canDeleteThis ? () => askDelete(r) : undefined}
                  onApprove={canReviewThis ? () => askApprove(r) : undefined}
                  onDeny={canReviewThis ? () => askDeny(r) : undefined}
                  onRelease={
                    canReleaseThis && !isReleasing
                      ? () => askRelease(r)
                      : undefined
                  }
                />
              );
            },
          },
        ]}
      />

      {modal && (can.add || can.edit) && (
        <RequestModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {drawer && <RequestDrawer row={drawer} onClose={() => setDrawer(null)}
        onApprove={can.review && role === getCurrentStage(drawer) && getDisplayStatus(drawer) === "pending" ? () => askApprove(drawer) : undefined}
        onDeny={can.review && role === getCurrentStage(drawer) && getDisplayStatus(drawer) === "pending" ? () => askDeny(drawer) : undefined}
      />}
      {confirmDelete && can.delete && (
        <DeleteConfirmModal
          id={confirmDelete._id}
          title={confirmDelete.title}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
      {reviewRow &&
        (reviewRow.action === "release"
          ? role === "coordinator"
          : can.review) && (
          <ReviewConfirmModal
            row={reviewRow.row}
            action={reviewRow.action}
            onCancel={() => setReviewRow(null)}
            onConfirm={confirmReview}
            busy={isReviewing || isReleasing}
            submitError={(reviewRow.action === "release" ? releaseError : reviewError)?.response?.data?.message}
          />
        )}
    </div>
  );
}
````

### frontend/src/pages/public/LivestocksPage.jsx

````jsx
import { useState } from "react";
import { Plus, Eye, UserPlus, HeartPulse } from "lucide-react";
import {
  PageHeader,
  DataTable,
  RowActions,
  StatusPill,
} from "@/components/public";
import { Button, IconButton } from "@/components/ui";

import {
  healthTone,
  STATUS_OPTIONS,
  LIVESTOCK_HEALTH_OPTIONS,
  statusTone,
} from "@/constants/data";
import {
  LivestockDrawer,
  AssignModal,
  StatusUpdateModal,
  DeleteConfirmModal,
  LivestockModal,
} from "@/components/modal";
import { usePermissions } from "@/constants/permissions";
import useAuth from "@/hooks/useAuth";
import {
  useLivestocks,
  useUpdateLivestock,
  useDeleteLivestock,
} from "@/hooks/useLivestocks";
import { useFarmersByAssociationId } from "@/hooks/useFarmers";
import { fmtDate } from "@/utils/format";

export function LivestocksPage() {
  const can = usePermissions("livestocks");
  const { role } = useAuth();

  // Coordinators/admins are the "managers": they add, edit (tag/animal/
  // breed/gender/dob/color/weight), and delete livestock via
  // LivestockModal + plain View/Edit/Delete actions.
  // FAR can only assign livestock to a farmer and update its health —
  // no add, no delete/return.
  const isManagerRole = role === "coordinator" || role === "admin";

  const [coordModal, setCoordModal] = useState(null); // { mode: 'add' | 'edit', data } — TODO: wire to create/update API
  const [assignRow, setAssignRow] = useState(null);
  const [statusRow, setStatusRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [drawer, setDrawer] = useState(null);

  const [search, setSearch] = useState("");
  const [health, setHealth] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const queryFilters = {
    page,
    limit,
    ...(search ? { search } : {}),
    // Local state/UI copy uses "health"; the backend query schema
    // (getLivestocksQuerySchema) only recognizes "condition" — translate
    // here at the request boundary, same pattern as LivestockModal.
    ...(health ? { condition: health } : {}),
    ...(status ? { status } : {}),
  };

  const { data, isLoading, isError, error } = useLivestocks(queryFilters);
  const rows = data?.livestocks ?? [];
  const pagination = data?.pagination;

  // Farmer options for the assign modal, scoped to the livestock's own
  // association. Only fires while a row is actually being assigned.
  const { data: farmersData, isLoading: farmersLoading } =
    useFarmersByAssociationId(
      assignRow?.association?._id ?? assignRow?.association,
    );
  const farmerOptions = (farmersData?.farmers ?? []).map((f) => ({
    value: f._id,
    label: f.fullName,
  }));

  const updateMutation = useUpdateLivestock({
    onSuccess: () => {
      setAssignRow(null);
      setStatusRow(null);
    },
    onError: (err) => console.error("Failed to update livestock:", err),
  });
  const deleteMutation = useDeleteLivestock({
    onSuccess: () => setDeleteRow(null),
    onError: (err) => console.error("Failed to delete livestock:", err),
  });

  const openAdd = () => {
    if (!can.add || !isManagerRole) return;
    setCoordModal({
      mode: "add",
      data: {
        id: "",
        propertyNumber: "",
        animal: "",
        breed: "",
        gender: "male",
        health: "healthy",
        dob: "",
        color: "",
        weight: "",
        farmer: "",
        associationId: "",
      },
    });
  };

  const openCoordEdit = (row) => {
    if (!can.edit || !isManagerRole) return;
    setCoordModal({
      mode: "edit",
      data: {
        _id: row._id,
        id: row.propertyNumber,
        propertyNumber: row.propertyNumber,
        animal: row.animal,
        breed: row.breed,
        gender: row.gender,
        health: row.condition,
        dob: row.birthDate,
        color: row.color,
        weight: row.weight,
        farmer: row.assignedFarmer?._id,
        associationId: row.association?._id ?? row.association,
        reservedBy: row.reservedBy || null,
      },
    });
  };

  const openAssign = (row) => {
    if (!can.edit) return;
    setAssignRow(row);
  };

  const openStatus = (row) => {
    if (!can.edit) return;
    setStatusRow(row);
  };

  const openDelete = (row) => {
    if (!can.delete || !isManagerRole) return;
    setDeleteRow(row);
  };

  // FAR: assign livestock to a farmer.
  const handleAssign = (farmerId) => {
    if (!assignRow || !can.edit) return;
    updateMutation.mutate({
      id: assignRow._id,
      assignedFarmer: farmerId,
      status: "assigned",
    });
  };

  // FAR: update livestock health.
  const handleStatusUpdate = (health) => {
    if (!statusRow || !can.edit) return;
    updateMutation.mutate({ id: statusRow._id, condition: health });
  };

  const handleDelete = () => {
    if (!deleteRow || !can.delete || !isManagerRole) return;
    deleteMutation.mutate(deleteRow._id);
  };

  return (
    <div>
      <PageHeader
        title="Livestock"
        subtitle="Animal welfare and livestock inventory management."
        action={
          can.add && isManagerRole ? (
            <Button variant="accent" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Livestock
            </Button>
          ) : null
        }
      />

      {isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load livestock"}
        </div>
      )}

      <DataTable
        searchPlaceholder="Search animal…"
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        data={rows}
        loading={isLoading}
        pagination={
          pagination
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                onPageChange: setPage,
              }
            : undefined
        }
        filters={[
          {
            key: "health",
            label: "Health",
            options: LIVESTOCK_HEALTH_OPTIONS,
            value: health,
            onChange: (v) => {
              setPage(1);
              setHealth(v);
            },
          },
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            value: status,
            onChange: (v) => {
              setPage(1);
              setStatus(v);
            },
          },
        ]}
        columns={[
          {
            key: "propertyNumber",
            header: "Property Number",
            cell: (r) => (
              <div className="flex items-center gap-6">
                <div>
                  <div className="font-semibold text-foreground">
                    {r.propertyNumber}
                  </div>
                  <div className="text-xs text-secondary">
                    {r.animal} · {r.breed}
                  </div>
                </div>
                {r.reservedBy && (
                  <StatusPill tone={statusTone.reserved} className="mt-1">
                    Reserved
                  </StatusPill>
                )}
              </div>
            ),
          },
          {
            key: "farmer",
            header: "Assigned Farmer",
            accessor: (r) => r.assignedFarmer?.fullName || "",
            cell: (r) => r.assignedFarmer?.fullName || "—",
          },
          {
            key: "health",
            header: "Health",
            cell: (r) => (
              <StatusPill tone={healthTone[r.condition]}>
                {r.condition}
              </StatusPill>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => (
              <StatusPill tone={statusTone[r.status]}>{r.status}</StatusPill>
            ),
          },
          {
            key: "mortality",
            header: "Mortality",
            cell: (r) => r.condition === "deceased" ? `Deceased (${r.deceasedAt ? fmtDate(r.deceasedAt) : "Date unknown"})` : "Alive",
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) =>
              isManagerRole ? (
                <RowActions
                  onView={() => setDrawer(r)}
                  onEdit={can.edit ? () => openCoordEdit(r) : undefined}
                  onDelete={can.delete ? () => openDelete(r) : undefined}
                />
              ) : (
                <div className="flex items-center justify-end gap-1">
                  <IconButton
                    icon={Eye}
                    label="View"
                    onClick={() => setDrawer(r)}
                  />
                  {can.edit && (
                    <IconButton
                      icon={UserPlus}
                      label="Assign"
                      onClick={() => openAssign(r)}
                    />
                  )}
                  {can.edit && (
                    <IconButton
                      icon={HeartPulse}
                      label="Update Health"
                      onClick={() => openStatus(r)}
                    />
                  )}
                </div>
              ),
          },
        ]}
      />

      {coordModal && isManagerRole && (
        <LivestockModal
          mode={coordModal.mode}
          initial={coordModal.data}
          onClose={() => setCoordModal(null)}
          onSave={() => setCoordModal(null)}
        />
      )}
      {assignRow && can.edit && !isManagerRole && (
        <AssignModal
          row={assignRow}
          options={farmerOptions}
          loading={farmersLoading}
          onClose={() => setAssignRow(null)}
          onSave={handleAssign}
        />
      )}
      {statusRow && can.edit && !isManagerRole && (
        <StatusUpdateModal
          row={statusRow}
          onClose={() => setStatusRow(null)}
          onSave={handleStatusUpdate}
          entityLabel="Livestock"
          fieldLabel="Health Status"
          statusField="condition"
          options={LIVESTOCK_HEALTH_OPTIONS}
        />
      )}
      {deleteRow && can.delete && isManagerRole && (
        <DeleteConfirmModal
          row={deleteRow}
          onCancel={() => setDeleteRow(null)}
          onConfirm={handleDelete}
        />
      )}
      {drawer && (
        <LivestockDrawer row={drawer} onClose={() => setDrawer(null)} />
      )}
    </div>
  );
}
````

### frontend/src/utils/format.js

````js
export function fmtDate(s) {
    if (!s) return "—";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function fmtBytes(b) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function fmtCoord(n, pos, neg) {
    const dir = n >= 0 ? pos : neg;
    return `${Math.abs(n).toFixed(4)}° ${dir}`;
}

export function fmtPendingSince(value, now = Date.now()) {
    const submitted = new Date(value).getTime();
    if (!value || !Number.isFinite(submitted)) return "—";
    const minutes = Math.max(0, Math.floor((now - submitted) / 60000));
    if (minutes < 1) return "just now";
    const hours = Math.floor(minutes / 60);
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
}
````

### frontend/src/components/modal/RequestModal.jsx

````jsx
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Field,
  FullSelect,
  MultiSelect,
  TextInput,
} from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { TYPE_OPTIONS, SEVERITY_OPTIONS } from "@/constants/data";
import {
  createRequestFormSchema,
  createRequestUpdateSchema,
} from "@/schemas/request.schema";
import { useCreateRequest, useUpdateRequest } from "@/hooks/useRequests";
import { useAvailableLivestocks } from "@/hooks/useLivestocks";
import { useAvailableEquipments } from "@/hooks/useEquipments";
import { assignmentReason } from "@/utils/assignment";

function toFormShape(request) {
  return {
    title: request.title,
    severity: request.severity,
    entityType: request.entityType,
    // entityIds comes back from the API as a plain array of id strings —
    // no unwrapping needed here (unlike FarmModal's assignedFarmers, which
    // is an array of {farmer, classification} objects).
    entityIds: request.entityIds ?? [],
    details: request.details,
  };
}

export function RequestModal({ mode, initial, onClose, onSave }) {
  const [submitError, setSubmitError] = useState(null);
  const isEdit = mode === "edit";
  const { data: livestockData } = useAvailableLivestocks();
  const { data: equipmentData } = useAvailableEquipments();

  const normalizedInitial = useMemo(
    () => (initial ? toFormShape(initial) : initial),
    [initial],
  );

  const resolver = useMemo(
    () =>
      zodResolver(
        (isEdit ? createRequestUpdateSchema() : createRequestFormSchema()).refine(
          (values) => !(values.entityIds ?? []).some((id) => {
            const type = values.entityType ?? normalizedInitial?.entityType;
            const items = type === "equipment" ? equipmentData?.equipments : livestockData?.livestocks;
            return !!assignmentReason(type, items?.find((item) => item._id === id)?.condition);
          }),
          { message: "Select only assignable items", path: ["entityIds"] },
        ),
      ),
    [isEdit, normalizedInitial, equipmentData, livestockData],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver,
    defaultValues: {
      severity: "medium",
      entityType: "equipment",
      entityIds: [],
      ...normalizedInitial,
    },
  });

  useEffect(() => {
    reset(
      {
        severity: "medium",
        entityType: "equipment",
        entityIds: [],
        ...normalizedInitial,
      },
      { keepDirty: false, keepDirtyValues: false },
    );
  }, [normalizedInitial, reset]);

  const entityType = watch("entityType");
  const entityIds = watch("entityIds") || [];

  const itemOptions =
    entityType === "equipment"
      ? (equipmentData?.equipments ?? []).map((e) => ({
          value: e._id,
          label: e.name + (assignmentReason("equipment", e.condition) ? ` — ${assignmentReason("equipment", e.condition)}` : ""),
          disabled: !!assignmentReason("equipment", e.condition),
          reason: assignmentReason("equipment", e.condition),
        }))
      : (livestockData?.livestocks ?? []).map((l) => ({
          value: l._id,
          label: l.animal + (assignmentReason("livestock", l.condition) ? ` — ${assignmentReason("livestock", l.condition)}` : ""),
          disabled: !!assignmentReason("livestock", l.condition),
          reason: assignmentReason("livestock", l.condition),
        }));

  // Switching type invalidates the previous selection since livestock and
  // equipment ids live in entirely different collections — a request can
  // only target one type, never both (see request.model.js).
  const onTypeChange = (v) => {
    setValue("entityType", v);
    setValue("entityIds", [], { shouldValidate: true });
  };

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateRequest({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateRequest({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      const payload = {
        title: values.title,
        severity: values.severity,
        entityType: values.entityType,
        entityIds: values.entityIds,
        details: values.details,
      };

      if (mode === "add") {
        const { request } = await createMutateAsync(payload);
        onSave?.(request);
      } else {
        const { request } = await updateMutateAsync({
          id: initial._id,
          ...payload,
        });
        onSave?.(request);
      }
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save request",
      );
    }
  };

  const busy = isCreating || isUpdating;

  return (
    <ModalShell
      eyebrow="Request"
      title={mode === "add" ? "Add New Request" : `Edit ${initial.title}`}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="accent"
            type="submit"
            form="request-form"
            disabled={busy}
          >
            {busy ? "Saving…" : mode === "add" ? "Add Request" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="request-form" onSubmit={handleSubmit(onSubmit)}>
        {submitError && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" full error={errors.title?.message}>
            <TextInput {...register("title")} placeholder="Short summary" />
          </Field>

          <Field label="Type" error={errors.entityType?.message}>
            <Controller
              name="entityType"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={onTypeChange}
                  options={TYPE_OPTIONS}
                />
              )}
            />
          </Field>

          <Field label="Severity" error={errors.severity?.message}>
            <Controller
              name="severity"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={SEVERITY_OPTIONS}
                  defaultValue="medium"
                />
              )}
            />
          </Field>

          <Field
            label={entityType === "equipment" ? "Equipment" : "Livestock"}
            full
            error={errors.entityIds?.message}
          >
            <Controller
              name="entityIds"
              control={control}
              render={() => (
                <MultiSelect
                  values={entityIds}
                  onChange={(next) =>
                    setValue("entityIds", next, { shouldValidate: true })
                  }
                  options={itemOptions}
                  placeholder={`Select ${entityType}…`}
                  searchPlaceholder={`Search ${entityType}…`}
                />
              )}
            />
          </Field>

          <Field label="Details" full error={errors.details?.message}>
            <textarea
              {...register("details")}
              placeholder="Describe the request…"
              rows={5}
              className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground resize-y"
            />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
````

### frontend/src/services/report.service.js

````js
import api from "@/api/axios";

export async function getReports(params) {
    const response = await api.get("/reports", { params });
    return response.data;
}

export async function createReport(data) {
    const response = await api.post("/reports", data);
    return response.data;
}

export async function updateReport(id, data) {
    const response = await api.patch(`/reports/${id}`, data);
    return response.data;
}

export async function updateReportApproval(id, data) {
    const response = await api.patch(`/reports/${id}/approval`, data);
    return response.data;
}

export async function deleteReport(id) {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
}
````

### backend/src/services/report.service.js

````js
import Report from "../models/report.model.js";
import Farm from "../models/farm.model.js";
import Crop from "../models/crop.model.js";
import Livestock from "../models/livestock.model.js";
import Equipment from "../models/equipment.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";
import emailQueue from "../queues/email.queue.js";
import { EMAIL_JOBS } from "../queues/email.jobs.js";

const STAGE_ROLES = ["aew", "coordinator"];

// entityType here describes what's being reported ON, not who submitted it.
// "farm" reports are actually about specific crops within a farm (parentId),
// so itemIds for that type resolve against Crop, not Farm.
const ENTITY_MODELS = {
    farm: Crop,
    livestock: Livestock,
    equipment: Equipment,
};

const ENTITY_SELECT = {
    farm: "name quantity",
    livestock: "propertyNumber animal",
    equipment: "propertyNumber name",
};

const ASSOCIATION_POPULATE = { path: "association", select: "name" };

async function populateEntities(reports) {
    const idsByType = { farm: new Set(), livestock: new Set(), equipment: new Set() };
    const farmIds = new Set();

    for (const r of reports) {
        if (idsByType[r.entityType]) {
            for (const id of r.itemIds) idsByType[r.entityType].add(String(id));
        }
        if (r.entityType === "farm" && r.parentId) farmIds.add(String(r.parentId));
    }

    const [cropDocs, livestockDocs, equipmentDocs, farmDocs] = await Promise.all([
        idsByType.farm.size
            ? Crop.find({ _id: { $in: [...idsByType.farm] } }).select(ENTITY_SELECT.farm).lean()
            : [],
        idsByType.livestock.size
            ? Livestock.find({ _id: { $in: [...idsByType.livestock] } }).select(ENTITY_SELECT.livestock).lean()
            : [],
        idsByType.equipment.size
            ? Equipment.find({ _id: { $in: [...idsByType.equipment] } }).select(ENTITY_SELECT.equipment).lean()
            : [],
        farmIds.size
            ? Farm.find({ _id: { $in: [...farmIds] } }).select("tag address").lean()
            : [],
    ]);

    const entityMap = new Map();
    for (const doc of [...cropDocs, ...livestockDocs, ...equipmentDocs]) {
        entityMap.set(String(doc._id), doc);
    }
    const farmMap = new Map(farmDocs.map((f) => [String(f._id), f]));

    return reports.map((r) => ({
        ...r,
        items: r.itemIds.map((id) => entityMap.get(String(id))).filter(Boolean),
        parent: r.parentId ? farmMap.get(String(r.parentId)) ?? null : null,
    }));
}

async function attachHistory(reports, associationId) {
    const reportIds = reports.map((r) => r._id);
    if (!reportIds.length) return [];

    const logsByReportId = await getLogsForEntities("report", reportIds, associationId);

    return reports.map((r) => {
        const key = r._id.toString();
        return {
            ...r,
            history: logsByReportId.get(key) ?? [],
        };
    });
}

const resolveFarAssociationId = async (userId) => {
    const association = await Association.findOne({
        user: userId,
        deletedAt: null,
    }).select("_id");
    return association ? String(association._id) : undefined;
};

// Resolves the association's assigned user so approval/denial emails have
// somewhere to go. Returns null (rather than throwing) when there's no
// association or no user email on file, so callers can just skip sending.
async function getAssociationRecipient(associationId) {
    if (!associationId) return null;

    const association = await Association.findById(associationId)
        .select("name user")
        .populate({ path: "user", select: "fullname email" });

    if (!association?.user?.email) return null;

    return {
        email: association.user.email,
        name: association.user.fullname || association.name || "there",
    };
}

function mapItemsForEmail(entityType, docs) {
    if (entityType === "farm") {
        return docs.map((doc) => ({
            label: doc.name,
            detail: doc.quantity != null ? `Qty: ${doc.quantity}` : "",
        }));
    }
    return docs.map((doc) => ({
        label: entityType === "livestock" ? doc.animal : doc.name,
        detail: doc.propertyNumber,
    }));
}

async function sendReportApprovedEmail(report, role) {
    const recipient = await getAssociationRecipient(report.association);
    if (!recipient) return;

    const EntityModel = ENTITY_MODELS[report.entityType];
    const itemDocs = await EntityModel.find({
        _id: { $in: report.itemIds },
    })
        .select(ENTITY_SELECT[report.entityType])
        .lean();

    await emailQueue.add(EMAIL_JOBS.REPORT_APPROVED, {
        type: EMAIL_JOBS.REPORT_APPROVED,
        data: {
            to: recipient.email,
            name: recipient.name,
            reportTitle: report.title,
            entityType: report.entityType,
            stage: humanize(role),
            items: mapItemsForEmail(report.entityType, itemDocs),
        },
    });
}

async function sendReportRejectedEmail(report, role, remarks) {
    const recipient = await getAssociationRecipient(report.association);
    if (!recipient) return;

    await emailQueue.add(EMAIL_JOBS.REPORT_REJECTED, {
        type: EMAIL_JOBS.REPORT_REJECTED,
        data: {
            to: recipient.email,
            name: recipient.name,
            reportTitle: report.title,
            stage: humanize(role),
            remarks: remarks || "",
        },
    });
}

export const createReport = async (data, actingUser) => {
    const { associationId, ...reportData } = data;
    const role = actingUser?.role;

    const resolvedAssociationId =
        role === "far"
            ? await resolveFarAssociationId(actingUser._id)
            : associationId;

    const EntityModel = ENTITY_MODELS[reportData.entityType];
    const entityExists = await EntityModel.countDocuments({
        _id: { $in: reportData.itemIds },
        deletedAt: null,
    });
    if (entityExists !== reportData.itemIds.length) {
        const error = new Error(`One or more selected ${reportData.entityType} items were not found`);
        error.statusCode = 404;
        throw error;
    }

    if (reportData.entityType === "farm") {
        const farmExists = await Farm.exists({ _id: reportData.parentId, deletedAt: null });
        if (!farmExists) {
            const error = new Error("Selected farm was not found");
            error.statusCode = 404;
            throw error;
        }
    }

    // Single-stage approval depending on who submitted — far's reports
    // stop at aew, aew's reports go to coordinator. Never both.
    const initialApprovalStatus =
        role === "far"
            ? { aew: { status: "pending" } }
            : { coordinator: { status: "pending" } };

    const report = await Report.create({
        ...reportData,
        association: resolvedAssociationId || undefined,
        approvalStatus: initialApprovalStatus,
    });

    const association = report.association
        ? await Association.findById(report.association).select("name")
        : null;
    const submitterLabel = association?.name ?? "An unaffiliated user";

    await createLog({
        entityType: "report",
        entityId: report._id,
        association: report.association,
        message: `${submitterLabel} submitted a report "${report.title}" for ${humanize(report.entityType)}.`,
    });

    return report;
};

export const updateReport = async (id, data) => {
    const { associationId, ...reportData } = data;
    if (associationId !== undefined) {
        reportData.association = associationId;
    }

    const report = await Report.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: reportData },
        { new: true, runValidators: true }
    );

    if (!report) {
        const notFoundError = new Error("Report not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return report;
};

export const updateReportApproval = async (id, { status, remarks }, actingUser) => {
    const role = actingUser?.role;

    if (!STAGE_ROLES.includes(role)) {
        const error = new Error("Only aew or coordinator users can review reports");
        error.statusCode = 403;
        throw error;
    }

    const report = await Report.findOne({ _id: id, deletedAt: null });

    if (!report) {
        const notFoundError = new Error("Report not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const currentStageEntry = report.approvalStatus?.[role];

    if (!currentStageEntry) {
        const error = new Error("This report is not currently awaiting your review");
        error.statusCode = 403;
        throw error;
    }

    if (currentStageEntry.status !== "pending") {
        const error = new Error("This report has already been reviewed");
        error.statusCode = 409;
        throw error;
    }

    report.approvalStatus[role] = {
        status,
        approvedBy: actingUser._id,
        approvedAt: new Date(),
        remarks: remarks || "",
    };

    const stageLabel = humanize(role);
    const decisionVerb = status === "approved" ? "approved" : "denied";
    const remarksSuffix = remarks ? ` Remarks: "${remarks}"` : "";

    // Single decision, full stop — aew approving a far report and
    // coordinator approving an aew report both terminate here. No
    // chaining to a next stage (unlike the multi-stage request flow).
    await createLog({
        entityType: "report",
        entityId: report._id,
        association: report.association,
        message: `${stageLabel} has ${decisionVerb} the report "${report.title}".${remarksSuffix}`,
    });

    // Terminal either way (approve or deny) — send the association's
    // user their outcome email right away rather than waiting on any
    // further stage, since reports never chain past a single reviewer.
    if (status === "approved") {
        await sendReportApprovedEmail(report, role);
    } else {
        await sendReportRejectedEmail(report, role, remarks);
    }

    await report.save();
    return report;
};

export const deleteReport = async (id) => {
    const report = await Report.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!report) {
        const notFoundError = new Error("Report not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    await createLog({
        entityType: "report",
        entityId: report._id,
        association: report.association,
        message: `Report "${report.title}" has been deleted.`,
    });

    return report;
};

function buildOverallStatusFilter(status) {
    const DENIED_AT_ANY_STAGE = [
        { "approvalStatus.aew.status": "denied" },
        { "approvalStatus.coordinator.status": "denied" },
    ];
    const APPROVED_AT_ANY_STAGE = [
        { "approvalStatus.aew.status": "approved" },
        { "approvalStatus.coordinator.status": "approved" },
    ];

    if (status === "denied") return { $or: DENIED_AT_ANY_STAGE };
    if (status === "approved") return { $or: APPROVED_AT_ANY_STAGE };
    return { $nor: [...DENIED_AT_ANY_STAGE, ...APPROVED_AT_ANY_STAGE] };
}

// stage means "who submitted it", not "who reviews it":
//   - "far" -> reports submitted by a far user (only ever get an aew subdoc)
//   - "aew" -> reports submitted by an aew user (only ever get a
//              coordinator subdoc)
// far's own view is also scoped by association (there's exactly one far
// per association, so association + submittedByRole=far pins it down
// even though an aew report in that same association shares the
// association field). aew and coordinator are never association-scoped
// — they operate across every association (see scopeReportsByRole).
function buildSubmittedByRoleFilter(stage) {
    if (stage === "far") {
        return { "approvalStatus.aew": { $exists: true } };
    }
    if (stage === "aew") {
        return { "approvalStatus.coordinator": { $exists: true } };
    }
    return {};
}

export const getReports = async ({
    date,
    timezoneOffset = 0,
    status,
    severity,
    entityType,
    search,
    stage,
    associationId,
    all,
    page,
    limit,
    includeDeleted = false,
}) => {
    const filter = includeDeleted ? {} : { deletedAt: null };

    if (date) {
        const start = new Date(new Date(`${date}T00:00:00Z`).getTime() + timezoneOffset * 60000);
        filter.createdAt = { $gte: start, $lt: new Date(start.getTime() + 86400000) };
    }

    if (severity) filter.severity = severity;
    if (entityType) filter.entityType = entityType;
    if (associationId) filter.association = associationId;
    if (search) filter.title = new RegExp(escapeRegex(search), "i");

    if (stage) Object.assign(filter, buildSubmittedByRoleFilter(stage));
    if (status) Object.assign(filter, buildOverallStatusFilter(status));

    if (all) {
        const reports = await Report.find(filter)
            .populate(ASSOCIATION_POPULATE)
            .sort({ createdAt: -1 })
            .lean();
        const withEntities = await populateEntities(reports);
        return {
            reports: await attachHistory(withEntities, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
        Report.find(filter)
            .populate(ASSOCIATION_POPULATE)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Report.countDocuments(filter),
    ]);

    const withEntities = await populateEntities(reports);

    return {
        reports: await attachHistory(withEntities, associationId),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
````

### backend/src/controllers/report.controller.js

````js
import {
    createReport,
    updateReport,
    updateReportApproval,
    deleteReport,
    getReports,
} from "../services/report.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createReportHandler = asyncHandler(async (req, res) => {
    const report = await createReport(req.body, req.user);

    return res.status(201).json({
        message: "Report created successfully",
        report,
    });
});

export const updateReportHandler = asyncHandler(async (req, res) => {
    const report = await updateReport(req.params.id, req.body);

    return res.status(200).json({
        message: "Report updated successfully",
        report,
    });
});

export const updateReportApprovalHandler = asyncHandler(async (req, res) => {
    const report = await updateReportApproval(req.params.id, req.body, req.user);

    return res.status(200).json({
        message: "Report review submitted successfully",
        report,
    });
});

export const deleteReportHandler = asyncHandler(async (req, res) => {
    const report = await deleteReport(req.params.id);

    return res.status(200).json({
        message: "Report deleted successfully",
        report,
    });
});

export const getReportsHandler = asyncHandler(async (req, res) => {
    const { reports, pagination } = await getReports(req.query);

    return res.status(200).json({
        message: "Reports fetched successfully",
        reports,
        pagination,
    });
});
````

### backend/src/routes/report.routes.js

````js
import express from "express";
import {
    createReportHandler,
    updateReportHandler,
    updateReportApprovalHandler,
    deleteReportHandler,
    getReportsHandler,
} from "../controllers/report.controller.js";
import {
    validateCreateReport,
    validateUpdateReport,
    validateUpdateReportApproval,
    validateReportIdParam,
    validateGetReportsQuery,
} from "../validators/report.validator.js";
import {
    authenticated,
    allowRoles,
    scopeReportsByRole,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
    "/",
    authenticated,
    allowRoles("far", "aew", "coordinator", "governor", "head", "admin"),
    scopeReportsByRole,
    validateGetReportsQuery,
    getReportsHandler,
);
router.post(
    "/",
    authenticated,
    allowRoles("far", "aew"),
    validateCreateReport,
    createReportHandler,
);
router.patch("/:id", authenticated, allowRoles("far", "aew"), validateReportIdParam, validateUpdateReport, updateReportHandler);
router.patch(
    "/:id/approval",
    authenticated,
    allowRoles("aew", "coordinator"),
    validateReportIdParam,
    validateUpdateReportApproval,
    updateReportApprovalHandler,
);
router.delete("/:id", authenticated, allowRoles("far", "aew"), validateReportIdParam, deleteReportHandler);

export default router;
````

### backend/src/services/excel.service.js

````js
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import { getDateRange } from "../utils/dateRange.util.js";
import {
    PERIOD_LABEL,
    capitalize,
    formatDate,
    getEquipmentRows,
    getLivestockRows,
    getFarmRows,
} from "./analyticsReportData.service.js";

const BORDER_STYLE = {
    top: { style: "thin", color: { argb: "FFE2E8F0" } },
    left: { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    right: { style: "thin", color: { argb: "FFE2E8F0" } },
};

const HEADER_FILL = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" },
};

const HEADER_FONT = {
    name: "Arial",
    size: 9,
    bold: true,
    color: { argb: "FF475569" },
};

const DATA_FONT = {
    name: "Arial",
    size: 9.5,
    color: { argb: "FF0F172A" },
};

const ZEBRA_FILL = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8FAFC" },
};

function autoFitColumns(worksheet) {
    worksheet.columns.forEach((column) => {
        let maxLen = 12;
        column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
            // Ignore main title and subtitle rows when calculating column width
            if (rowNumber <= 3) return;
            const cellValue = cell.value ? String(cell.value) : "";
            if (cellValue.length > maxLen) {
                maxLen = cellValue.length;
            }
        });
        column.width = Math.min(Math.max(maxLen + 4, 14), 45);
    });
}

function addSectionHeader(worksheet, title) {
    const row = worksheet.addRow([title]);
    row.height = 24;
    const cell = row.getCell(1);
    cell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF0F172A" } };
    cell.alignment = { vertical: "bottom", horizontal: "left" };
}

function renderTableToWorksheet(worksheet, headers, rows) {
    const headerRow = worksheet.addRow(headers.map((h) => h.toUpperCase()));
    headerRow.height = 20;

    headerRow.eachCell((cell) => {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.border = BORDER_STYLE;
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
    });

    if (!rows.length) {
        const emptyRow = worksheet.addRow(["No records for this period."]);
        emptyRow.height = 18;
        const cell = emptyRow.getCell(1);
        cell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF64748B" } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        worksheet.addRow([]);
        return;
    }

    rows.forEach((rowData, idx) => {
        const row = worksheet.addRow(rowData);
        row.height = 18;
        const isEven = idx % 2 === 1;

        row.eachCell((cell) => {
            cell.font = DATA_FONT;
            cell.border = BORDER_STYLE;
            cell.alignment = { vertical: "middle", horizontal: "left" };
            if (isEven) {
                cell.fill = ZEBRA_FILL;
            }
        });
    });

    worksheet.addRow([]); // Blank spacing row
}

export const generateAnalyticsExcel = async ({ section = "all", association, period = "month" }) => {
    const associationId = association ? new mongoose.Types.ObjectId(association) : null;
    const { start, end } = getDateRange(period);

    const sectionsToInclude = section === "all" ? ["equipment", "livestock", "farm"] : [section];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AgriCentral";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Analytics Report", {
        views: [{ showGridLines: true }],
    });

    // Main Title
    const titleRow = worksheet.addRow(["AgriCentral Analytics Report"]);
    titleRow.height = 26;
    const titleCell = titleRow.getCell(1);
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF0F172A" } };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };

    // Subtitle
    const subtitleText = `${PERIOD_LABEL[period] || "Period"} • ${formatDate(start)} – ${formatDate(end)}`;
    const subtitleRow = worksheet.addRow([subtitleText]);
    subtitleRow.height = 18;
    const subtitleCell = subtitleRow.getCell(1);
    subtitleCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF64748B" } };
    subtitleCell.alignment = { vertical: "middle", horizontal: "left" };

    worksheet.addRow([]); // Spacer

    // Equipment Section
    if (sectionsToInclude.includes("equipment")) {
        const rows = await getEquipmentRows({ associationId, start, end });
        addSectionHeader(worksheet, "Equipment");
        const headers = [
            "Property #",
            "Name",
            "Condition",
            "Status",
            "Association",
            "Assigned Farmer",
            "Date Added",
        ];
        const body = rows.map((e) => [
            e.propertyNumber,
            e.name,
            capitalize(e.condition),
            capitalize(e.status),
            e.association,
            e.assignedFarmer,
            formatDate(e.dateAdded),
        ]);
        renderTableToWorksheet(worksheet, headers, body);
    }

    // Livestock Section
    if (sectionsToInclude.includes("livestock")) {
        const rows = await getLivestockRows({ associationId, start, end });
        addSectionHeader(worksheet, "Livestock");
        const headers = [
            "Property #",
            "Animal",
            "Breed",
            "Gender",
            "Birth Date",
            "Color",
            "Weight",
            "Condition",
            "Status",
            "Association",
            "Assigned Farmer",
            "Date Added",
        ];
        const body = rows.map((l) => [
            l.propertyNumber,
            l.animal,
            l.breed,
            capitalize(l.gender),
            formatDate(l.birthDate),
            l.color,
            l.weight,
            capitalize(l.condition),
            capitalize(l.status),
            l.association,
            l.assignedFarmer,
            formatDate(l.dateAdded),
        ]);
        renderTableToWorksheet(worksheet, headers, body);
    }

    // Farm Section
    if (sectionsToInclude.includes("farm")) {
        const rows = await getFarmRows({ associationId, start, end });
        addSectionHeader(worksheet, "Farm");
        const headers = [
            "Farm",
            "Crop",
            "Planted",
            "Growing",
            "Withered",
            "Damaged",
            "Harvested",
            "Planted Date",
            "Harvested Date",
        ];
        const body = rows.map((r) => [
            r.farm,
            r.crop,
            r.planted,
            r.growing,
            r.withered,
            r.damaged,
            r.harvested,
            formatDate(r.plantedDate),
            formatDate(r.harvestedDate),
        ]);
        renderTableToWorksheet(worksheet, headers, body);
    }

    autoFitColumns(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
};
````

### backend/src/services/pdf.service.js

````js
import mongoose from "mongoose";
import puppeteer from "puppeteer";
import { getDateRange } from "../utils/dateRange.util.js";
import {
    PERIOD_LABEL,
    capitalize,
    formatDate,
    getEquipmentRows,
    getLivestockRows,
    getFarmRows,
} from "./analyticsReportData.service.js";

/* ---------------- Helpers ---------------- */
function escapeHtml(s) {
    return String(s).replace(
        /[&<>"']/g,
        (c) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[c],
    );
}

/* ---------------- HTML rendering ---------------- */

const REPORT_STYLES = `
  body { font-family: Helvetica, Arial, sans-serif; color: #0f172a; padding: 24px; }
  h1 { font-size: 18px; margin-bottom: 2px; }
  .subtitle { font-size: 11px; color: #64748b; margin-bottom: 16px; }
  h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid #e2e8f0; padding: 4px 6px; font-size: 10px; text-align: left; }
  th { background: #f1f5f9; text-transform: uppercase; letter-spacing: 0.03em; font-size: 9px; color: #475569; }
  tr:nth-child(even) { background: #f8fafc; }
`;

function renderTable(headers, rows) {
    if (!rows.length) {
        return `<p style="font-size:11px;color:#64748b;">No records for this period.</p>`;
    }
    const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
    const body = rows
        .map(
            (row) =>
                `<tr>${row.map((cell) => `<td>${escapeHtml(cell ?? "")}</td>`).join("")}</tr>`,
        )
        .join("");
    return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderEquipmentSection(rows) {
    const headers = ["Property #", "Name", "Condition", "Status", "Association", "Assigned Farmer", "Date Added"];
    const body = rows.map((e) => [
        e.propertyNumber,
        e.name,
        capitalize(e.condition),
        capitalize(e.status),
        e.association,
        e.assignedFarmer,
        formatDate(e.dateAdded),
    ]);
    return `<h2>Equipment</h2>${renderTable(headers, body)}`;
}

function renderLivestockSection(rows) {
    const headers = [
        "Property #", "Animal", "Breed", "Gender", "Birth Date",
        "Color", "Weight", "Condition", "Status", "Association", "Assigned Farmer", "Date Added",
    ];
    const body = rows.map((l) => [
        l.propertyNumber,
        l.animal,
        l.breed,
        capitalize(l.gender),
        formatDate(l.birthDate),
        l.color,
        l.weight,
        capitalize(l.condition),
        capitalize(l.status),
        l.association,
        l.assignedFarmer,
        formatDate(l.dateAdded),
    ]);
    return `<h2>Livestock</h2>${renderTable(headers, body)}`;
}

function renderFarmSection(rows) {
    const headers = ["Farm", "Crop", "Planted", "Growing", "Withered", "Damaged", "Harvested", "Planted Date", "Harvested Date"];
    const body = rows.map((r) => [
        r.farm,
        r.crop,
        r.planted,
        r.growing,
        r.withered,
        r.damaged,
        r.harvested,
        formatDate(r.plantedDate),
        formatDate(r.harvestedDate),
    ]);
    return `<h2>Farm</h2>${renderTable(headers, body)}`;
}

/* ---------------- Main entry point ---------------- */

export const generateAnalyticsPdf = async ({ section = "all", association, period = "month" }) => {
    const associationId = association ? new mongoose.Types.ObjectId(association) : null;
    const { start, end } = getDateRange(period);

    const sectionsToInclude = section === "all" ? ["equipment", "livestock", "farm"] : [section];

    const htmlParts = [];

    if (sectionsToInclude.includes("equipment")) {
        const rows = await getEquipmentRows({ associationId, start, end });
        htmlParts.push(renderEquipmentSection(rows));
    }
    if (sectionsToInclude.includes("livestock")) {
        const rows = await getLivestockRows({ associationId, start, end });
        htmlParts.push(renderLivestockSection(rows));
    }
    if (sectionsToInclude.includes("farm")) {
        const rows = await getFarmRows({ associationId, start, end });
        htmlParts.push(renderFarmSection(rows));
    }

    const fullHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>${REPORT_STYLES}</style>
        </head>
        <body>
          <h1>AgriCentral Analytics Report</h1>
          <p class="subtitle">${PERIOD_LABEL[period]} &bull; ${formatDate(start)} &ndash; ${formatDate(end)}</p>
          ${htmlParts.join("")}
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
        const page = await browser.newPage();
        await page.setContent(fullHtml, { waitUntil: "networkidle0" });
        return await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
        });
    } finally {
        await browser.close();
    }
};
````

## 5. Small Logic Updates

- Reused association as the source of assigned/available status, retaining assignedFarmer. Updated inventory writes, model saves, request release, related farmer records, filters, and analytics export data; legacy read results are derived without a migration.
- Equipment damaged/unusable/maintenance and livestock deceased/injured/sick cannot be newly assigned. Assignment/request forms use validation and disabled controls with reasons; backend services also check request creation, edit, reservation, and release.
- Added Approve/Disapprove drawer buttons using existing Button variants and page review handlers/ReviewConfirmModal. Existing reviewer roles and pending status gate them; success closes the drawer and invalidates request/report queries plus affected inventory queries.
- Added focused tests using Node's built-in test runner and experimental module mocking; no new dependency was installed.

### frontend/src/utils/assignment.js

````js
export const BLOCKED_CONDITIONS = {
    equipment: ["damaged", "unusable", "maintenance"],
    livestock: ["deceased", "injured", "sick"],
};

export function assignmentReason(type, condition) {
    return BLOCKED_CONDITIONS[type]?.includes(condition) ? `Not assignable: ${condition}` : "";
}
````

### backend/src/utils/assignment.js

````js
export const BLOCKED_CONDITIONS = {
    equipment: ["damaged", "unusable", "maintenance"],
    livestock: ["deceased", "injured", "sick"],
};

export function assertAssignable(type, condition) {
    if (BLOCKED_CONDITIONS[type]?.includes(condition)) {
        const error = new Error(`Not assignable: ${condition}`);
        error.statusCode = 409;
        throw error;
    }
}
````

### backend/src/models/equipment.model.js

````js
import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        propertyNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        condition: {
            type: String,
            enum: [
                "good",
                "excellent",
                "damaged",
                "maintenance",
                "unusable",
            ],
            default: "good",
        },
        status: {
            type: String,
            enum: [
                "assigned",
                "available",
            ],
            default: "available",
        },
        assignedFarmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmer",
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        reservedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Request",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

equipmentSchema.pre("validate", function () {
    this.status = this.association ? "assigned" : "available";
});

equipmentSchema.index(
    { propertyNumber: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

export default mongoose.model("Equipment", equipmentSchema);
````

### backend/src/models/livestock.model.js

````js
import mongoose from "mongoose";

const livestockSchema = new mongoose.Schema(
    {
        association: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Association",
        },
        propertyNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        animal: {
            type: String,
            required: true,
            trim: true,
        },
        breed: {
            type: String,
            required: true,
            trim: true,
        },
        gender: {
            type: String,
            enum: [
                "male",
                "female",
            ],
            required: true,
        },
        birthDate: {
            type: Date,
            required: true,
        },
        color: {
            type: String,
            required: true,
            trim: true,
        },
        weight: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        condition: {
            type: String,
            enum: [
                "healthy",
                "pregnant",
                "sick",
                "injured",
                "deceased",
            ],
            default: "healthy",
        },
        deceasedAt: { type: Date, default: null },
        status: {
            type: String,
            enum: [
                "assigned",
                "available",
            ],
            default: "available",
        },
        assignedFarmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmer",
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        reservedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Request",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

livestockSchema.pre("validate", function () {
    this.status = this.association ? "assigned" : "available";
    this.deceasedAt = this.condition === "deceased" ? this.deceasedAt ?? new Date() : null;
});

livestockSchema.index(
    { propertyNumber: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
);

export default mongoose.model("Livestock", livestockSchema);
````

### backend/src/schemas/equipment.schema.js

````js
import { z } from "zod";
import { BLOCKED_CONDITIONS } from "../utils/assignment.js";

const CONDITIONS = ["good", "excellent", "damaged", "unusable", "maintenance"];
const STATUSES = ["assigned", "available"];

const objectId = (message) =>
    z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const createEquipmentSchema = z
    .object({
        associationId: objectId("Invalid association id").optional(),
        propertyNumber: z
            .string({ required_error: "Property number is required" })
            .trim()
            .min(1, "Property number is required")
            .max(30, "Property number must not exceed 30 characters")
            .toUpperCase(),
        name: z
            .string({ required_error: "Name is required" })
            .trim()
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name must not exceed 100 characters"),
        condition: z.enum(CONDITIONS).optional().default("good"),
        status: z.enum(STATUSES).optional().default("available"),
        assignedFarmer: objectId("Invalid farmer id").optional(),
    })
    .refine((data) => !(data.associationId || data.assignedFarmer) || !BLOCKED_CONDITIONS.equipment.includes(data.condition), {
        message: "Not assignable: equipment is damaged, unusable, or under maintenance",
        path: ["associationId"],
    });

export const updateEquipmentSchema = z
    .object({
        associationId: objectId("Invalid association id").nullable().optional(),
        propertyNumber: z
            .string()
            .trim()
            .min(1, "Property number is required")
            .max(30, "Property number must not exceed 30 characters")
            .toUpperCase()
            .optional(),
        name: z
            .string()
            .trim()
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name must not exceed 100 characters")
            .optional(),
        condition: z.enum(CONDITIONS).optional(),
        status: z.enum(STATUSES).optional(),
        // null clears the assignment (return to available); a string
        // assigns/reassigns; omitted leaves it untouched.
        assignedFarmer: objectId("Invalid farmer id").nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const equipmentIdParamSchema = z.object({
    id: objectId("Invalid equipment id"),
});

export const getEquipmentsQuerySchema = z.object({
    condition: z.enum(CONDITIONS).optional(),
    status: z.enum(STATUSES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    associationId: objectId("Invalid association id").optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});
````

### backend/src/schemas/livestock.schema.js

````js
import { z } from "zod";
import { BLOCKED_CONDITIONS } from "../utils/assignment.js";

const CONDITIONS = ["healthy", "pregnant", "sick", "injured", "deceased"];
const STATUSES = ["assigned", "available"];
const GENDERS = ["male", "female"];

const objectId = (message) =>
    z.string().regex(/^[0-9a-fA-F]{24}$/, message);

export const createLivestockSchema = z
    .object({
        associationId: objectId("Invalid association id").optional(),
        propertyNumber: z
            .string({ required_error: "Property number is required" })
            .trim()
            .min(1, "Property number is required")
            .max(30, "Property number must not exceed 30 characters")
            .toUpperCase(),
        animal: z
            .string({ required_error: "Animal is required" })
            .trim()
            .min(2, "Animal must be at least 2 characters")
            .max(100, "Animal must not exceed 100 characters"),
        breed: z
            .string({ required_error: "Breed is required" })
            .trim()
            .min(2, "Breed must be at least 2 characters")
            .max(100, "Breed must not exceed 100 characters"),
        gender: z.enum(GENDERS, { required_error: "Gender is required" }),
        birthDate: z.coerce.date({ error: "Invalid release date" }),
        color: z
            .string({ required_error: "Color is required" })
            .trim()
            .min(1, "Color is required")
            .max(50, "Color must not exceed 50 characters"),
        weight: z.coerce
            .number({ required_error: "Weight is required" })
            .min(0, "Weight must not be negative")
            .default(0),
        condition: z.enum(CONDITIONS).optional().default("healthy"),
        status: z.enum(STATUSES).optional().default("available"),
        assignedFarmer: objectId("Invalid farmer id").optional(),
    })
    .refine((data) => !(data.associationId || data.assignedFarmer) || !BLOCKED_CONDITIONS.livestock.includes(data.condition), {
        message: "Not assignable: livestock is deceased, injured, or sick",
        path: ["associationId"],
    });

export const updateLivestockSchema = z
    .object({
        associationId: objectId("Invalid association id").nullable().optional(),
        propertyNumber: z
            .string()
            .trim()
            .min(1, "Property number is required")
            .max(30, "Property number must not exceed 30 characters")
            .toUpperCase()
            .optional(),
        animal: z
            .string()
            .trim()
            .min(2, "Animal must be at least 2 characters")
            .max(100, "Animal must not exceed 100 characters")
            .optional(),
        breed: z
            .string()
            .trim()
            .min(2, "Breed must be at least 2 characters")
            .max(100, "Breed must not exceed 100 characters")
            .optional(),
        gender: z.enum(GENDERS).optional(),
        birthDate: z.coerce.date({ error: "Invalid release date" }).optional(),
        color: z
            .string()
            .trim()
            .min(1, "Color is required")
            .max(50, "Color must not exceed 50 characters")
            .optional(),
        weight: z.coerce.number().min(0, "Weight must not be negative").optional(),
        condition: z.enum(CONDITIONS).optional(),
        status: z.enum(STATUSES).optional(),
        // null clears the assignment (return to available); a string
        // assigns/reassigns; omitted leaves it untouched.
        assignedFarmer: objectId("Invalid farmer id").nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });

export const livestockIdParamSchema = z.object({
    id: objectId("Invalid livestock id"),
});

export const getLivestocksQuerySchema = z.object({
    condition: z.enum(CONDITIONS).optional(),
    status: z.enum(STATUSES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    associationId: objectId("Invalid association id").optional(),
    all: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});
````

### backend/src/services/equipment.service.js

````js
import Equipment from "../models/equipment.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities } from "./log.service.js";
import { assertAssignable } from "../utils/assignment.js";

const ASSOCIATION_POPULATE = { path: "association", select: "name" };

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const association = await Association.findOne({
        user: authenticatedUserId,
        deletedAt: null,
    }).select("_id");

    return association?._id ?? undefined;
};

export const createEquipment = async (data, authenticatedUserId) => {
    const { associationId, ...equipmentData } = data;

    const existing = await Equipment.findOne({ propertyNumber: equipmentData.propertyNumber, deletedAt: null });

    if (existing) {
        const error = new Error("Property number is already in use");
        error.statusCode = 409;
        throw error;
    }

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    if (resolvedAssociationId || equipmentData.assignedFarmer) assertAssignable("equipment", equipmentData.condition);
    const equipment = await Equipment.create({
        ...equipmentData,
        association: resolvedAssociationId || undefined,
        status: resolvedAssociationId ? "assigned" : "available",
    });

    await createLog({
        entityType: "equipment",
        entityId: equipment._id,
        association: equipment.association,
        message: `${equipment.name} (${equipment.propertyNumber}) has been added to the equipment inventory.`,
    });

    if (equipment.association) {
        const association = await Association.findById(equipment.association).select("name");

        await createLog({
            entityType: "equipment",
            entityId: equipment._id,
            association: equipment.association,
            message: `${equipment.name} (${equipment.propertyNumber}) has been assigned to ${association?.name ?? "an association"}.`,
        });
    }

    if (equipment.assignedFarmer) {
        const farmer = await Farmer.findById(equipment.assignedFarmer).select("firstName lastName");
        const farmerName = farmer?.getFullName() ?? "a farmer";

        await createLog({
            entityType: "equipment",
            entityId: equipment._id,
            association: equipment.association,
            message: `${equipment.name} (${equipment.propertyNumber}) has been assigned to ${farmerName}.`,
        });

        await createLog({
            entityType: "farmer",
            entityId: equipment.assignedFarmer,
            association: equipment.association,
            message: `${farmer ? farmer.getFullName() : "The farmer"} has received ${equipment.name} (${equipment.propertyNumber}).`,
        });
    }

    await equipment.populate([
        { path: "assignedFarmer", select: "firstName lastName" },
        ASSOCIATION_POPULATE,
    ]);

    return equipment;
};

export const updateEquipment = async (id, data) => {
    const { associationId, ...equipmentData } = data;
    if (associationId !== undefined) {
        equipmentData.association = associationId;
    }

    if (equipmentData.propertyNumber) {
        const existing = await Equipment.findOne({
            propertyNumber: equipmentData.propertyNumber,
            _id: { $ne: id },
            deletedAt: null,
        });

        if (existing) {
            const error = new Error("Property number is already in use");
            error.statusCode = 409;
            throw error;
        }
    }

    const previousEquipment = await Equipment.findOne({ _id: id, deletedAt: null }).select("assignedFarmer condition name propertyNumber association");
    const association = equipmentData.association !== undefined ? equipmentData.association : previousEquipment?.association;
    equipmentData.status = association ? "assigned" : "available";
    if ((equipmentData.association && String(equipmentData.association) !== String(previousEquipment?.association ?? "")) ||
        (equipmentData.assignedFarmer && String(equipmentData.assignedFarmer) !== String(previousEquipment?.assignedFarmer ?? ""))) {
        assertAssignable("equipment", equipmentData.condition ?? previousEquipment?.condition);
    }
    if (equipmentData.association === null) {
        equipmentData.assignedFarmer = null;
    }

    const update = { ...equipmentData };
    const unset = {};
    if (update.assignedFarmer === null) {
        delete update.assignedFarmer;
        unset.assignedFarmer = "";
    }
    if (update.association === null) {
        delete update.association;
        unset.association = "";
    }

    const equipment = await Equipment.findOneAndUpdate(
        { _id: id, deletedAt: null },
        {
            $set: update,
            ...(Object.keys(unset).length ? { $unset: unset } : {}),
        },
        { new: true, runValidators: true },
    ).populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE]);

    if (!equipment) {
        const notFoundError = new Error("Equipment not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (
        equipmentData.association !== undefined &&
        String(previousEquipment?.association ?? "") !== String(equipment.association?._id ?? equipment.association ?? "")
    ) {
        if (equipment.association) {
            const association = await Association.findById(equipment.association._id ?? equipment.association).select("name");

            await createLog({
                entityType: "equipment",
                entityId: equipment._id,
                association: equipment.association._id ?? equipment.association,
                message: `${equipment.name} (${equipment.propertyNumber}) has been assigned to ${association?.name ?? "an association"}.`,
            });
        } else {
            await createLog({
                entityType: "equipment",
                entityId: equipment._id,
                association: previousEquipment?.association,
                message: `${equipment.name} (${equipment.propertyNumber}) has been returned and removed from its association.`,
            });
        }
    }

    if (
        equipmentData.assignedFarmer !== undefined &&
        String(previousEquipment?.assignedFarmer ?? "") !== String(equipment.assignedFarmer?._id ?? "")
    ) {
        if (equipment.assignedFarmer) {
            const assignedName = equipment.assignedFarmer.getFullName?.() ?? "a farmer";

            await createLog({
                entityType: "equipment",
                entityId: equipment._id,
                association: equipment.association?._id ?? equipment.association,
                message: `${equipment.name} (${equipment.propertyNumber}) has been assigned to ${assignedName}.`,
            });

            await createLog({
                entityType: "farmer",
                entityId: equipment.assignedFarmer._id,
                association: equipment.association?._id ?? equipment.association,
                message: `${equipment.assignedFarmer.getFullName?.() ?? "The farmer"} has received ${equipment.name} (${equipment.propertyNumber}).`,
            });
        } else {
            const previousFarmer = previousEquipment?.assignedFarmer
                ? await Farmer.findById(previousEquipment.assignedFarmer).select("firstName lastName")
                : null;

            await createLog({
                entityType: "equipment",
                entityId: equipment._id,
                association: equipment.association?._id ?? equipment.association,
                message: `${equipment.name} (${equipment.propertyNumber}) has been returned.`,
            });

            if (previousFarmer) {
                await createLog({
                    entityType: "farmer",
                    entityId: previousEquipment.assignedFarmer,
                    association: equipment.association?._id ?? equipment.association,
                    message: `${previousFarmer.getFullName()} has returned ${equipment.name} (${equipment.propertyNumber}).`,
                });
            }
        }
    }

    if (
        equipmentData.condition !== undefined &&
        previousEquipment?.condition !== equipment.condition
    ) {
        await createLog({
            entityType: "equipment",
            entityId: equipment._id,
            association: equipment.association?._id ?? equipment.association,
            message: `${equipment.name} (${equipment.propertyNumber})'s condition has been changed from ${previousEquipment?.condition ?? "unknown"} to ${equipment.condition}.`,
        });
    }

    return equipment;
};

export const deleteEquipment = async (id) => {
    const equipment = await Equipment.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!equipment) {
        const notFoundError = new Error("Equipment not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return equipment;
};

export const restoreEquipment = async (id) => {
    const toRestore = await Equipment.findOne({ _id: id, deletedAt: { $ne: null } });

    if (!toRestore) {
        const notFoundError = new Error("Deleted equipment not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const propertyNumberTaken = await Equipment.findOne({
        _id: { $ne: id },
        propertyNumber: toRestore.propertyNumber,
        deletedAt: null,
    });

    if (propertyNumberTaken) {
        const conflictError = new Error("An active equipment with this property number already exists");
        conflictError.statusCode = 409;
        throw conflictError;
    }

    toRestore.deletedAt = null;
    await toRestore.save();
    return toRestore;
};

const attachHistory = async (equipments, associationId) => {
    const equipmentIds = equipments.map((e) => e._id);

    if (!equipmentIds.length) return [];

    const logsByEquipmentId = await getLogsForEntities(
        "equipment",
        equipmentIds,
        associationId,
    );

    return equipments.map((e) => {
        const obj = typeof e.toObject === "function" ? e.toObject() : e;
        const key = obj._id.toString();
        return {
            ...obj,
            status: obj.association ? "assigned" : "available",
            history: logsByEquipmentId.get(key) ?? [],
        };
    });
};

export const getAvailableEquipments = async () => {
    const equipments = await Equipment.find({
        deletedAt: null,
        association: null,
        assignedFarmer: null,
    })
        .select("propertyNumber name condition status")
        .sort({ propertyNumber: 1 });

    return equipments;
};

export const getEquipments = async ({
    condition,
    status,
    search,
    associationId,
    all,
    page,
    limit,
    includeDeleted = false,
}) => {
    const filter = includeDeleted ? {} : { deletedAt: null };
    if (condition) filter.condition = condition;
    if (status) filter.$and = [{ association: status === "assigned" ? { $ne: null } : null }];
    if (associationId) filter.association = associationId;

    if (search) {
        filter.name = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const equipments = await Equipment.find(filter)
            .populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE])
            .sort({ createdAt: -1 });

        return {
            equipments: await attachHistory(equipments, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [equipments, total] = await Promise.all([
        Equipment.find(filter)
            .populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Equipment.countDocuments(filter),
    ]);

    return {
        equipments: await attachHistory(equipments, associationId),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
````

### backend/src/services/livestock.service.js

````js
import Livestock from "../models/livestock.model.js";
import Farmer from "../models/farmer.model.js";
import User from "../models/user.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities } from "./log.service.js";
import { assertAssignable } from "../utils/assignment.js";

const ASSOCIATION_POPULATE = { path: "association", select: "name" };

const resolveAssociationId = async (associationId, authenticatedUserId) => {
    if (associationId) return associationId;
    if (!authenticatedUserId) return undefined;

    const association = await Association.findOne({
        user: authenticatedUserId,
        deletedAt: null,
    }).select("_id");

    return association?._id ?? undefined;
};

export const createLivestock = async (data, authenticatedUserId) => {
    const { associationId, ...livestockData } = data;

    const existing = await Livestock.findOne({ propertyNumber: livestockData.propertyNumber, deletedAt: null });

    if (existing) {
        const error = new Error("Property number is already in use");
        error.statusCode = 409;
        throw error;
    }

    const resolvedAssociationId = await resolveAssociationId(
        associationId,
        authenticatedUserId,
    );

    if (resolvedAssociationId || livestockData.assignedFarmer) assertAssignable("livestock", livestockData.condition);
    const livestock = await Livestock.create({
        ...livestockData,
        association: resolvedAssociationId || undefined,
        status: resolvedAssociationId ? "assigned" : "available",
        deceasedAt: livestockData.condition === "deceased" ? new Date() : null,
    });

    await createLog({
        entityType: "livestock",
        entityId: livestock._id,
        association: livestock.association,
        message: `${livestock.animal} (${livestock.propertyNumber}) has been added to the livestock inventory.`,
    });

    if (livestock.association) {
        const association = await Association.findById(livestock.association).select("name");

        await createLog({
            entityType: "livestock",
            entityId: livestock._id,
            association: livestock.association,
            message: `${livestock.animal} (${livestock.propertyNumber}) has been assigned to ${association?.name ?? "an association"}.`,
        });
    }

    if (livestock.assignedFarmer) {
        const farmer = await Farmer.findById(livestock.assignedFarmer).select("firstName lastName");
        const farmerName = farmer?.getFullName() ?? "a farmer";

        await createLog({
            entityType: "livestock",
            entityId: livestock._id,
            association: livestock.association,
            message: `${livestock.animal} (${livestock.propertyNumber}) has been assigned to ${farmerName}.`,
        });

        await createLog({
            entityType: "farmer",
            entityId: livestock.assignedFarmer,
            association: livestock.association,
            message: `${farmer ? farmer.getFullName() : "The farmer"} has received ${livestock.animal} (${livestock.propertyNumber}).`,
        });
    }

    await livestock.populate(["assignedFarmer", ASSOCIATION_POPULATE].map((p) =>
        p === "assignedFarmer" ? { path: "assignedFarmer", select: "firstName lastName" } : p
    ));

    return livestock;
};

export const updateLivestock = async (id, data) => {
    const { associationId, ...livestockData } = data;
    if (associationId !== undefined) {
        livestockData.association = associationId;
    }

    if (livestockData.propertyNumber) {
        const existing = await Livestock.findOne({
            propertyNumber: livestockData.propertyNumber,
            _id: { $ne: id },
            deletedAt: null,
        });

        if (existing) {
            const error = new Error("Property number is already in use");
            error.statusCode = 409;
            throw error;
        }
    }

    const previousLivestock = await Livestock.findOne({ _id: id, deletedAt: null }).select("assignedFarmer condition animal propertyNumber association deceasedAt");

    if (livestockData.association === null) {
        livestockData.assignedFarmer = null;
    }

    const association = livestockData.association !== undefined ? livestockData.association : previousLivestock?.association;
    livestockData.status = association ? "assigned" : "available";
    if ((livestockData.association && String(livestockData.association) !== String(previousLivestock?.association ?? "")) ||
        (livestockData.assignedFarmer && String(livestockData.assignedFarmer) !== String(previousLivestock?.assignedFarmer ?? ""))) {
        assertAssignable("livestock", livestockData.condition ?? previousLivestock?.condition);
    }
    if (livestockData.condition !== undefined) {
        livestockData.deceasedAt = livestockData.condition === "deceased"
            ? previousLivestock?.deceasedAt ?? new Date()
            : null;
    }

    const update = { ...livestockData };
    const unset = {};
    if (update.assignedFarmer === null) {
        delete update.assignedFarmer;
        unset.assignedFarmer = "";
    }
    if (update.association === null) {
        delete update.association;
        unset.association = "";
    }

    const livestock = await Livestock.findOneAndUpdate(
        { _id: id, deletedAt: null },
        {
            $set: update,
            ...(Object.keys(unset).length ? { $unset: unset } : {}),
        },
        { new: true, runValidators: true },
    ).populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE]);

    if (!livestock) {
        const notFoundError = new Error("Livestock not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (
        livestockData.association !== undefined &&
        String(previousLivestock?.association ?? "") !== String(livestock.association?._id ?? livestock.association ?? "")
    ) {
        if (livestock.association) {
            const association = await Association.findById(livestock.association._id ?? livestock.association).select("name");

            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: livestock.association._id ?? livestock.association,
                message: `${livestock.animal} (${livestock.propertyNumber}) has been assigned to ${association?.name ?? "an association"}.`,
            });
        } else {
            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: previousLivestock?.association,
                message: `${livestock.animal} (${livestock.propertyNumber}) has been returned and removed from its association.`,
            });
        }
    }

    if (
        livestockData.assignedFarmer !== undefined &&
        String(previousLivestock?.assignedFarmer ?? "") !== String(livestock.assignedFarmer?._id ?? "")
    ) {
        if (livestock.assignedFarmer) {
            const assignedName = livestock.assignedFarmer.getFullName?.() ?? "a farmer";

            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: livestock.association?._id ?? livestock.association,
                message: `${livestock.animal} (${livestock.propertyNumber}) has been assigned to ${assignedName}.`,
            });

            await createLog({
                entityType: "farmer",
                entityId: livestock.assignedFarmer._id,
                association: livestock.association?._id ?? livestock.association,
                message: `${livestock.assignedFarmer.getFullName?.() ?? "The farmer"} has received ${livestock.animal} (${livestock.propertyNumber}).`,
            });
        } else {
            const previousFarmer = previousLivestock?.assignedFarmer
                ? await Farmer.findById(previousLivestock.assignedFarmer).select("firstName lastName")
                : null;

            await createLog({
                entityType: "livestock",
                entityId: livestock._id,
                association: livestock.association?._id ?? livestock.association,
                message: `${livestock.animal} (${livestock.propertyNumber}) has been returned.`,
            });

            if (previousFarmer) {
                await createLog({
                    entityType: "farmer",
                    entityId: previousLivestock.assignedFarmer,
                    association: livestock.association?._id ?? livestock.association,
                    message: `${previousFarmer.getFullName()} has returned ${livestock.animal} (${livestock.propertyNumber}).`,
                });
            }
        }
    }

    if (
        livestockData.condition !== undefined &&
        previousLivestock?.condition !== livestock.condition
    ) {
        await createLog({
            entityType: "livestock",
            entityId: livestock._id,
            association: livestock.association?._id ?? livestock.association,
            message: `${livestock.animal} (${livestock.propertyNumber})'s condition has been changed from ${previousLivestock?.condition ?? "unknown"} to ${livestock.condition}.`,
        });
    }

    return livestock;
};

export const deleteLivestock = async (id) => {
    const livestock = await Livestock.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!livestock) {
        const notFoundError = new Error("Livestock not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return livestock;
};

export const restoreLivestock = async (id) => {
    const toRestore = await Livestock.findOne({ _id: id, deletedAt: { $ne: null } });

    if (!toRestore) {
        const notFoundError = new Error("Deleted livestock not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const propertyNumberTaken = await Livestock.findOne({
        _id: { $ne: id },
        propertyNumber: toRestore.propertyNumber,
        deletedAt: null,
    });

    if (propertyNumberTaken) {
        const conflictError = new Error("An active livestock record with this property number already exists");
        conflictError.statusCode = 409;
        throw conflictError;
    }

    toRestore.deletedAt = null;
    await toRestore.save();
    return toRestore;
};

const attachHistory = async (livestocks, associationId) => {
    const livestockIds = livestocks.map((l) => l._id);

    if (!livestockIds.length) return [];

    const logsByLivestockId = await getLogsForEntities(
        "livestock",
        livestockIds,
        associationId,
    );

    return livestocks.map((l) => {
        const obj = typeof l.toObject === "function" ? l.toObject() : l;
        const key = obj._id.toString();
        return {
            ...obj,
            status: obj.association ? "assigned" : "available",
            history: logsByLivestockId.get(key) ?? [],
        };
    });
};

export const getAvailableLivestocks = async () => {
    const livestocks = await Livestock.find({
        deletedAt: null,
        association: null,
        assignedFarmer: null,
    })
        .select("propertyNumber animal breed condition status")
        .sort({ propertyNumber: 1 });

    return livestocks;
};

export const getLivestocks = async ({
    condition,
    status,
    search,
    associationId,
    all,
    page,
    limit,
    includeDeleted = false,
}) => {
    const filter = includeDeleted ? {} : { deletedAt: null };
    if (condition) filter.condition = condition;
    if (status) filter.$and = [{ association: status === "assigned" ? { $ne: null } : null }];
    if (associationId) filter.association = associationId;

    if (search) {
        filter.animal = new RegExp(escapeRegex(search), "i");
    }

    if (all) {
        const livestocks = await Livestock.find(filter)
            .populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE])
            .sort({ createdAt: -1 });

        return {
            livestocks: await attachHistory(livestocks, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [livestocks, total] = await Promise.all([
        Livestock.find(filter)
            .populate([{ path: "assignedFarmer", select: "firstName lastName" }, ASSOCIATION_POPULATE])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Livestock.countDocuments(filter),
    ]);

    return {
        livestocks: await attachHistory(livestocks, associationId),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
````

### backend/src/services/request.service.js

````js
import Request from "../models/request.model.js";
import User from "../models/user.model.js";
import Livestock from "../models/livestock.model.js";
import Equipment from "../models/equipment.model.js";
import Association from "../models/association.model.js";
import { createLog, getLogsForEntities, humanize } from "./log.service.js";
import emailQueue from "../queues/email.queue.js";
import { EMAIL_JOBS } from "../queues/email.jobs.js";
import { assertAssignable, BLOCKED_CONDITIONS } from "../utils/assignment.js";

const STAGE_ORDER = ["coordinator", "governor", "head"];

const ENTITY_MODELS = {
    livestock: Livestock,
    equipment: Equipment,
};

const ENTITY_SELECT = {
    livestock: "propertyNumber animal",
    equipment: "propertyNumber name",
};

const ASSOCIATION_POPULATE = { path: "association", select: "name" };

async function populateEntities(requests) {
    const idsByType = { livestock: new Set(), equipment: new Set() };

    for (const r of requests) {
        if (idsByType[r.entityType]) {
            for (const id of r.entityIds) {
                idsByType[r.entityType].add(String(id));
            }
        }
    }

    const [livestockDocs, equipmentDocs] = await Promise.all([
        idsByType.livestock.size
            ? Livestock.find({ _id: { $in: [...idsByType.livestock] } })
                .select(ENTITY_SELECT.livestock)
                .lean()
            : [],
        idsByType.equipment.size
            ? Equipment.find({ _id: { $in: [...idsByType.equipment] } })
                .select(ENTITY_SELECT.equipment)
                .lean()
            : [],
    ]);

    const entityMap = new Map();
    for (const doc of livestockDocs) entityMap.set(String(doc._id), doc);
    for (const doc of equipmentDocs) entityMap.set(String(doc._id), doc);

    return requests.map((r) => ({
        ...r,
        entities: r.entityIds
            .map((id) => entityMap.get(String(id)))
            .filter(Boolean),
    }));
}

// Mirrors attachRelatedRecords in farmer.service.js — pulls each
// request's audit trail from Log (entityType: "request") and merges it
// in as `history`, newest first (getLogsForEntities already sorts by
// createdAt desc).
async function attachHistory(requests, associationId) {
    const requestIds = requests.map((r) => r._id);

    if (!requestIds.length) return [];

    const logsByRequestId = await getLogsForEntities(
        "request",
        requestIds,
        associationId,
    );

    return requests.map((r) => {
        const key = r._id.toString();
        return {
            ...r,
            history: logsByRequestId.get(key) ?? [],
        };
    });
}

const resolveAssociationId = async (authenticatedUserId) => {
    if (!authenticatedUserId) return undefined;

    const association = await Association.findOne({
        user: authenticatedUserId,
        deletedAt: null,
    }).select("_id");

    return association?._id ?? undefined;
};

// Resolves the association's assigned user so approval/release/rejection
// emails have somewhere to go. Returns null (rather than throwing) when
// there's no association or no user email on file, so callers can just
// skip sending in that case — mirrors the tolerant "unaffiliated user"
// handling already used in createRequest's log message.
async function getAssociationRecipient(associationId) {
    if (!associationId) return null;

    const association = await Association.findById(associationId)
        .select("name user")
        .populate({ path: "user", select: "fullname email" });

    if (!association?.user?.email) return null;

    return {
        email: association.user.email,
        name: association.user.fullname || association.name || "there",
    };
}

function mapItemsForEmail(entityType, docs) {
    return docs.map((doc) => ({
        label: entityType === "livestock" ? doc.animal : doc.name,
        propertyNumber: doc.propertyNumber,
    }));
}

async function sendRequestApprovedEmail(request) {
    const recipient = await getAssociationRecipient(request.association);
    if (!recipient) return;

    const EntityModel = ENTITY_MODELS[request.entityType];
    const reservedDocs = await EntityModel.find({
        _id: { $in: request.entityIds },
        reservedBy: request._id,
    })
        .select(ENTITY_SELECT[request.entityType])
        .lean();

    await emailQueue.add(EMAIL_JOBS.REQUEST_APPROVED, {
        type: EMAIL_JOBS.REQUEST_APPROVED,
        data: {
            to: recipient.email,
            name: recipient.name,
            requestTitle: request.title,
            entityType: request.entityType,
            items: mapItemsForEmail(request.entityType, reservedDocs),
        },
    });
}

async function sendRequestReleasedEmail(request, releasedDocs, isPartial) {
    const recipient = await getAssociationRecipient(request.association);
    if (!recipient) return;

    await emailQueue.add(EMAIL_JOBS.REQUEST_RELEASED, {
        type: EMAIL_JOBS.REQUEST_RELEASED,
        data: {
            to: recipient.email,
            name: recipient.name,
            requestTitle: request.title,
            entityType: request.entityType,
            items: mapItemsForEmail(request.entityType, releasedDocs),
            isPartial,
        },
    });
}

async function sendRequestRejectedEmail(request, role, remarks) {
    const recipient = await getAssociationRecipient(request.association);
    if (!recipient) return;

    await emailQueue.add(EMAIL_JOBS.REQUEST_REJECTED, {
        type: EMAIL_JOBS.REQUEST_REJECTED,
        data: {
            to: recipient.email,
            name: recipient.name,
            requestTitle: request.title,
            stage: humanize(role),
            remarks: remarks || "",
        },
    });
}

export const createRequest = async (data, authenticatedUserId) => {
    const resolvedAssociationId = await resolveAssociationId(authenticatedUserId);

    const EntityModel = ENTITY_MODELS[data.entityType];
    const entityExists = await EntityModel.countDocuments({
        _id: { $in: data.entityIds },
        deletedAt: null,
    });
    if (entityExists !== data.entityIds.length) {
        const error = new Error(`One or more selected ${data.entityType} items were not found`);
        error.statusCode = 404;
        throw error;
    }
    await checkRequestConditions(data.entityType, data.entityIds);

    const request = await Request.create({
        ...data,
        association: resolvedAssociationId || undefined,
        approvalStatus: {
            coordinator: { status: "pending" },
        },
    });

    // Always logged on submission, regardless of whether the requester
    // belongs to an association — falls back to a generic subject rather
    // than skipping the log entirely.
    const association = request.association
        ? await Association.findById(request.association).select("name")
        : null;
    const submitterLabel = association?.name ?? "An unaffiliated user";

    await createLog({
        entityType: "request",
        entityId: request._id,
        association: request.association,
        message: `${submitterLabel} submitted a request "${request.title}" for ${humanize(request.entityType)}.`,
    });

    return request;
};

export const updateRequest = async (id, data) => {
    if (data.entityIds || data.entityType) {
        const previous = await Request.findOne({ _id: id, deletedAt: null });
        if (previous) await checkRequestConditions(data.entityType ?? previous.entityType, data.entityIds ?? previous.entityIds);
    }
    const request = await Request.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!request) {
        const notFoundError = new Error("Request not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    return request;
};

export const updateRequestApproval = async (id, { status, remarks }, actingUser) => {
    const role = actingUser?.role;

    if (!STAGE_ORDER.includes(role)) {
        const error = new Error("Only coordinator, governor, or head users can review requests");
        error.statusCode = 403;
        throw error;
    }

    const request = await Request.findOne({ _id: id, deletedAt: null });

    if (!request) {
        const notFoundError = new Error("Request not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    const currentStageEntry = request.approvalStatus?.[role];

    if (!currentStageEntry) {
        const error = new Error("This request is not currently awaiting your review");
        error.statusCode = 403;
        throw error;
    }

    if (currentStageEntry.status !== "pending") {
        const error = new Error("This stage has already been reviewed");
        error.statusCode = 409;
        throw error;
    }

    request.approvalStatus[role] = {
        status,
        approvedBy: actingUser._id,
        approvedAt: new Date(),
        remarks: remarks || "",
    };

    const stageLabel = humanize(role);
    const decisionVerb = status === "approved" ? "approved" : "denied";
    const remarksSuffix = remarks ? ` Remarks: "${remarks}"` : "";

    // Single decision log per stage — this is the log, full stop.
    // No separate "now awaiting the next stage" entry: the next
    // reviewer's own decision log, once they act, speaks for itself.
    await createLog({
        entityType: "request",
        entityId: request._id,
        association: request.association,
        message: `${stageLabel} has ${decisionVerb} the request "${request.title}".${remarksSuffix}`,
    });

    if (status === "approved") {
        if (role === "coordinator") {
            const nextStage = request.entityType === "livestock" ? "head" : "governor";
            request.approvalStatus[nextStage] = { status: "pending" };
        } else if (role === "governor") {
            request.approvalStatus.head = { status: "pending" };
        } else if (role === "head") {
            await reserveRequestItems(request);

            await createLog({
                entityType: "request",
                entityId: request._id,
                association: request.association,
                message: `Request "${request.title}" has been fully approved. ${request.entityIds.length} item(s) have been reserved pending release.`,
            });

            await sendRequestApprovedEmail(request);
        }
    } else if (status === "denied") {
        await sendRequestRejectedEmail(request, role, remarks);
    }

    await request.save();
    return request;
};

async function reserveRequestItems(request) {
    const EntityModel = ENTITY_MODELS[request.entityType];
    await checkRequestConditions(request.entityType, request.entityIds);

    await EntityModel.updateMany(
        {
            _id: { $in: request.entityIds },
            deletedAt: null,
            association: null,
            reservedBy: null,
            condition: { $nin: BLOCKED_CONDITIONS[request.entityType] },
        },
        { $set: { reservedBy: request._id } }
    );
}

export const releaseRequest = async (id) => {
    const request = await Request.findOne({ _id: id, deletedAt: null });

    if (!request) {
        const notFoundError = new Error("Request not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    if (request.approvalStatus?.head?.status !== "approved") {
        const error = new Error("Request must be fully approved before it can be released");
        error.statusCode = 409;
        throw error;
    }

    if (request.releaseStatus === "released") {
        const error = new Error("Request has already been fully released");
        error.statusCode = 409;
        throw error;
    }

    const EntityModel = ENTITY_MODELS[request.entityType];
    await checkRequestConditions(request.entityType, request.entityIds);

    // Select the display fields for this entity type up front (not just
    // _id) — needed below to write a readable per-item log once release
    // succeeds, without a second round-trip to re-fetch them.
    const availableDocs = await EntityModel.find({
        _id: { $in: request.entityIds },
        deletedAt: null,
        reservedBy: request._id,
    }).select(`_id ${ENTITY_SELECT[request.entityType]}`);

    const availableIds = availableDocs.map((doc) => doc._id);

    if (availableIds.length === 0) {
        await createLog({
            entityType: "request",
            entityId: request._id,
            association: request.association,
            message: `Release attempted for request "${request.title}" but no reserved items were available to release.`,
        });
        return request;
    }

    await EntityModel.updateMany(
        { _id: { $in: availableIds } },
        {
            $set: {
                association: request.association,
                status: request.association ? "assigned" : "available",
            },
            $unset: { reservedBy: "" },
        }
    );

    request.releaseStatus =
        availableIds.length === request.entityIds.length ? "released" : "partial";

    await request.save();

    const association = request.association
        ? await Association.findById(request.association).select("name")
        : null;
    const associationLabel = association?.name ?? "the association";

    // One log per released item, on the entity's own log (equipment or
    // livestock), so it shows up in that item's history alongside its
    // other assignment/return entries — not just as a single aggregate
    // count on the request's log.
    for (const doc of availableDocs) {
        const itemLabel =
            request.entityType === "livestock"
                ? `${doc.animal} (${doc.propertyNumber})`
                : `${doc.name} (${doc.propertyNumber})`;

        await createLog({
            entityType: request.entityType,
            entityId: doc._id,
            association: request.association,
            message: `${itemLabel} has been released from request "${request.title}" and added to ${associationLabel}.`,
        });
    }

    await sendRequestReleasedEmail(
        request,
        availableDocs,
        request.releaseStatus === "partial"
    );

    if (request.releaseStatus === "released") {
        await createLog({
            entityType: "request",
            entityId: request._id,
            association: request.association,
            message: `Request "${request.title}" has been fully released. All ${availableIds.length} item(s) have been added to the association.`,
        });
    } else {
        await createLog({
            entityType: "request",
            entityId: request._id,
            association: request.association,
            message: `Request "${request.title}" has been partially released. ${availableIds.length} of ${request.entityIds.length} item(s) were added to the association; the remainder are no longer available.`,
        });
    }

    return request;
};

export const deleteRequest = async (id) => {
    const request = await Request.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );

    if (!request) {
        const notFoundError = new Error("Request not found");
        notFoundError.statusCode = 404;
        throw notFoundError;
    }

    await createLog({
        entityType: "request",
        entityId: request._id,
        association: request.association,
        message: `Request "${request.title}" has been deleted.`,
    });

    return request;
};

async function checkRequestConditions(type, ids) {
    const docs = await ENTITY_MODELS[type].find({ _id: { $in: ids }, deletedAt: null }).select("condition");
    for (const doc of docs) assertAssignable(type, doc.condition);
}

function buildOverallStatusFilter(status) {
    const DENIED_AT_ANY_STAGE = [
        { "approvalStatus.coordinator.status": "denied" },
        { "approvalStatus.governor.status": "denied" },
        { "approvalStatus.head.status": "denied" },
    ];

    if (status === "denied") {
        return { $or: DENIED_AT_ANY_STAGE };
    }
    if (status === "approved") {
        return { "approvalStatus.head.status": "approved" };
    }
    return {
        $nor: [...DENIED_AT_ANY_STAGE, { "approvalStatus.head.status": "approved" }],
    };
}

export const getRequests = async ({
    status,
    severity,
    search,
    stage,
    associationId,
    all,
    page,
    limit,
    includeDeleted = false,
}) => {
    const filter = includeDeleted ? {} : { deletedAt: null };

    if (severity) filter.severity = severity;
    if (associationId) filter.association = associationId;
    if (search) filter.title = new RegExp(escapeRegex(search), "i");

    if (stage) filter[`approvalStatus.${stage}`] = { $exists: true };
    if (status) Object.assign(filter, buildOverallStatusFilter(status));

    if (all) {
        const requests = await Request.find(filter)
            .populate(ASSOCIATION_POPULATE)
            .sort({ createdAt: -1 })
            .lean();
        const withEntities = await populateEntities(requests);
        return {
            requests: await attachHistory(withEntities, associationId),
            pagination: null,
        };
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
        Request.find(filter)
            .populate(ASSOCIATION_POPULATE)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Request.countDocuments(filter),
    ]);

    const withEntities = await populateEntities(requests);

    return {
        requests: await attachHistory(withEntities, associationId),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
````

### backend/src/services/analyticsReportData.service.js

````js
import Equipment from "../models/equipment.model.js";
import Livestock from "../models/livestock.model.js";
import Farm from "../models/farm.model.js";
import Harvest from "../models/harvest.model.js";
import Association from "../models/association.model.js";
import Farmer from "../models/farmer.model.js";
import Crop from "../models/crop.model.js";

export const PERIOD_LABEL = { week: "This Week", month: "This Month", year: "This Year" };

/* ---------------- Helpers ---------------- */
export function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/* ---------------- Data fetchers ---------------- */

const buildEntityMatch = ({ associationId, start, end }) => ({
    deletedAt: null,
    ...(associationId && { association: associationId }),
    createdAt: { $gte: start, $lte: end },
});

const ENTITY_POPULATE = [
    { path: "association", select: "name" },
    { path: "assignedFarmer", select: "firstName lastName" },
];

export async function getEquipmentRows({ associationId, start, end }) {
    const docs = await Equipment.find(buildEntityMatch({ associationId, start, end }))
        .populate(ENTITY_POPULATE)
        .sort({ createdAt: 1 })
        .lean();

    return docs.map((e) => ({
        propertyNumber: e.propertyNumber,
        name: e.name,
        condition: e.condition,
        status: e.association ? "assigned" : "available",
        association: e.association?.name ?? "",
        assignedFarmer: e.assignedFarmer
            ? `${e.assignedFarmer.firstName} ${e.assignedFarmer.lastName}`
            : "",
        dateAdded: e.createdAt,
    }));
}

export async function getLivestockRows({ associationId, start, end }) {
    const docs = await Livestock.find(buildEntityMatch({ associationId, start, end }))
        .populate(ENTITY_POPULATE)
        .sort({ createdAt: 1 })
        .lean();

    return docs.map((l) => ({
        propertyNumber: l.propertyNumber,
        animal: l.animal,
        breed: l.breed,
        gender: l.gender,
        birthDate: l.birthDate,
        color: l.color,
        weight: l.weight,
        condition: l.condition,
        status: l.association ? "assigned" : "available",
        association: l.association?.name ?? "",
        assignedFarmer: l.assignedFarmer
            ? `${l.assignedFarmer.firstName} ${l.assignedFarmer.lastName}`
            : "",
        dateAdded: l.createdAt,
    }));
}

export async function getFarmRows({ associationId, start, end }) {
    const farmMatch = {
        deletedAt: null,
        ...(associationId && { association: associationId }),
    };

    const farms = await Farm.find(farmMatch)
        .populate({ path: "crops.crop", select: "name" })
        .lean();

    const farmIds = farms.map((f) => f._id);

    const harvestRows = await Harvest.aggregate([
        {
            $match: {
                farm: { $in: farmIds },
                harvestedAt: { $gte: start, $lte: end },
                ...(associationId && { association: associationId }),
            },
        },
        {
            $group: {
                _id: { farm: "$farm", crop: "$crop" },
                harvested: { $sum: "$quantity" },
                lastHarvestedAt: { $max: "$harvestedAt" },
            },
        },
    ]);

    const harvestByKey = new Map(
        harvestRows.map((r) => [
            `${r._id.farm}:${r._id.crop}`,
            { harvested: r.harvested, lastHarvestedAt: r.lastHarvestedAt },
        ]),
    );

    const rows = [];
    for (const farm of farms) {
        for (const c of farm.crops ?? []) {
            const updatedAt = c.updatedAt ? new Date(c.updatedAt) : null;
            const inPeriod = updatedAt && updatedAt >= start && updatedAt <= end;
            const key = `${farm._id}:${c.crop?._id}`;
            const harvestInfo = harvestByKey.get(key);

            if (!inPeriod && !harvestInfo) continue;

            rows.push({
                farm: `${farm.tag} - ${farm.address}`,
                crop: c.crop?.name ?? "Unknown crop",
                planted: c.quantities?.planted ?? 0,
                growing: c.quantities?.growing ?? 0,
                withered: c.quantities?.withered ?? 0,
                damaged: c.quantities?.damaged ?? 0,
                harvested: harvestInfo?.harvested ?? 0,
                plantedDate: c.createdAt,
                harvestedDate: harvestInfo?.lastHarvestedAt ?? null,
            });
        }
    }

    return rows;
}
````

### frontend/src/components/modal/AssignModal.jsx

````jsx
import { useState } from "react";
import { Button, Field, SingleSelect } from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { assignmentReason } from "@/utils/assignment";
import { z } from "zod";

export function AssignModal({ row, options = [], loading, onClose, onSave }) {
  const [farmer, setFarmer] = useState(row.assignedFarmer?._id || "");
  const reason = assignmentReason(row.animal ? "livestock" : "equipment", row.condition);

  const submit = (e) => {
    e.preventDefault();
    if (!z.string().min(1).refine(() => !reason).safeParse(farmer).success) return;
    onSave(farmer);
  };

  return (
    <ModalShell
      eyebrow={`Equipment · ${row.tag}`}
      title={`Assign ${row.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit" disabled={!!reason || loading}>
            Assign
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <Field label="Assigned Farmer" error={reason}>
          <SingleSelect
            value={farmer}
            onChange={setFarmer}
            options={options}
            disabled={loading || !!reason}
            placeholder={loading ? "Loading farmers…" : "Select farmer…"}
            searchPlaceholder="Search farmer…"
          />
        </Field>
      </form>
    </ModalShell>
  );
}
````

### frontend/src/components/ui/MultiSelect.jsx

````jsx
import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Plus } from "lucide-react";

export function MultiSelect({
  values,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  allowCreate = false,
  onCreate,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  const selectedOptions = useMemo(
    () => values.map((v) => options.find((o) => o.value === v)).filter(Boolean),
    [values, options],
  );

  const filtered = useMemo(
    () =>
      options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())),
    [q, options],
  );

  const trimmed = q.trim();
  const exactMatch = useMemo(
    () => options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase()),
    [options, trimmed],
  );
  // Only offer "create" once search has genuinely turned up nothing.
  const canCreate =
    allowCreate && trimmed.length > 0 && filtered.length === 0 && !exactMatch;

  const toggle = (o) => {
    if (o.disabled) return;
    if (values.includes(o.value)) onChange(values.filter((v) => v !== o.value));
    else onChange([...values, o.value]);
  };

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate?.(trimmed);
    if (!values.includes(trimmed)) onChange([...values, trimmed]);
    setQ("");
  };

  const remove = (value) => onChange(values.filter((v) => v !== value));

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 border border-border bg-surface px-3 py-2.5 text-left text-sm hover:border-foreground-40"
      >
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {selectedOptions.length === 0 ? (
            <span className="text-secondary">{placeholder}</span>
          ) : (
            selectedOptions.map((o) => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1 border border-border bg-accent-soft px-2 py-0.5 text-xs font-semibold text-foreground"
              >
                {o.label}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(o.value);
                  }}
                  className="cursor-pointer text-secondary hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 border border-border bg-surface shadow-lg">
          <div className="relative border-b border-border">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCreate) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-surface py-2.5 pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-auto">
            {filtered.length === 0 && !canCreate ? (
              <li className="px-3 py-3 text-sm text-secondary">No results.</li>
            ) : (
              filtered.map((o) => {
                const selected = values.includes(o.value);
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      disabled={o.disabled}
                      title={o.reason}
                      onClick={() => toggle(o)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                        selected ? "bg-accent-soft font-semibold" : ""
                      }`}
                    >
                      {o.label}
                      {selected && <span className="h-1.5 w-1.5 bg-accent" />}
                    </button>
                  </li>
                );
              })
            )}
            {canCreate && (
              <li className="border-t border-border">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-accent hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                  Add &ldquo;{trimmed}&rdquo;
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
````

### frontend/src/components/modal/RequestDrawer.jsx

````jsx
import { X, Info, Package, FileText, Calendar } from "lucide-react";
import { DefList, Section } from "@/components/drawer";
import { StatusPill } from "@/components/public";
import { typeLabel, typeTone, sevTone, sevLabel } from "@/constants/data";
import {
  getDisplayStatus,
  statusTone,
  statusLabel,
  releaseStatusTone,
  releaseStatusLabel,
} from "@/utils/request";
import { fmtDate } from "@/utils/format";
import { Button } from "@/components/ui";

export function RequestDrawer({ row, onClose, onApprove, onDeny }) {
  const displayStatus = getDisplayStatus(row);
  const entities = row.entities ?? [];
  const history = row.history ?? [];

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
              <div className="label-eyebrow mb-1">Request · {row._id}</div>
              <h2 className="font-display text-xl tracking-tight text-foreground truncate">
                {row.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill tone={sevTone[row.severity]}>
                  {sevLabel[row.severity]}
                </StatusPill>
                <StatusPill tone={statusTone[displayStatus]}>
                  {statusLabel[displayStatus]}
                </StatusPill>
                {displayStatus === "approved" && (
                  <StatusPill tone={releaseStatusTone[row.releaseStatus]}>
                    {releaseStatusLabel[row.releaseStatus]}
                  </StatusPill>
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
          <Section icon={Info} title="Basic Information">
            <DefList
              items={[
                ["Association", row.association?.name ?? "Unaffiliated"],
                ["Title", row.title],
                ["Type", typeLabel[row.entityType]],
                ["Severity", sevLabel[row.severity]],
                ["Status", statusLabel[displayStatus]],
                ["Submitted", fmtDate(row.createdAt)],
              ]}
            />
          </Section>

          <Section
            icon={Package}
            title={`Requested ${typeLabel[row.entityType]}`}
          >
            {entities.length ? (
              <div className="space-y-2">
                {entities.map((e) => (
                  <div
                    key={e._id}
                    className="flex items-center justify-between gap-3 border border-border bg-muted-30 p-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {e.propertyNumber}
                      </div>
                      <div className="text-xs text-secondary">
                        {row.entityType === "livestock" ? e.animal : e.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-secondary">
                No items resolved for this request.
              </div>
            )}
          </Section>

          <Section icon={FileText} title="Details">
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {row.details || "No additional details provided."}
            </p>
          </Section>

          <Section icon={Calendar} title="Activity Timeline">
            {history.length ? (
              <ol className="relative ml-2 border-l border-border">
                {history.map((entry, i) => (
                  <li key={i} className="relative pl-5 pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 bg-accent" />
                    <div className="text-sm text-foreground">
                      {entry.message}
                    </div>
                    <div className="text-xs text-secondary">
                      {fmtDate(entry.date)}
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
````

### frontend/src/components/modal/ReportDrawer.jsx

````jsx
import { Calendar, ClipboardList, FileText, Info, X } from "lucide-react";
import { DefList, Section } from "@/components/drawer";
import { StatusPill } from "@/components/public";
import { fmtDate } from "@/utils/format";
import { typeTone, typeLabel, sevTone, sevLabel } from "@/constants/data";
import { getReportStatus, statusTone, statusLabel } from "@/utils/report";
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
  const items = row.items ?? [];
  const files = row.attachments ?? row.files ?? [];
  const history = row.history ?? [];
  const submitterRole = submittedByRole(row);

  const reviewEntries = ["aew", "coordinator"]
    .map((stage) => ({ stage, entry: row.approvalStatus?.[stage] }))
    .filter(({ entry }) => entry && entry.status !== "pending");

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
                <StatusPill tone={sevTone[row.severity]}>
                  {sevLabel[row.severity]}
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
                ["Condition", row.condition ?? "—"],
                ["Severity", sevLabel[row.severity]],
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
                    key={item._id}
                    className="border border-border bg-muted-30 px-3 py-2 text-sm text-foreground"
                  >
                    {itemLabel(row.entityType, item)}
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
````

### frontend/src/hooks/useRequests.js

````js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getRequests,
    createRequest,
    updateRequest,
    updateRequestApproval,
    releaseRequest,
    deleteRequest,
} from "@/services/request.service";
import { equipmentKeys } from "@/hooks/useEquipments";
import { livestockKeys } from "@/hooks/useLivestocks";

/* ---------------- Query Keys ---------------- */
export const requestKeys = {
    all: ["requests"],
    lists: () => [...requestKeys.all, "list"],
    list: (filters) => [...requestKeys.lists(), filters],
    details: () => [...requestKeys.all, "detail"],
    detail: (id) => [...requestKeys.details(), id],
};

/* ---------------- Queries ---------------- */
export function useRequests(filters = {}, options = {}) {
    return useQuery({
        queryKey: requestKeys.list(filters),
        queryFn: () => getRequests(filters),
        keepPreviousData: true,
        ...options,
    });
}

/* ---------------- Mutations ---------------- */
export function useCreateRequest(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createRequest(data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateRequest(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => updateRequest(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: requestKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useUpdateRequestApproval(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => updateRequestApproval(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
            queryClient.invalidateQueries({ queryKey: livestockKeys.all });
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: requestKeys.detail(variables.id),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useReleaseRequest(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => releaseRequest(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
            queryClient.invalidateQueries({ queryKey: livestockKeys.all });
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: requestKeys.detail(variables),
            });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}

export function useDeleteRequest(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteRequest(id),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
            queryClient.removeQueries({ queryKey: requestKeys.detail(variables) });
            options.onSuccess?.(data, variables, context);
        },
        onError: options.onError,
    });
}
````

### backend/test/requested-updates.test.js

````js
import assert from "node:assert/strict";
import { mock, test } from "node:test";
import Equipment from "../src/models/equipment.model.js";
import Livestock from "../src/models/livestock.model.js";
import Farmer from "../src/models/farmer.model.js";
import Association from "../src/models/association.model.js";
import Log from "../src/models/log.model.js";
import Request from "../src/models/request.model.js";
import Report from "../src/models/report.model.js";
import { createFarmerSchema, updateFarmerSchema } from "../src/schemas/farmer.schema.js";
import { createEquipmentSchema, updateEquipmentSchema } from "../src/schemas/equipment.schema.js";
import { createLivestockSchema } from "../src/schemas/livestock.schema.js";
import { createAssociationSchema } from "../src/schemas/association.schema.js";
import { getReportsQuerySchema } from "../src/schemas/report.schema.js";
import { exportAnalyticsPdfQuerySchema, exportAnalyticsExcelQuerySchema } from "../src/schemas/analytics.schema.js";
import { isMeaningfulName } from "../src/utils/meaningfulName.js";
import { isMeaningfulName as frontendMeaningfulName } from "../../frontend/src/utils/meaningfulName.js";
import { fmtPendingSince } from "../../frontend/src/utils/format.js";
import { createFarmerUpdateSchema as frontendFarmerUpdateSchema } from "../../frontend/src/schemas/farmer.schema.js";
import { errorHandler } from "../src/middlewares/error.middleware.js";
import { createEquipment, updateEquipment, getEquipments } from "../src/services/equipment.service.js";
import { createLivestock, updateLivestock } from "../src/services/livestock.service.js";
import { createFarmer, updateFarmer } from "../src/services/farmer.service.js";
import { createAssociation, updateAssociation } from "../src/services/association.service.js";

mock.module("../src/queues/email.queue.js", { defaultExport: { add: async () => {} } });
const { createRequest, releaseRequest } = await import("../src/services/request.service.js");
const { getReports } = await import("../src/services/report.service.js");

const id = "012345678901234567890123";
const associationId = "012345678901234567890124";
const otherId = "012345678901234567890125";
const conflict = (message) => (error) => error.statusCode === 409 && error.message === message;
const query = (result) => ({ select: () => Promise.resolve(result) });
const listQuery = (result) => ({ populate() { return this; }, sort() { return this; }, lean: async () => result });

test("meaningful names have identical frontend/backend rules", () => {
    for (const name of ["abc", "Abc", "123", "Asdf", "Test", "farmers association", "FARMERS ASSOCIATION", "AaAa", "Brr", "A1", ""]) {
        assert.equal(isMeaningfulName(name), false, name);
        assert.equal(frontendMeaningfulName(name), false, name);
    }
    for (const name of ["Sta. Rosa Farmers Association", "Damaged Tractor Report", "Rice Pest Outbreak"]) {
        assert.equal(isMeaningfulName(name), true, name);
        assert.equal(frontendMeaningfulName(name), true, name);
    }
});

test("contact number is exactly 11 digits starting with 09", () => {
    const schema = createFarmerSchema.shape.contactNumber;
    assert.equal(schema.safeParse("09123456789").success, true);
    for (const value of ["08123456789", "0912345678", "091234567890", "+639123456789", "09abcdefghi", "", undefined]) {
        const result = schema.safeParse(value);
        assert.equal(result.success, false);
        assert.equal(result.error.issues[0].message, "Contact number must be 11 digits and start with 09");
    }
});

test("partial farmer updates preserve existing position and legacy attachments", () => {
    assert.deepEqual(updateFarmerSchema.parse({ firstName: "Juan" }), { firstName: "Juan" });
});

test("frontend contact and single-image validation match backend restrictions", () => {
    const schema = frontendFarmerUpdateSchema();
    assert.equal(schema.safeParse({ contact: "09123456789" }).success, true);
    assert.equal(schema.safeParse({ contact: "08123456789" }).success, false);
    assert.equal(schema.safeParse({ profileImage: [{ file: new File(["image"], "avatar.png", { type: "image/png" }) }] }).success, true);
    assert.equal(schema.safeParse({ profileImage: [{ file: new File(["text"], "notes.txt", { type: "text/plain" }) }] }).success, false);
    const image = { url: "https://example.com/avatar.jpg", publicId: "avatar", resourceType: "image" };
    assert.equal(schema.safeParse({ profileImage: [image, image] }).success, false);
});

test("unique indexes protect active positions and location pairs from concurrent writes", () => {
    const [, positionOptions] = Farmer.schema.indexes().find(([keys]) => keys.association && keys.position);
    assert.equal(positionOptions.unique, true);
    assert.equal(positionOptions.partialFilterExpression.position.$in.includes("member"), false);
    assert.equal(positionOptions.partialFilterExpression.position.$in.includes("director"), false);
    const [, locationOptions] = Association.schema.indexes().find(([keys]) => keys.municipality && keys.barangay);
    assert.equal(locationOptions.unique, true);
    assert.equal(locationOptions.collation.strength, 2);
});

test("concurrent duplicate writes return the same field-friendly 409 messages", (t) => {
    t.mock.method(console, "error", () => {});
    for (const [keyPattern, message] of [
        [{ propertyNumber: 1 }, "Property number is already in use"],
        [{ association: 1, position: 1 }, "This position is already taken in this association"],
        [{ municipality: 1, barangay: 1 }, "This municipality and barangay is already assigned to another association"],
    ]) {
        let status;
        const res = { status(value) { status = value; return this; }, json(body) { assert.equal(body.message, message); } };
        errorHandler({ code: 11000, keyPattern }, {}, res, () => {});
        assert.equal(status, 409);
    }
});

test("profile image only accepts a single image asset", () => {
    const image = { url: "https://example.com/avatar.jpg", publicId: "farmer/avatar", resourceType: "image" };
    assert.deepEqual(createFarmerSchema.shape.profileImage.parse(image), image);
    assert.equal(createFarmerSchema.shape.profileImage.safeParse({ ...image, resourceType: "raw" }).success, false);
    assert.equal(createFarmerSchema.shape.profileImage.safeParse([image, image]).success, false);
    assert.equal(createFarmerSchema.shape.profileImage.safeParse(null).success, true);
});

test("association location is validated", () => {
    const data = { name: "Sta. Rosa Farmers Association", municipality: "Boac", barangay: "Bantad" };
    assert.equal(createAssociationSchema.safeParse(data).success, true);
    assert.equal(createAssociationSchema.safeParse({ ...data, barangay: "" }).success, false);
});

test("equipment assignment no longer requires an assigned farmer", () => {
    assert.equal(createEquipmentSchema.safeParse({ propertyNumber: "EQ-1", name: "Tractor", associationId, status: "assigned" }).success, true);
    assert.equal(updateEquipmentSchema.safeParse({ status: "assigned", associationId }).success, true);
    for (const condition of ["damaged", "unusable", "maintenance"]) {
        assert.equal(createEquipmentSchema.safeParse({ propertyNumber: "EQ-1", name: "Tractor", associationId, condition }).success, false);
    }
});

test("livestock assignment rejects poor health in the validator", () => {
    const data = { propertyNumber: "LV-1", animal: "Cow", breed: "Angus", gender: "female", birthDate: "2026-01-01", color: "Brown", weight: 100, associationId };
    assert.equal(createLivestockSchema.safeParse({ ...data, status: "assigned" }).success, true);
    for (const condition of ["deceased", "injured", "sick"]) {
        assert.equal(createLivestockSchema.safeParse({ ...data, condition }).success, false);
    }
});

test("model status follows association and mortality timestamps follow health", async () => {
    const equipment = new Equipment({ propertyNumber: "EQ-1", name: "Tractor", association: associationId });
    await equipment.validate();
    assert.equal(equipment.status, "assigned");
    equipment.association = null;
    equipment.assignedFarmer = id;
    await equipment.validate();
    assert.equal(equipment.status, "available");
    const livestock = new Livestock({ propertyNumber: "LV-1", animal: "Cow", breed: "Angus", gender: "female", birthDate: new Date(), color: "Brown", weight: 100, condition: "deceased", association: associationId });
    await livestock.validate();
    assert.equal(livestock.status, "assigned");
    const date = livestock.deceasedAt;
    assert.ok(date instanceof Date);
    await livestock.validate();
    assert.equal(livestock.deceasedAt.getTime(), date.getTime());
    livestock.condition = "healthy";
    await livestock.validate();
    assert.equal(livestock.deceasedAt, null);
});

for (const [name, Model, create, update] of [["equipment", Equipment, createEquipment, updateEquipment], ["livestock", Livestock, createLivestock, updateLivestock]]) {
    test(`${name} property number conflicts return 409 and exclude self on edit`, async (t) => {
        let filter;
        t.mock.method(Model, "findOne", (value) => { filter = value; return Promise.resolve({ _id: otherId }); });
        await assert.rejects(create({ propertyNumber: "PROP-1" }), conflict("Property number is already in use"));
        await assert.rejects(update(id, { propertyNumber: "PROP-1" }), conflict("Property number is already in use"));
        assert.deepEqual(filter._id, { $ne: id });
    });

    test(`${name} service blocks assigning an item in poor condition`, async (t) => {
        const condition = name === "equipment" ? "damaged" : "sick";
        t.mock.method(Model, "findOne", () => query({ condition }));
        await assert.rejects(update(id, { associationId }), conflict(`Not assignable: ${condition}`));
    });

    test(`${name} service derives status even when the caller supplies the wrong status`, async (t) => {
        t.mock.method(Model, "findOne", () => query({ association: associationId, condition: name === "equipment" ? "good" : "healthy" }));
        let written;
        t.mock.method(Model, "findOneAndUpdate", (filter, update) => {
            written = update;
            return { populate: async () => ({ _id: id, association: associationId, status: update.$set.status }) };
        });
        await update(id, { status: "available" });
        assert.equal(written.$set.status, "assigned");
    });
}

test("livestock service sets and clears deceasedAt on health updates", async (t) => {
    let previous = { association: associationId, condition: "healthy" };
    let written;
    t.mock.method(Livestock, "findOne", () => query(previous));
    t.mock.method(Log, "create", async () => ({}));
    t.mock.method(Livestock, "findOneAndUpdate", (filter, update) => {
        written = update;
        return { populate: async () => ({ _id: id, association: associationId, ...update.$set }) };
    });
    await updateLivestock(id, { condition: "deceased" });
    assert.ok(written.$set.deceasedAt instanceof Date);
    previous = { ...previous, condition: "deceased", deceasedAt: written.$set.deceasedAt };
    await updateLivestock(id, { condition: "deceased" });
    assert.equal(written.$set.deceasedAt, previous.deceasedAt);
    await updateLivestock(id, { condition: "healthy" });
    assert.equal(written.$set.deceasedAt, null);
});

test("unique association officer positions are checked on create and edit", async (t) => {
    let filter;
    t.mock.method(Farmer, "exists", async (value) => { filter = value; return { _id: otherId }; });
    t.mock.method(Farmer, "findOne", () => query({ association: associationId, position: "president" }));
    for (const position of ["president", "vice_president", "secretary", "treasurer", "auditor", "pio", "project_manager"]) {
        await assert.rejects(createFarmer({ associationId, position }), conflict("This position is already taken in this association"));
    }
    await assert.rejects(updateFarmer(id, { associationId }), conflict("This position is already taken in this association"));
    assert.deepEqual(filter._id, { $ne: id });
});

test("member and director positions may repeat", async (t) => {
    const exists = t.mock.method(Farmer, "exists", async () => { throw new Error("Should not check repeatable positions"); });
    t.mock.method(Farmer, "create", async () => ({ _id: id, getFullName: () => "Juan Dela Cruz" }));
    t.mock.method(Log, "create", async () => ({}));
    for (const position of ["member", "director"]) await createFarmer({ associationId, position });
    assert.equal(exists.mock.callCount(), 0);
});

test("association municipality/barangay conflicts exclude self on edit", async (t) => {
    let filter;
    t.mock.method(Association, "exists", async (value) => { filter = value; return { _id: otherId }; });
    t.mock.method(Association, "findOne", async () => ({ municipality: "Boac", barangay: "Bantad" }));
    const message = "This municipality and barangay is already assigned to another association";
    await assert.rejects(createAssociation({ name: "Sta. Rosa Farmers Association", municipality: "Boac", barangay: "Bantad" }), conflict(message));
    await assert.rejects(updateAssociation(id, { barangay: "Bantad" }), conflict(message));
    assert.deepEqual(filter._id, { $ne: id });
    assert.equal(filter.municipality.test("BOAC"), true);
});

test("pending duration handles days, hours, minutes, invalid and future dates", () => {
    const now = Date.parse("2026-10-21T12:00:00Z");
    assert.equal(fmtPendingSince("2026-10-18T08:00:00Z", now), "3d 4h");
    assert.equal(fmtPendingSince("2026-10-21T06:40:00Z", now), "5h 20m");
    assert.equal(fmtPendingSince("2026-10-21T11:40:00Z", now), "20m");
    assert.equal(fmtPendingSince("2026-10-21T11:59:59Z", now), "just now");
    assert.equal(fmtPendingSince("2027-01-01", now), "just now");
    assert.equal(fmtPendingSince("invalid", now), "—");
});

test("status filter remains effective when association scoping is also present", async (t) => {
    let filter;
    t.mock.method(Equipment, "find", (value) => { filter = value; return { populate() { return this; }, sort: async () => [] }; });
    await getEquipments({ all: true, status: "available", associationId });
    assert.equal(filter.association, associationId);
    assert.deepEqual(filter.$and, [{ association: null }]);
});

test("request creation and release reject poor-condition items", async (t) => {
    t.mock.method(Equipment, "countDocuments", async () => 1);
    t.mock.method(Equipment, "find", () => query([{ condition: "maintenance" }]));
    await assert.rejects(createRequest({ entityType: "equipment", entityIds: [id] }), conflict("Not assignable: maintenance"));
    t.mock.method(Request, "findOne", async () => ({ entityType: "equipment", entityIds: [id], approvalStatus: { head: { status: "approved" } } }));
    await assert.rejects(releaseRequest(id), conflict("Not assignable: maintenance"));
});

test("report filters use stored farm type, severity and the browser's calendar date", async (t) => {
    let filter;
    t.mock.method(Report, "find", (value) => { filter = value; return listQuery([]); });
    const params = getReportsQuerySchema.parse({ entityType: "farm", severity: "high", date: "2026-10-21", timezoneOffset: "-480", all: "true" });
    await getReports(params);
    assert.equal(filter.entityType, "farm");
    assert.equal(filter.severity, "high");
    assert.equal(filter.createdAt.$gte.toISOString(), "2026-10-20T16:00:00.000Z");
    assert.equal(filter.createdAt.$lt.toISOString(), "2026-10-21T16:00:00.000Z");
    await getReports({ all: true, entityType: "equipment", associationId });
    assert.equal(filter.entityType, "equipment");
    assert.equal(filter.association, associationId);
});

test("analytics PDF and Excel exports support All, Crop, Equipment and Livestock", () => {
    for (const schema of [exportAnalyticsPdfQuerySchema, exportAnalyticsExcelQuerySchema]) {
        assert.equal(schema.parse({}).section, "all");
        for (const section of ["all", "farm", "equipment", "livestock"]) {
            const result = schema.parse({ section, association: associationId, period: "year" });
            assert.equal(result.section, section);
            assert.equal(result.association, associationId);
            assert.equal(result.period, "year");
        }
        assert.equal(schema.safeParse({ section: "invalid" }).success, false);
    }
});
````

## New files

- backend/src/utils/assignment.js
- backend/src/utils/meaningfulName.js
- backend/test/requested-updates.test.js
- frontend/src/utils/assignment.js
- frontend/src/utils/meaningfulName.js
- deliverables/AgriCentral-updates.md (this full-file deliverable)

## Assumptions

- Uniqueness applies to non-archived records (deletedAt: null). Inactive but non-archived farmers still occupy an officer position; member/director are exempt. No records were renamed, migrated, or deduplicated. Existing officer duplicates, if present, require authorized cleanup before MongoDB can build the new officer index; the service checks are also enforced.
- Existing association is the status source; no assignedAssociation field was added and assignedFarmer was retained. Blocked-condition rules prevent new assignments/reassignments, but allow recording deterioration/death of already-assigned items.
- Associations lacked municipality/barangay. New forms require them; existing records remain unchanged until edited. Field/TextInput was the closest existing pattern, since there is no municipality/barangay picker.
- Crop reports are stored with entityType: farm; Crop remains the visible label. The two-step export modal is on AnalyticsPage only. Crop uses section: farm because analytics already exports crop/yield rows through that section. Existing PDF/XLSX endpoints already filter by section; no new backend export API is needed. Icon-and-label choices reuse Button outline styling inside ModalShell instead of the compact icon-only IconButton so every choice is readable. ExportDropdown and section-level export controls are unchanged.
- Specific report dates are interpreted using the browser's calendar-day timezone offset, while backend-only callers default to UTC. No historical deceased date is inferred; the Mortality cell shows Date unknown when legacy deceasedAt is absent.
- No Crop Condition label exists in the requested crop files/constants on this checkout, and no livestock date column exists on LivestocksPage. No unrelated labels or extra date column were introduced. DeleteConfirmModal already used Archive wording.
- Profile images reuse the existing FarmerDrawer avatar location and FileUploader/Cloudinary flow; legacy attachments remain stored and visible in Uploaded Files.

## Styling confirmation

No existing styling, class values, colors, typography, spacing, CSS/configuration, or visual variants were changed. Existing component structure/layout was preserved except for explicitly requested additions/replacements/reordering. New controls, image, error messages, suggestion buttons, table columns, and drawer action areas reuse existing components/classes/patterns. No dependencies, theme tokens, CSS files, or Tailwind configuration were added or modified.
