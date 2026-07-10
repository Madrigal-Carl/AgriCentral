import { useMemo } from "react";
import useAuth from "@/hooks/useAuth";

const PERMISSIONS = {
    farmers: {
        far: { view: true, add: true, edit: true, delete: true },
        aew: { view: true, add: true, edit: true, delete: true },
        coordinator: { view: true, add: true, edit: true, delete: true },
        admin: { view: true, add: true, edit: true, delete: true },
    },
    farms: {
        far: { view: true, add: true, edit: true, delete: true },
        aew: { view: true, add: false, edit: false, delete: false },
        head: { view: true, add: false, edit: false, delete: false },
        admin: { view: true, add: true, edit: true, delete: true },
    },
    equipments: {
        far: { view: true, add: true, edit: true, delete: true },
        aew: { view: true, add: false, edit: false, delete: false },
        coordinator: { view: true, add: true, edit: true, delete: true },
        admin: { view: true, add: true, edit: true, delete: true },
    },
    livestocks: {
        far: { view: true, add: true, edit: true, delete: true },
        aew: { view: true, add: false, edit: false, delete: false },
        coordinator: { view: true, add: true, edit: true, delete: true },
        admin: { view: true, add: true, edit: true, delete: true },
    },
    requests: {
        far: { view: true, add: true, edit: true, delete: true, review: false },
        admin: { view: true, add: false, edit: false, delete: false, review: false },
        governor: { view: true, add: false, edit: false, delete: false, review: true },
        head: { view: true, add: false, edit: false, delete: false, review: true },
        coordinator: { view: true, add: false, edit: false, delete: false, review: true },
    },
};

const DEFAULT_CAPABILITIES = {
    view: true,
    add: false,
    edit: false,
    delete: false,
    review: true,
};

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