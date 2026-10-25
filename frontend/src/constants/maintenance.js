import { Building2, MapPin, Sprout, Tractor, Beef, GitBranch, Palette } from "lucide-react";
import { maintenanceFormSchema } from "@/schemas/maintenance.schema";
import { useMaintenance, useMaintenanceMutation } from "@/hooks/useMaintenance";

const entity = (label, parent, parentType, parentLabel) => ({
  label, parent, parentType, parentLabel,
  columns: [{ key: "name", header: "Name" }, ...(parent ? [{ key: parent, header: parentLabel, accessor: (row) => row[parent]?.name ?? "—" }] : [])],
  fields: [{ key: "name", label: "Name", type: "text" }, ...(parent ? [{ key: parent, label: parentLabel, type: "select", lookup: parentType }] : [])],
  schema: maintenanceFormSchema(parent),
  useList: useMaintenance,
  useMutation: useMaintenanceMutation,
});

export const maintenanceConfig = {
  municipality: { type: "municipalities", group: "Locations", icon: Building2, ...entity("Municipality") },
  barangay: { type: "barangays", group: "Locations", icon: MapPin, ...entity("Barangay", "municipality", "municipalities", "Municipality") },
  crop: { type: "crops", group: "Resources", icon: Sprout, ...entity("Crop") },
  equipment: { type: "equipments", group: "Resources", icon: Tractor, ...entity("Equipment") },
  animal: { type: "animals", group: "Livestock", icon: Beef, ...entity("Animal") },
  breed: { type: "breeds", group: "Livestock", icon: GitBranch, ...entity("Breed", "animalType", "animals", "Animal") },
  color: { type: "colors", group: "Livestock", icon: Palette, ...entity("Color") },
};
