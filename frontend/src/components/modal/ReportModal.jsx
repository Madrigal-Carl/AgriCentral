import { useEffect, useMemo, useRef, useState } from "react";
import { Wrench, Beef, Sprout } from "lucide-react";
import { getReportItems } from "@/utils/report";
import { getErrorMessage } from "@/utils/getErrorMessage";
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

// Existing informational conditions remain available alongside map events.
const CROP_CONDITION_OPTIONS = [
  { value: "planted", label: "Planted" },
  { value: "growing", label: "Growing" },
  { value: "withered", label: "Withered" },
  { value: "harvested", label: "Harvested" },
  { value: "damaged", label: "Damaged" },
  { value: "destroyed", label: "Destroyed" },
];

const CONDITION_OPTIONS_BY_TYPE = {
  farm: CROP_CONDITION_OPTIONS,
  livestock: LIVESTOCK_HEALTH_OPTIONS,
  equipment: EQUIPMENT_CONDITION_OPTIONS,
};

// Maps a backend report record onto the form's field names.
function toFormShape(report) {
  const itemIds = (report.itemIds ?? report.items ?? []).map((item) => typeof item === "string" ? item : item._id);
  return {
    id: report._id,
    title: report.title,
    entityType: report.entityType,
    farm: report.parentId ?? report.parent?._id ?? "",
    itemIds,
    items: report.entityType === "farm" ? [] : getReportItems(report).map((item) => ({
      itemId: item.itemId, condition: item.condition ?? "", severity: item.severity,
    })),
    reportedAt: (report.reportedAt ?? report.createdAt)?.slice(0, 10),
    cropEntries: report.entityType === "farm" ? itemIds.map((crop) => {
      const entry = report.cropEntries?.find((entry) => (entry.crop?._id ?? entry.crop) === crop);
      const condition = entry?.condition ?? report.condition ?? "";
      return {
        crop, condition, severity: entry?.severity ?? report.severity ?? "medium",
        quantity: (condition === "harvested" ? entry?.yieldKg : entry?.quantity) ?? "",
      };
    }) : [],
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
    trigger,
    reset,
    formState: { errors },
  } = useForm({
    resolver,
    mode: "onChange",
    defaultValues: {
      entityType: normalizedInitial?.entityType || "farm",
      itemIds: [],
      items: [],
      cropEntries: [],
      reportedAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
      association: normalizedInitial?.association ?? "",
      ...normalizedInitial,
    },
  });

  useEffect(() => {
    const nextValues = {
      entityType: normalizedInitial?.entityType || "farm",
      itemIds: [],
      items: [],
      cropEntries: [],
      reportedAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
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
  const selectedItems = watch("items") ?? [];
  const selectedCropIds = watch("itemIds") ?? [];
  const selectedCropEntries = watch("cropEntries") ?? [];
  const onCropsChange = (ids) => {
    setValue("itemIds", ids, { shouldDirty: true, shouldValidate: true });
    setValue("cropEntries", ids.map((crop) => selectedCropEntries.find((entry) => entry.crop === crop) ?? { crop, condition: "planted", severity: "medium", quantity: 1 }), { shouldDirty: true, shouldValidate: true });
  };
  const ItemIcon = entityType === "equipment" ? Wrench : Beef;
  const onItemsChange = (nextIds) => setValue("items", nextIds.map((itemId) =>
    selectedItems.find((entry) => entry.itemId === itemId) ?? { itemId, condition: entityType === "livestock" ? "sick" : "damaged", severity: "medium" },
  ), { shouldValidate: true, shouldDirty: true });
  const onItemValueChange = (index, name, value) => {
    setValue(`items.${index}.${name}`, value, { shouldDirty: true, shouldTouch: true });
    // Validate the array too: selection-level errors live on its parent path,
    // and validating only a child field can leave those old messages behind.
    void trigger("items");
  };
  const onCropValueChange = (index, name, value) => {
    if (name === "condition" && (selectedCropEntries[index]?.condition === "harvested") !== (value === "harvested")) {
      // Start at the default instead of reusing a count as a weight (or vice versa).
      setValue(`cropEntries.${index}.quantity`, 1, { shouldDirty: true });
    }
    setValue(`cropEntries.${index}.${name}`, value, { shouldDirty: true, shouldTouch: true });
    void trigger("cropEntries");
  };
  const onTypeChange = (value) => {
    setValue("entityType", value, { shouldDirty: true });
    setValue("items", []);
    setValue("itemIds", []);
    setValue("cropEntries", []);
    setValue("farm", "");
  };
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
      setValue("cropEntries", []);
      setValue("items", []);
      if (entityType !== "farm") setValue("farm", "");
    }
  }, [entityType, normalizedInitial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!normalizedInitial?.id && !normalizedInitial?._id) {
      setValue("itemIds", []);
      setValue("cropEntries", []);
      setValue("items", []);
    }
  }, [farmValue, normalizedInitial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      associationChangeRef.current !== null &&
      associationChangeRef.current !== selectedAssociation
    ) {
      setValue("itemIds", []);
      setValue("cropEntries", []);
      setValue("items", []);
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
        label: `${l.animalType?.name ?? l.animal} (${l.propertyNumber})`,
      }));
    }
    if (entityType === "equipment") {
      return (equipmentData?.equipments ?? []).map((e) => ({
        value: e._id,
        label: `${e.equipmentType?.name ?? e.name} (${e.propertyNumber})`,
      }));
    }
    if (entityType === "farm" && farmValue) {
      const farm = (farmsData?.farms ?? []).find((f) => f._id === farmValue);
      return [...new Map((farm?.crops ?? []).map((c) => ({
        value: c.crop?._id ?? c.crop,
        label: c.crop?.name ?? "Unknown crop",
      })).map((option) => [option.value, option])).values()];
    }
    return [];
  }, [entityType, farmValue, livestockData, equipmentData, farmsData]);

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateReport({
      onError: (err) => setSubmitError(getErrorMessage(err)),
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateReport({
      onError: (err) => setSubmitError(getErrorMessage(err)),
    });

  const busy = isCreating || isUpdating;

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      const payload = {
        title: values.title,
        entityType: values.entityType,
        ...(values.entityType === "farm"
          ? {
              itemIds: values.itemIds,
              reportedAt: `${values.reportedAt}T00:00:00.000Z`,
              cropEntries: values.cropEntries.map((entry) => ({
                crop: entry.crop,
                condition: entry.condition,
                severity: entry.severity,
                ...(entry.condition === "harvested" ? { yieldKg: entry.quantity } : { quantity: entry.quantity }),
              })),
            }
          : { items: values.items }),
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
      setSubmitError(getErrorMessage(err, "Failed to save report"));
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
                  onChange={onTypeChange}
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
            error={entityType === "farm" ? errors.itemIds?.message : selectedItems.length === 0 ? errors.items?.root?.message ?? errors.items?.message : undefined}
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
                name={entityType === "farm" ? "itemIds" : "items"}
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    values={entityType === "farm" ? field.value : selectedItems.map((entry) => entry.itemId)}
                    onChange={entityType === "farm" ? onCropsChange : onItemsChange}
                    options={itemOptions}
                    placeholder="Select items…"
                    searchPlaceholder="Search…"
                  />
                )}
              />
            )}
          </Field>

          {entityType === "farm" && <>
            <Field label="Report date" full error={errors.reportedAt?.message}>
              <TextInput type="date" {...register("reportedAt")} />
            </Field>
            <p className="text-xs text-secondary sm:col-span-2">Map values change only after AEW and Coordinator approval. Editing a crop report requires both approvals again.</p>
            {selectedCropIds.map((crop, index) => (
              <div key={crop} className="sm:col-span-2 flex items-center justify-between gap-3 border border-border bg-surface px-3 py-2">
                <div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-foreground">
                  <Sprout className="h-4 w-4 shrink-0 text-accent" />
                  <span className="break-words">{itemOptions.find((option) => option.value === crop)?.label ?? crop}</span>
                </div>
                <div className="grid w-40 shrink-0 grid-cols-1 gap-3 sm:w-auto sm:grid-cols-[6rem_8rem_7rem]">
                  <Field label="Quantity" error={errors.cropEntries?.[index]?.quantity?.message}>
                    <div className="flex items-center gap-1">
                      <TextInput type="number" min="0" step="any" className="min-w-0" aria-label={`Quantity of ${itemOptions.find((option) => option.value === crop)?.label ?? crop}`} {...register(`cropEntries.${index}.quantity`)} />
                      {selectedCropEntries[index]?.condition === "harvested" && <span className="text-xs text-secondary">kg</span>}
                    </div>
                  </Field>
                  <Field label="Staged" error={errors.cropEntries?.[index]?.condition?.message}>
                    <Controller name={`cropEntries.${index}.condition`} control={control} render={({ field }) => (
                      <FullSelect value={field.value} onChange={(value) => onCropValueChange(index, "condition", value)} options={CROP_CONDITION_OPTIONS} placeholder="Select stage…" />
                    )} />
                  </Field>
                  <Field label="Severity" error={errors.cropEntries?.[index]?.severity?.message}>
                    <Controller name={`cropEntries.${index}.severity`} control={control} render={({ field }) => (
                      <FullSelect value={field.value} onChange={(value) => onCropValueChange(index, "severity", value)} options={SEVERITY_OPTIONS} />
                    )} />
                  </Field>
                </div>
              </div>
            ))}
            {(errors.cropEntries?.message || errors.cropEntries?.root?.message) && <p className="text-xs text-red-600 sm:col-span-2">{errors.cropEntries.message ?? errors.cropEntries.root.message}</p>}
          </>}

          {entityType !== "farm" && selectedItems.length > 0 && (
            <div className="sm:col-span-2 space-y-2">
              {selectedItems.map((entry, index) => (
                <div key={entry.itemId} className="flex items-center justify-between gap-3 w-full bg-surface border border-border px-3 py-2 flex-wrap">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ItemIcon className="h-4 w-4 text-accent" />
                    {itemOptions.find((option) => option.value === entry.itemId)?.label ?? entry.itemId}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 w-full sm:w-auto">
                    <div>
                      <div role="group" aria-label="Item condition" className="flex items-center gap-2">
                        <span className="label-eyebrow shrink-0">Condition</span>
                        <Controller name={`items.${index}.condition`} control={control} render={({ field }) => (
                          <FullSelect value={field.value} onChange={(value) => onItemValueChange(index, "condition", value)} options={conditionOptions} placeholder="Select condition…" />
                        )} />
                      </div>
                      {errors.items?.[index]?.condition?.message && <p className="mt-1 text-xs text-red-600">{errors.items[index].condition.message}</p>}
                    </div>
                    <div>
                      <div role="group" aria-label="Item severity" className="flex items-center gap-2">
                        <span className="label-eyebrow shrink-0">Severity</span>
                        <Controller name={`items.${index}.severity`} control={control} render={({ field }) => (
                          <FullSelect value={field.value} onChange={(value) => onItemValueChange(index, "severity", value)} options={SEVERITY_OPTIONS} />
                        )} />
                      </div>
                      {errors.items?.[index]?.severity?.message && <p className="mt-1 text-xs text-red-600">{errors.items[index].severity.message}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

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
