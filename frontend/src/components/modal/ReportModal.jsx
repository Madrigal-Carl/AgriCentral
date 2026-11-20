import { useEffect, useMemo, useRef, useState } from "react";
import { Wrench, Beef, ArrowRight } from "lucide-react";
import { getReportItems, getReportKind } from "@/utils/report";
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
  TitleSelect,
} from "@/components/ui";
import { FileUploader } from "@/components/public";
import { ModalShell } from "./ModalShell";
import {
  PRIORITY_OPTIONS,
  EQUIPMENT_CONDITION_OPTIONS,
  LIVESTOCK_HEALTH_OPTIONS,
  CROP_STAGE_OPTIONS,
  REPORT_KIND_OPTIONS,
  DECEASED_CAUSE_OPTIONS,
  EQUIPMENT_USAGE_OPTIONS,
} from "@/constants/data";
import {
  PLANTING_METHOD_OPTIONS,
  SEED_CLASS_OPTIONS,
  STAGE_OPTION_LABELS,
  CROP_CONDITION_OPTIONS,
  QUALITY_GRADE_OPTIONS,
  DISPOSITION_OPTIONS,
  DAMAGE_REASON_OPTIONS,
  PRODUCTION_UNIT_OPTIONS,
  STAGE_FIELDS,
  reproductiveSubStagesFor,
  toProductionKg,
} from "@/constants/cropStageFields";
import {
  createReportFormSchema,
  createReportUpdateSchema,
} from "@/schemas/report.schema";
import { useCreateReport, useUpdateReport } from "@/hooks/useReports";
import { useAssociations } from "@/hooks/useAssociations";
import { useFarms } from "@/hooks/useFarms";
import { useLivestocks } from "@/hooks/useLivestocks";
import { useFarmers, useFarmersByAssociationId } from "@/hooks/useFarmers";
import { useEquipments } from "@/hooks/useEquipments";

const ENTITY_TYPE_OPTIONS = [
  { value: "farm", label: "Crop" },
  { value: "livestock", label: "Livestock" },
  { value: "equipment", label: "Equipment" },
];

const CONDITION_OPTIONS_BY_TYPE = {
  livestock: LIVESTOCK_HEALTH_OPTIONS,
  equipment: EQUIPMENT_CONDITION_OPTIONS,
};

const idOf = (value) => value?._id ?? value ?? "";

const todayLocal = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

// Starting values for a stage's fields: production defaults to kg, and
// seed ownership follows the selected crop (shown read-only).
const stageDefaults = (stage, crop) => ({
  ...(stage === "harvested" ? { totalProductionUnit: "kg" } : {}),
  ...(stage === "newly_planted" ? { seedOwnership: crop ? (crop.ownership ?? "government") : "" } : {}),
});

// Defaults for a new report; crop fields start at the first stage.
const blankValues = () => ({
  entityType: "farm",
  farm: "",
  farmer: "",
  crop: "",
  stage: "newly_planted",
  stageData: stageDefaults("newly_planted"),
  priority: "medium",
  // Livestock: report kind, and the offspring kind's fields.
  reportKind: "condition",
  mother: "",
  offspringCount: 1,
  offspringBirthDate: "",
  offspringNotes: "",
  items: [],
  association: "",
  files: [],
});

const DATE_FIELDS = new Set(["datePlanted", "expectedHarvestDate", "dateStarted", "dateObserved", "dateHarvested", "dateOccurred"]);

// Stored stage data onto form values (dates as YYYY-MM-DD).
const toFormStageData = (stage, data = {}) => Object.fromEntries(
  (STAGE_FIELDS[stage] ?? []).filter((field) => data[field] != null)
    .map((field) => [field, DATE_FIELDS.has(field) ? String(data[field]).slice(0, 10) : data[field]]),
);

// Form stage values onto the payload: only the stage's own, filled fields.
const toPayloadStageData = (stage, data = {}) => Object.fromEntries(
  (STAGE_FIELDS[stage] ?? []).filter((field) => field !== "totalProductionKg")
    .map((field) => [field, typeof data[field] === "string" ? data[field].trim() : data[field]])
    .filter(([, value]) => value !== undefined && value !== null && value !== "" && !Number.isNaN(value)),
);

