import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMaintenance, getMaintenanceUsage, mutateMaintenance } from "@/services/maintenance.service";
import { lookupKeys } from "./useLookups";

export const maintenanceKeys = { all: ["maintenance"], list: (type, filters) => ["maintenance", type, filters] };

export function useMaintenance(type, filters) {
  return useQuery({ queryKey: maintenanceKeys.list(type, filters), queryFn: () => getMaintenance(type, filters), keepPreviousData: true });
}

export function useMaintenanceUsage(type, id) {
  return useQuery({ queryKey: ["maintenance", type, "usage", id], queryFn: () => getMaintenanceUsage(type, id), enabled: !!id });
}

export function useMaintenanceMutation(type, options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => mutateMaintenance(type, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
      queryClient.invalidateQueries({ queryKey: lookupKeys.all });
      // Names can change on existing inventory and location records, too.
      for (const key of ["crops", "equipments", "livestocks", "associations", "farmers", "farms", "analytics"]) queryClient.invalidateQueries({ queryKey: [key] });
      options.onSuccess?.(data, variables, context);
    },
    onError: options.onError,
  });
}
