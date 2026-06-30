import { LayoutGrid, Users, Wheat, Tractor, Beef, Map, FileText, UserCircle2, Settings, ClipboardList } from "lucide-react";

/* ---------------- FAR ---------------- */
export const farNavSections = [
    {
        label: "Dashboard",
        items: [{ to: "/far/overview", label: "Overview", icon: LayoutGrid, exact: true }],
    },
    {
        label: "Management",
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
    "/far/farmers": { group: "Management", label: "Farmer" },
    "/far/farms": { group: "Management", label: "Farm" },
    "/far/equipments": { group: "Resources", label: "Equipment" },
    "/far/livestocks": { group: "Resources", label: "Livestock" },
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
        label: "Community",
        items: [
            { to: "/aew/associations", label: "Association", icon: UserCircle2 },
        ],
    },
    {
        label: "Management",
        items: [
            { to: "/aew/farmers", label: "Farmer", icon: Users },
            { to: "/aew/farms", label: "Farm", icon: Wheat },
        ],
    },
    {
        label: "Resources",
        items: [
            { to: "/aew/equipments", label: "Equipment", icon: Tractor },
            { to: "/aew/livestocks", label: "Livestock", icon: Beef },
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
};

/* ---------------- COORDINATOR ---------------- */
export const coordinatorNavSections = [
    {
        label: "Dashboard",
        items: [{ to: "/coordinator/overview", label: "Overview", icon: LayoutGrid, exact: true }],
    },
];

const coordinatorBreadcrumbs = {
    "/coordinator/overview": { group: "Dashboard", label: "Overview" },
};

/* ---------------- GOVERNOR ---------------- */
export const governorNavSections = [
    {
        label: "Dashboard",
        items: [{ to: "/governor/overview", label: "Overview", icon: LayoutGrid, exact: true }],
    },
];

const governorBreadcrumbs = {
    "/governor/overview": { group: "Dashboard", label: "Overview" },
};

/* ---------------- HEAD ---------------- */
export const headNavSections = [
    {
        label: "Dashboard",
        items: [{ to: "/head/overview", label: "Overview", icon: LayoutGrid, exact: true }],
    },
];

const headBreadcrumbs = {
    "/head/overview": { group: "Dashboard", label: "Overview" },
};

/* ---------------- ADMIN ---------------- */
export const adminNavSections = [
    {
        label: "Dashboard",
        items: [{ to: "/admin/overview", label: "Overview", icon: LayoutGrid, exact: true }],
    },
];

const adminBreadcrumbs = {
    "/admin/overview": { group: "Dashboard", label: "Overview" },
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