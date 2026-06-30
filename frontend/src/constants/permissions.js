import { useMemo } from "react";
import useAuth from "@/hooks/useAuth";

const PERMISSIONS = {
    farmers: {
        far: { view: true, add: true, edit: true, delete: true },
        aew: { view: true, add: false, edit: false, delete: false },
    },
    farms: {
        far: { view: true, add: true, edit: true, delete: true },
        aew: { view: true, add: false, edit: false, delete: false },
    },
    equipments: {
        far: { view: true, add: true, edit: true, delete: true },
        aew: { view: true, add: false, edit: false, delete: false },
    },
    livestocks: {
        far: { view: true, add: true, edit: true, delete: true },
        aew: { view: true, add: false, edit: false, delete: false },
    },
};

const DEFAULT_CAPABILITIES = { view: true, add: false, edit: false, delete: false };

function normalizeRole(role) {
    return role ? String(role).toLowerCase() : "";
}

export function getCapabilities(resource, role) {
    const roleKey = normalizeRole(role);
    const resourceConfig = PERMISSIONS[resource];
    if (!resourceConfig) return DEFAULT_CAPABILITIES;
    return resourceConfig[roleKey] ?? DEFAULT_CAPABILITIES;
}

export function usePermissions(resource) {
    const { user, role: roleFromAuth } = useAuth();
    const role = roleFromAuth ?? user?.role;

    return useMemo(() => getCapabilities(resource, role), [resource, role]);
}