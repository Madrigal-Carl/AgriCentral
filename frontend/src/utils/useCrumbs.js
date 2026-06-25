import { useLocation } from "react-router-dom";
import { allBreadcrumbs } from "@/constants/navigation";

export function useCrumbs() {
    const { pathname } = useLocation();
    return allBreadcrumbs[pathname] ?? { group: "", label: "" };
}