// Number inputs: empty means "not filled", otherwise a number.
const toNumber = (value) => (value === "" || value == null ? undefined : Number(value));

// Maps a backend report record onto the form's field names. A crop report
// holds a single crop entry with its stage (legacy reports are never edited).
function toFormShape(report) {
  const isFarm = report.entityType === "farm";
  const entry = isFarm ? report.cropEntries?.[0] : null;
  const stage = isFarm ? (entry?.stage ?? "") : "";
  const reportKind = getReportKind(report) ?? "condition";
  const offspring = reportKind === "offspring" ? report.offspring ?? {} : null;
  return {
    id: report._id,
    title: report.title,
    entityType: report.entityType,
    farm: isFarm ? idOf(report.parentId ?? report.parent) : "",
    farmer: isFarm ? idOf(report.farmer) : "",
    crop: isFarm ? idOf(entry?.crop ?? report.itemIds?.[0]) : "",
    stage,
    stageData: isFarm ? toFormStageData(stage, entry?.stageData) : {},
    priority: entry?.priority ?? report.priority ?? "medium",
    reportKind,
    mother: offspring ? idOf(offspring.mother ?? report.itemIds?.[0]) : "",
    offspringCount: offspring?.count ?? 1,
    offspringBirthDate: offspring?.birthDate ? String(offspring.birthDate).slice(0, 10) : "",
    offspringNotes: offspring?.notes ?? "",
    items: isFarm || offspring ? [] : getReportItems(report).map((item) => ({
      itemId: item.itemId, condition: item.condition ?? "", priority: item.priority,
      ...(item.deceased?.cause
        ? { deceased: { cause: item.deceased.cause, dateOfDeath: String(item.deceased.dateOfDeath ?? "").slice(0, 10) } }
        : {}),
      ...(report.entityType === "equipment"
        ? { usageStatus: item.usageStatus ?? "idle", farmer: item.farmer ? String(idOf(item.farmer)) : "" }
        : {}),
      ...(reportKind === "redispersal"
        ? { fromFarmer: item.fromFarmer ? String(idOf(item.fromFarmer)) : "", toFarmer: item.toFarmer ? String(idOf(item.toFarmer)) : "" }
        : {}),
    })),
    details: report.details,
    files: report.attachments || [],
    association: idOf(report.association),
  };
}

