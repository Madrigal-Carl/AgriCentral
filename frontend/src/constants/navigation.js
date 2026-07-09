import { LayoutGrid, Users, Wheat, Tractor, Beef, Map, FileText, UserCircle2, Settings, ClipboardList, UserCog, BarChart3, Building2 } from "lucide-react";

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
        label: "Management",
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
    "/aew/farms": { group: "Management", label: "Farm" },
    "/aew/farmers": { group: "Management", label: "Farmer" },
    "/aew/associations": {
        group: "Management",
        label: "Association",
    },
    "/aew/equipments": { group: "Resources", label: "Equipment" },
    "/aew/livestocks": { group: "Resources", label: "Livestock" },
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
        label: "Management",
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
        group: "Management",
        label: "Farmer",
    },
    "/coordinator/associations": {
        group: "Management",
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
        label: "Management",
        items: [
            {
                to: "/head/farms",
                label: "Farm",
                icon: Wheat,
            },
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
        group: "Management",
        label: "Farm",
    },
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
        label: "Management",
        items: [
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
            {
                to: "/admin/users",
                label: "User",
                icon: UserCog,
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
        group: "Management",
        label: "Farm",
    },
    "/admin/farmers": {
        group: "Management",
        label: "Farmer",
    },
    "/admin/associations": {
        group: "Management",
        label: "Association",
    },
    "/admin/users": {
        group: "Management",
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