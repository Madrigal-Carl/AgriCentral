import { useEffect, useMemo, useRef, useState } from "react";
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

// Crop has no dedicated "condition" field on its own model — the closest
// analog is the status a crop carries while attached to a farm
// (farmCropSchema.status), so this is hardcoded to mirror that enum
// rather than pulled from a shared constant.
const CROP_CONDITION_OPTIONS = [
  { value: "planted", label: "Planted" },
  { value: "growing", label: "Growing" },
  { value: "withered", label: "Withered" },
  { value: "harvested", label: "Harvested" },
  { value: "damaged", label: "Damaged" },
];

const CONDITION_OPTIONS_BY_TYPE = {
  farm: CROP_CONDITION_OPTIONS,
  livestock: LIVESTOCK_HEALTH_OPTIONS,
  equipment: EQUIPMENT_CONDITION_OPTIONS,
};

// Maps a backend report record onto the form's field names.
function toFormShape(report) {
  return {
    id: report._id,
    title: report.title,
    severity: report.severity,
    entityType: report.entityType,
    farm: report.parentId ?? report.parent?._id ?? "",
    itemIds: (report.itemIds ?? report.items ?? []).map((i) =>
      typeof i === "string" ? i : i._id,
    ),
    condition: report.condition,
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
    reset,
    formState: { errors },
  } = useForm({
    resolver,
    defaultValues: {
      severity: "medium",
      entityType: normalizedInitial?.entityType || "farm",
      itemIds: [],
      association: normalizedInitial?.association ?? "",
      ...normalizedInitial,
    },
  });

  useEffect(() => {
    const nextValues = {
      severity: "medium",
      entityType: normalizedInitial?.entityType || "farm",
      itemIds: [],
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
      setValue("condition", "");
      if (entityType !== "farm") setValue("farm", "");
    }
  }, [entityType, normalizedInitial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!normalizedInitial?.id && !normalizedInitial?._id) {
      setValue("itemIds", []);
    }
  }, [farmValue, normalizedInitial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      associationChangeRef.current !== null &&
      associationChangeRef.current !== selectedAssociation
    ) {
      setValue("itemIds", []);
      setValue("condition", "");
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
        label: `${l.animal} (${l.propertyNumber})`,
      }));
    }
    if (entityType === "equipment") {
      return (equipmentData?.equipments ?? []).map((e) => ({
        value: e._id,
        label: `${e.name} (${e.propertyNumber})`,
      }));
    }
    if (entityType === "farm" && farmValue) {
      const farm = (farmsData?.farms ?? []).find((f) => f._id === farmValue);
      return (farm?.crops ?? []).map((c) => ({
        value: c.crop?._id ?? c.crop,
        label: c.crop?.name ? `${c.crop.name} (${c.crop.kilo ?? 0}kg)` : "Crop",
      }));
    }
    return [];
  }, [entityType, farmValue, livestockData, equipmentData, farmsData]);

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateReport({
      onError: (err) =>
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        ),
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateReport({
      onError: (err) =>
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        ),
    });

  const busy = isCreating || isUpdating;

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      const payload = {
        title: values.title,
        severity: values.severity,
        entityType: values.entityType,
        condition: values.condition,
        itemIds: values.itemIds,
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
      setSubmitError(
        err?.response?.data?.message || err?.message || "Failed to save report",
      );
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
                  onChange={field.onChange}
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
            error={errors.itemIds?.message}
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
                name="itemIds"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    values={field.value}
                    onChange={field.onChange}
                    options={itemOptions}
                    placeholder="Select items…"
                    searchPlaceholder="Search…"
                  />
                )}
              />
            )}
          </Field>

          <Field label="Severity" error={errors.severity?.message}>
            <Controller
              name="severity"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={SEVERITY_OPTIONS}
                  defaultValue="medium"
                />
              )}
            />
          </Field>

          <Field label="Condition" error={errors.condition?.message}>
            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={conditionOptions}
                  placeholder="Select condition…"
                />
              )}
            />
          </Field>

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