const placeholderBox = (text) => (
  <div className="w-full border border-border bg-muted px-3 py-2.5 text-sm text-secondary">
    {text}
  </div>
);

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
    getValues,
    setError,
    trigger,
    reset,
    formState: { errors },
  } = useForm({
    resolver,
    mode: "onChange",
    defaultValues: { ...blankValues(), ...normalizedInitial },
  });

  useEffect(() => {
    const initialId = normalizedInitial?.id ?? normalizedInitial?._id ?? null;
    if (previousInitialIdRef.current !== initialId) {
      previousInitialIdRef.current = initialId;
      reset({ ...blankValues(), ...normalizedInitial }, { keepDirty: false, keepDirtyValues: false });
    }
  }, [normalizedInitial, reset]);

  const entityType = watch("entityType");
  const reportKind = watch("reportKind") || "condition";
  const isOffspring = entityType === "livestock" && reportKind === "offspring";
  const selectedItems = watch("items") ?? [];
  const farmValue = watch("farm");
  const farmerValue = watch("farmer");
  const cropValue = watch("crop");
  const stageValue = watch("stage");
  const stageData = watch("stageData") ?? {};
  const ItemIcon = entityType === "equipment" ? Wrench : Beef;

  const dirty = { shouldDirty: true, shouldValidate: true };
  const clearCropChain = (from) => {
    if (from === "farm") setValue("farmer", "", dirty);
    setValue("crop", "", dirty);
    // Crop-dependent stage fields follow the crop.
    setValue("stageData.subStage", undefined);
  };

  const onTypeChange = (value) => {
    setValue("entityType", value, { shouldDirty: true });
    setValue("items", []);
    setValue("farm", "");
    setValue("reportKind", "condition");
    setValue("mother", "");
    clearCropChain("farm");
  };
  // Each livestock kind has its own fields; switching starts them fresh.
  const onKindChange = (value) => {
    if (value === reportKind) return;
    setValue("reportKind", value, { shouldDirty: true });
    setValue("items", []);
    setValue("mother", "");
  };
  // Changing the farm clears farmer and crop; changing the farmer clears the crop.
  const onFarmChange = (value) => {
    if (value === farmValue) return;
    setValue("farm", value, dirty);
    clearCropChain("farm");
  };
  const onFarmerChange = (value) => {
    if (value === farmerValue) return;
    setValue("farmer", value, dirty);
    clearCropChain("farmer");
  };
  // Each stage has its own fields; switching stages starts them fresh.
  const onStageChange = (value) => {
    if (value === stageValue) return;
    setValue("stage", value, { shouldDirty: true });
    setValue("stageData", stageDefaults(value, selectedCrop), { shouldDirty: true });
  };
  const onCropChange = (value) => {
    setValue("crop", value, dirty);
    setValue("stageData.subStage", undefined);
  };
  // Yield per ha is prefilled from total production / area harvested and
  // recomputed when either changes, but stays editable.
  const recomputeYield = () => {
    const { totalProductionValue, totalProductionUnit, areaHarvestedHa } = getValues("stageData") ?? {};
    if (!(totalProductionValue > 0) || !(areaHarvestedHa > 0)) return;
    const perHa = toProductionKg(totalProductionValue, totalProductionUnit) / areaHarvestedHa;
    setValue("stageData.yieldPerHaKg", Math.round(perHa * 100) / 100, dirty);
  };

  const onItemsChange = (nextIds) => setValue("items", nextIds.map((itemId) =>
    selectedItems.find((entry) => entry.itemId === itemId) ?? {
      itemId,
      condition: entityType === "livestock" ? "sick" : "damaged",
      priority: "medium",
      // Equipment usage defaults to idle (no farmer).
      ...(entityType === "equipment" ? { usageStatus: "idle", farmer: "" } : {}),
      // Redispersal starts from the animal's current farmer.
      ...(entityType === "livestock" && reportKind === "redispersal"
        ? { fromFarmer: idOf(livestockById.get(itemId)?.assignedFarmer) || "", toFarmer: "" }
        : {}),
    },
  ), { shouldValidate: true, shouldDirty: true });
  const onItemValueChange = (index, name, value) => {
    setValue(`items.${index}.${name}`, value, { shouldDirty: true, shouldTouch: true });
    // Validate the array too: selection-level errors live on its parent path,
    // and validating only a child field can leave those old messages behind.
    void trigger("items");
  };

  const selectedAssociation =
    watch("association") || (isFar ? (user?.association ?? "") : "");
  const associationFilter = selectedAssociation || undefined;
  const associationChangeRef = useRef(null);

  // far users are always scoped to their own association, so the
  // "pick an association first" gate only applies to non-far roles who
  // have an explicit association selector to fill in.
  const associationRequiredButMissing = !isFar && !selectedAssociation;

  // Farms, farmers, crops and items all depend on the association.
  useEffect(() => {
    if (
      associationChangeRef.current !== null &&
      associationChangeRef.current !== selectedAssociation
    ) {
      setValue("items", []);
      setValue("mother", "");
      setValue("farm", "");
      setValue("farmer", "");
      setValue("crop", "");
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

  const farms = farmsData?.farms ?? [];
  const selectedFarm = farms.find((f) => f._id === farmValue);
  const farmOptions = farms.map((f) => ({ value: f._id, label: f.tag }));

  // The farm's assigned farmers.
  const farmerOptions = (selectedFarm?.assignedFarmers ?? []).map((a) => ({
    value: idOf(a.farmer),
    label: a.farmer?.fullName ?? "Unknown farmer",
  }));

  // Crops on the farm assigned to the chosen farmer (government and
  // farmer-owned), one option per crop.
  const cropOptions = useMemo(() => {
    if (!selectedFarm || !farmerValue) return [];
    const options = (selectedFarm.crops ?? [])
      .filter((c) => idOf(c.crop?.assignedFarmer) === farmerValue)
      .map((c) => ({
        value: idOf(c.crop),
        label: `${c.crop?.name ?? "Unknown crop"}${c.crop?.ownership === "farmer" ? " · Farmer-owned" : ""}`,
      }));
    return [...new Map(options.map((option) => [option.value, option])).values()];
  }, [selectedFarm, farmerValue]);

  const selectedCrop = (selectedFarm?.crops ?? []).find((c) => idOf(c.crop) === cropValue)?.crop ?? null;
  const subStageOptions = reproductiveSubStagesFor(selectedCrop?.cropType?.name)
    .map((name) => ({ value: name, label: name }));

  // Seed ownership is read-only and always follows the selected crop.
  const cropOwnership = selectedCrop ? (selectedCrop.ownership ?? "government") : "";
  useEffect(() => {
    if (entityType !== "farm" || stageValue !== "newly_planted" || !selectedFarm) return;
    if (getValues("stageData.seedOwnership") !== cropOwnership) {
      setValue("stageData.seedOwnership", cropOwnership, { shouldValidate: Boolean(cropOwnership) });
    }
  }, [entityType, stageValue, selectedFarm, cropOwnership, getValues, setValue]);

  // Farmers of the selected association, for equipment reported in use and
  // livestock redispersal. A far user's account carries no association id (the link lives on
  // Association.user), so they use the farmer list, which the server
  // already pins to their own association.
  const needsFarmers = entityType === "equipment" || (entityType === "livestock" && reportKind === "redispersal");
  const { data: ownFarmersData } = useFarmers(
    { all: true },
    { enabled: needsFarmers && isFar },
  );
  const { data: selectedFarmersData } = useFarmersByAssociationId(selectedAssociation, {
    enabled: needsFarmers && !isFar && !!selectedAssociation,
  });
  const associationFarmersData = isFar ? ownFarmersData : selectedFarmersData;
  const usageFarmerOptions = (associationFarmersData?.farmers ?? []).map((f) => ({
    value: f._id,
    label: f.fullName ?? [f.firstName, f.lastName].filter(Boolean).join(" "),
  }));

  // Offspring mothers: female animals that are not deceased.
  const livestockById = useMemo(
    () => new Map((livestockData?.livestocks ?? []).map((l) => [l._id, l])),
    [livestockData],
  );
  const motherOptions = (livestockData?.livestocks ?? [])
    .filter((l) => l.gender === "female" && l.condition !== "deceased")
    .map((l) => ({ value: l._id, label: `${l.animalType?.name ?? l.animal} (${l.propertyNumber})` }));

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
    return [];
  }, [entityType, livestockData, equipmentData]);

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
    // A date of death cannot be before the animal's birth date.
    if (values.entityType === "livestock" && (values.reportKind || "condition") === "condition") {
      const early = (values.items ?? []).findIndex((item) => {
        const born = livestockById.get(item.itemId)?.birthDate;
        return item.condition === "deceased" && item.deceased?.dateOfDeath && born
          && item.deceased.dateOfDeath < String(born).slice(0, 10);
      });
      if (early >= 0) {
        const born = String(livestockById.get(values.items[early].itemId).birthDate).slice(0, 10);
        setError(`items.${early}.deceased.dateOfDeath`, { message: `Cannot be before the animal's birth date (${born})` });
        return;
      }
    }
    const kind = values.entityType === "livestock" ? values.reportKind || "condition" : undefined;
    try {
      const payload = {
        title: values.title,
        entityType: values.entityType,
        // One crop per crop report, stored as a single itemIds/cropEntries
        // element so existing readers keep working. The server sets the
        // report date from the stage's main date.
        ...(values.entityType === "farm"
          ? {
              parentId: values.farm,
              farmer: values.farmer,
              itemIds: [values.crop],
              cropEntries: [{
                crop: values.crop,
                stage: values.stage,
                priority: values.priority,
                stageData: toPayloadStageData(values.stage, values.stageData),
              }],
            }
          : kind === "offspring"
            // Offspring: the mother and the newborns; priority stays default.
            ? {
                reportKind: kind,
                items: [],
                offspring: {
                  mother: values.mother,
                  count: values.offspringCount,
                  birthDate: values.offspringBirthDate,
                  ...(values.offspringNotes?.trim() ? { notes: values.offspringNotes.trim() } : {}),
                },
              }
            : {
                ...(kind ? { reportKind: kind } : {}),
                items: values.items.map((item) => ({
                  itemId: item.itemId,
                  condition: item.condition,
                  priority: item.priority,
                  ...(kind === "condition" && item.condition === "deceased" ? { deceased: item.deceased } : {}),
                  ...(kind === "redispersal" ? { fromFarmer: item.fromFarmer, toFarmer: item.toFarmer } : {}),
                  ...(values.entityType === "equipment"
                    ? {
                        usageStatus: item.usageStatus || "idle",
                        ...(item.usageStatus === "in_use" ? { farmer: item.farmer } : {}),
                      }
                    : {}),
                })),
              }),
        details: values.details,
        files: values.files, // hook resolves this into `attachments`
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
  const filesError = errors.files?.message ?? errors.files?.root?.message;

  /* ---------- Stage field helpers ---------- */
  const today = todayLocal();
  const stageError = (name) => errors.stageData?.[name]?.message;
  const numberInput = (name, { unit, step = "any", onChange } = {}) => (
    <div className="flex items-center gap-1">
      <TextInput
        type="number"
        min="0"
        step={step}
        className="min-w-0"
        {...register(`stageData.${name}`, { setValueAs: toNumber, ...(onChange ? { onChange } : {}) })}
      />
      {unit && <span className="shrink-0 text-xs text-secondary">{unit}</span>}
    </div>
  );
  const numberField = (name, label, options = {}) => (
    <Field key={name} label={label} error={stageError(name)}>{numberInput(name, options)}</Field>
  );
  // Dates cannot be in the future (except the expected harvest date).
  const dateField = (name, label, { allowFuture = false, min } = {}) => (
    <Field key={name} label={label} error={stageError(name)}>
      <TextInput type="date" max={allowFuture ? undefined : today} min={min} {...register(`stageData.${name}`)} />
    </Field>
  );
  const selectField = (name, label, options, { placeholder = "Select…", full = false, onChange } = {}) => (
    <Field key={name} label={label} full={full} error={stageError(name)}>
      <Controller
        name={`stageData.${name}`}
        control={control}
        render={({ field }) => (
          <FullSelect
            value={field.value ?? ""}
            onChange={(value) => { field.onChange(value); onChange?.(value); }}
            options={options}
            placeholder={placeholder}
          />
        )}
      />
    </Field>
  );
  const otherField = (name, label) => (
    <Field key={name} label={label} error={stageError(name)}>
      <TextInput {...register(`stageData.${name}`)} placeholder="Please specify" maxLength={100} />
    </Field>
  );

  // Exactly the chosen stage's fields.
  const renderStageFields = () => {
    switch (stageValue) {
      case "newly_planted":
        return [
          dateField("datePlanted", "Date Planted"),
          numberField("areaPlantedHa", "Area Planted", { unit: "ha" }),
          selectField("plantingMethod", "Planting Method", PLANTING_METHOD_OPTIONS),
          stageData.plantingMethod === "other" && otherField("plantingMethodOther", "Other Planting Method"),
          selectField("seedClass", "Seed Class", SEED_CLASS_OPTIONS),
          stageData.seedClass === "other" && otherField("seedClassOther", "Other Seed Class"),
          <Field key="seedQuantity" label="Quantity of Seeds" error={stageError("seedQuantity")}>
            {numberInput("seedQuantity", { step: "1" })}
            {cropOwnership === "government" && (
              <p className="mt-1 text-xs text-secondary">Unplanted stock: {selectedCrop?.unplanted ?? 0}</p>
            )}
          </Field>,
          dateField("expectedHarvestDate", "Expected Harvest Date", { allowFuture: true, min: stageData.datePlanted || undefined }),
          <Field key="seedOwnership" label="Seed Ownership" error={stageError("seedOwnership")}>
            <TextInput
              readOnly
              tabIndex={-1}
              value={STAGE_OPTION_LABELS.seedOwnership[stageData.seedOwnership] ?? "Select a crop first…"}
              className="bg-muted text-secondary"
            />
          </Field>,
          numberField("expectedYieldKg", "Expected Yield", { unit: "kg" }),
        ];
      case "flowering":
      case "vegetative":
        return [
          dateField("dateStarted", stageValue === "flowering" ? "Date Flowering Started" : "Date Vegetative Started"),
          numberField("areaHa", "Area", { unit: "ha" }),
          selectField("condition", "Condition", CROP_CONDITION_OPTIONS),
        ];
      case "reproductive":
        return [
          dateField("dateObserved", "Date Observed"),
          numberField("areaHa", "Area", { unit: "ha" }),
          selectField("subStage", "Sub-stage", subStageOptions, {
            placeholder: selectedCrop ? "Select sub-stage…" : "Select a crop first…",
          }),
        ];
      case "harvested":
        return [
          dateField("dateHarvested", "Date Harvested"),
          numberField("areaHarvestedHa", "Area Harvested", { unit: "ha", onChange: recomputeYield }),
          <Field
            key="totalProduction"
            label="Total Production"
            error={stageError("totalProductionValue") ?? stageError("totalProductionUnit")}
          >
            <div className="flex items-center gap-2">
              <TextInput
                type="number"
                min="0"
                step="any"
                className="min-w-0"
                {...register("stageData.totalProductionValue", { setValueAs: toNumber, onChange: recomputeYield })}
              />
              <Controller
                name="stageData.totalProductionUnit"
                control={control}
                render={({ field }) => (
                  <FullSelect
                    value={field.value ?? "kg"}
                    onChange={(value) => { field.onChange(value); recomputeYield(); }}
                    options={PRODUCTION_UNIT_OPTIONS}
                  />
                )}
              />
            </div>
          </Field>,
          numberField("yieldPerHaKg", "Yield per Hectare", { unit: "kg/ha" }),
          selectField("qualityGrade", "Quality Grade", QUALITY_GRADE_OPTIONS),
          selectField("disposition", "Disposition (optional)", [{ value: "", label: "None" }, ...DISPOSITION_OPTIONS]),
        ];
      case "damaged":
        return [
          selectField("damageReason", "Damage Reason", DAMAGE_REASON_OPTIONS),
          stageData.damageReason === "other" && otherField("damageReasonOther", "Other Damage Reason"),
          dateField("dateOccurred", "Date Occurred"),
          numberField("areaAffectedHa", "Area Affected", { unit: "ha" }),
          numberField("estimatedLossKg", "Estimated Loss", { unit: "kg" }),
          numberField("estimatedLossPesos", "Estimated Loss", { unit: "₱" }),
        ];
      default:
        return null;
    }
  };

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

        {/* Order: Type -> Association -> type fields -> Title -> Details -> Images */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          {entityType === "livestock" && (
            <Field label="Report kind" full error={errors.reportKind?.message}>
              <Controller
                name="reportKind"
                control={control}
                render={({ field }) => (
                  <FullSelect value={field.value || "condition"} onChange={onKindChange} options={REPORT_KIND_OPTIONS} />
                )}
              />
            </Field>
          )}

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

          {entityType === "farm" ? (
            <>
              <Field label="Farm" full error={errors.farm?.message}>
                {associationRequiredButMissing ? placeholderBox("Select an association first…") : (
                  <Controller
                    name="farm"
                    control={control}
                    render={({ field }) => (
                      <SingleSelect
                        value={field.value}
                        onChange={onFarmChange}
                        options={farmOptions}
                        placeholder="Select farm…"
                        searchPlaceholder="Search farm…"
                      />
                    )}
                  />
                )}
              </Field>

              <Field label="Farmer" full error={errors.farmer?.message}>
                {!farmValue ? placeholderBox("Select a farm first…") : (
                  <Controller
                    name="farmer"
                    control={control}
                    render={({ field }) => (
                      <SingleSelect
                        value={field.value}
                        onChange={onFarmerChange}
                        options={farmerOptions}
                        placeholder={farmerOptions.length ? "Select farmer…" : "No farmers assigned to this farm"}
                        searchPlaceholder="Search farmer…"
                      />
                    )}
                  />
                )}
              </Field>

              <Field label="Crop" full error={errors.crop?.message}>
                {!farmerValue ? placeholderBox("Select a farmer first…") : (
                  <Controller
                    name="crop"
                    control={control}
                    render={({ field }) => (
                      <SingleSelect
                        value={field.value}
                        onChange={onCropChange}
                        options={cropOptions}
                        placeholder={cropOptions.length ? "Select crop…" : "No crops for this farmer on this farm"}
                        searchPlaceholder="Search crop…"
                      />
                    )}
                  />
                )}
              </Field>

              <Field label="Stage" full error={errors.stage?.message}>
                <Controller
                  name="stage"
                  control={control}
                  render={({ field }) => (
                    <FullSelect value={field.value} onChange={onStageChange} options={CROP_STAGE_OPTIONS} placeholder="Select stage…" />
                  )}
                />
              </Field>

              {renderStageFields()}

              <Field label="Priority" error={errors.priority?.message}>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <FullSelect value={field.value} onChange={field.onChange} options={PRIORITY_OPTIONS} />
                  )}
                />
              </Field>

              <p className="text-xs text-secondary sm:col-span-2">Map values change only after AEW and Coordinator approval. Editing a crop report requires both approvals again.</p>
            </>
          ) : isOffspring ? (
            <>
              <Field label="Mother" full error={errors.mother?.message}>
                {associationRequiredButMissing ? placeholderBox("Select an association first…") : (
                  <Controller
                    name="mother"
                    control={control}
                    render={({ field }) => (
                      <SingleSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={motherOptions}
                        placeholder={motherOptions.length ? "Select mother…" : "No living female livestock"}
                        searchPlaceholder="Search…"
                      />
                    )}
                  />
                )}
              </Field>
              <Field label="Number of Offspring" error={errors.offspringCount?.message}>
                <TextInput type="number" min="1" step="1" {...register("offspringCount", { setValueAs: toNumber })} />
              </Field>
              <Field label="Birth Date" error={errors.offspringBirthDate?.message}>
                <TextInput type="date" max={today} {...register("offspringBirthDate")} />
              </Field>
              <Field label="Notes (optional)" full error={errors.offspringNotes?.message}>
                <TextInput {...register("offspringNotes")} placeholder="e.g. health of the newborns" maxLength={500} />
              </Field>
              <p className="text-xs text-secondary sm:col-span-2">Approval does not change livestock records; the coordinator registers the offspring.</p>
            </>
          ) : (
            <>
              <Field
                label="Items"
                full
                error={selectedItems.length === 0 ? errors.items?.root?.message ?? errors.items?.message : undefined}
              >
                {associationRequiredButMissing ? placeholderBox("Select an association first…") : (
                  <Controller
                    name="items"
                    control={control}
                    render={() => (
                      <MultiSelect
                        values={selectedItems.map((entry) => entry.itemId)}
                        onChange={onItemsChange}
                        options={itemOptions}
                        placeholder="Select items…"
                        searchPlaceholder="Search…"
                      />
                    )}
                  />
                )}
              </Field>

              {selectedItems.length > 0 && (
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
                          <div role="group" aria-label="Item priority" className="flex items-center gap-2">
                            <span className="label-eyebrow shrink-0">Priority</span>
                            <Controller name={`items.${index}.priority`} control={control} render={({ field }) => (
                              <FullSelect value={field.value} onChange={(value) => onItemValueChange(index, "priority", value)} options={PRIORITY_OPTIONS} />
                            )} />
                          </div>
                          {errors.items?.[index]?.priority?.message && <p className="mt-1 text-xs text-red-600">{errors.items[index].priority.message}</p>}
                        </div>
                      </div>
                      {/* Redispersal: the animal goes from one farmer to another. */}
                      {entityType === "livestock" && reportKind === "redispersal" && (
                        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
                          <div>
                            <span className="label-eyebrow mb-1 block">From Farmer<span className="ml-0.5 text-red-600" aria-hidden="true">*</span></span>
                            <Controller name={`items.${index}.fromFarmer`} control={control} render={({ field }) => (
                              <SingleSelect
                                value={field.value ?? ""}
                                onChange={(value) => onItemValueChange(index, "fromFarmer", value)}
                                options={usageFarmerOptions}
                                placeholder={usageFarmerOptions.length ? "Select farmer…" : "No farmers in this association"}
                                searchPlaceholder="Search farmer…"
                              />
                            )} />
                            {errors.items?.[index]?.fromFarmer?.message && <p className="mt-1 text-xs text-red-600">{errors.items[index].fromFarmer.message}</p>}
                          </div>
                          <ArrowRight className="mx-auto hidden h-4 w-4 text-secondary sm:mt-8 sm:block" aria-hidden="true" />
                          <div>
                            <span className="label-eyebrow mb-1 block">To Farmer<span className="ml-0.5 text-red-600" aria-hidden="true">*</span></span>
                            <Controller name={`items.${index}.toFarmer`} control={control} render={({ field }) => (
                              <SingleSelect
                                value={field.value ?? ""}
                                onChange={(value) => onItemValueChange(index, "toFarmer", value)}
                                options={usageFarmerOptions.filter((option) => option.value !== entry.fromFarmer)}
                                placeholder={usageFarmerOptions.length ? "Select farmer…" : "No farmers in this association"}
                                searchPlaceholder="Search farmer…"
                              />
                            )} />
                            {errors.items?.[index]?.toFarmer?.message && <p className="mt-1 text-xs text-red-600">{errors.items[index].toFarmer.message}</p>}
                          </div>
                        </div>
                      )}
                      {/* Condition reports: cause and date of a death. */}
                      {entityType === "livestock" && reportKind === "condition" && entry.condition === "deceased" && (
                        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <span className="label-eyebrow mb-1 block">Cause of Death</span>
                            <Controller name={`items.${index}.deceased.cause`} control={control} render={({ field }) => (
                              <FullSelect value={field.value ?? ""} onChange={(value) => onItemValueChange(index, "deceased.cause", value)} options={DECEASED_CAUSE_OPTIONS} placeholder="Select cause…" />
                            )} />
                            {errors.items?.[index]?.deceased?.cause?.message && <p className="mt-1 text-xs text-red-600">{errors.items[index].deceased.cause.message}</p>}
                          </div>
                          <div>
                            <span className="label-eyebrow mb-1 block">Date of Death</span>
                            <TextInput
                              type="date"
                              max={today}
                              min={livestockById.get(entry.itemId)?.birthDate ? String(livestockById.get(entry.itemId).birthDate).slice(0, 10) : undefined}
                              value={entry.deceased?.dateOfDeath ?? ""}
                              onChange={(e) => onItemValueChange(index, "deceased.dateOfDeath", e.target.value)}
                            />
                            {errors.items?.[index]?.deceased?.dateOfDeath?.message && <p className="mt-1 text-xs text-red-600">{errors.items[index].deceased.dateOfDeath.message}</p>}
                          </div>
                        </div>
                      )}
                      {/* Equipment: reported usage, and who is using it. */}
                      {entityType === "equipment" && (
                        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <span className="label-eyebrow mb-1 block">Equipment Status</span>
                            <Controller name={`items.${index}.usageStatus`} control={control} render={({ field }) => (
                              <FullSelect
                                value={field.value || "idle"}
                                onChange={(value) => {
                                  onItemValueChange(index, "usageStatus", value);
                                  if (value !== "in_use") onItemValueChange(index, "farmer", "");
                                }}
                                options={EQUIPMENT_USAGE_OPTIONS}
                              />
                            )} />
                          </div>
                          {entry.usageStatus === "in_use" && (
                            <div>
                              <span className="label-eyebrow mb-1 block">Farmer<span className="ml-0.5 text-red-600" aria-hidden="true">*</span></span>
                              <Controller name={`items.${index}.farmer`} control={control} render={({ field }) => (
                                <SingleSelect
                                  value={field.value ?? ""}
                                  onChange={(value) => onItemValueChange(index, "farmer", value)}
                                  options={usageFarmerOptions}
                                  placeholder={usageFarmerOptions.length ? "Select farmer…" : "No farmers in this association"}
                                  searchPlaceholder="Search farmer…"
                                />
                              )} />
                              {errors.items?.[index]?.farmer?.message && <p className="mt-1 text-xs text-red-600">{errors.items[index].farmer.message}</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <TitleSelect control={control} type="reportTitles" saved={mode === "edit" ? initial?.title : undefined} error={errors.title?.message} />

          <Field label="Details" full error={errors.details?.message}>
            <textarea
              {...register("details")}
              placeholder="Describe the report…"
              rows={5}
              className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground resize-y"
            />
          </Field>

          {/* The damaged stage's required image is its proof photo. */}
          <Field label={entityType === "farm" && stageValue === "damaged" ? "Photo proof" : "Images"} required full error={filesError}>
            <Controller
              name="files"
              control={control}
              render={({ field }) => (
                <FileUploader
                  value={field.value}
                  onChange={field.onChange}
                  accept="image/*"
                  invalid={Boolean(filesError)}
                />
              )}
            />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
