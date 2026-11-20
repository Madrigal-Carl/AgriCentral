import { ROLE_ROUTES } from "@/constants/routes";
import { getBreadcrumbsForRole, resolveRoleKey } from "@/constants/navigation";
import { maintenanceConfig } from "@/constants/maintenance";
import { VIEW_PARAM } from "@/hooks/useViewRecord";

// Notification entityType -> page segment under the role's base route.
const ENTITY_PAGES = {
    report: "reports",
    request: "requests",
    farm: "farms",
    farmer: "farmers",
    equipment: "equipments",
    livestock: "livestocks",
    crop: "crops",
    maintenance: "maintenance",
};

// Maintenance logs read "<type>: <name> ...", e.g. "barangays: Poblacion created.".
const maintenanceTab = (message = "") =>
    Object.entries(maintenanceConfig).find(([, config]) => message.startsWith(`${config.type}:`))?.[0];

// Page (with ?view=<entityId>) for a notification, or null when the user's
// role has no page for that record type.
export function notificationLink({ entityType, entityId, message }, role) {
    const roleKey = resolveRoleKey(role);
    const overview = ROLE_ROUTES[roleKey];
    const segment = ENTITY_PAGES[entityType];
    if (!overview || !segment || !entityId) return null;

    const path = `${overview.slice(0, overview.lastIndexOf("/"))}/${segment}`;
    if (!getBreadcrumbsForRole(roleKey)[path]) return null;

    const params = new URLSearchParams();
    if (entityType === "maintenance") {
        const tab = maintenanceTab(message);
        if (tab) params.set("tab", tab);
    }
    params.set(VIEW_PARAM, entityId);
    return `${path}?${params}`;
}
