import { useQuery } from "@tanstack/react-query";
import { getLookups } from "@/services/maintenance.service";

export const lookupKeys = { all: ["lookups"] };

export function useLookups(options = {}) {
  return useQuery({ queryKey: lookupKeys.all, queryFn: getLookups, staleTime: 30 * 60 * 1000, ...options });
}

export function useBarangaysByMunicipality(id) {
  return useLookups({ select: (data) => (data.barangays ?? []).filter((item) => item.parent === id) });
}

export function useBreedsByAnimal(id) {
  return useLookups({ select: (data) => (data.breeds ?? []).filter((item) => item.parent === id) });
}

export const referenceId = (value) => value?._id ?? value ?? "";

export function lookupOptions(items = [], saved, parent) {
  const options = items.filter((item) => !parent || item.parent === parent).map((item) => ({ value: item._id, label: item.name }));
  if (saved?._id && saved.name && !options.some((option) => option.value === saved._id)) {
    options.push({ value: saved._id, label: `${saved.name}${saved.deletedAt ? " (archived)" : ""}` });
  }
  return options;
}
