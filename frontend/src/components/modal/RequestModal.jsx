import { useEffect, useMemo, useState } from "react";
import { Wrench, Beef } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Field,
  FullSelect,
  MultiSelect,
  TextInput,
} from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { TYPE_OPTIONS, SEVERITY_OPTIONS } from "@/constants/data";
import {
  createRequestFormSchema,
  createRequestUpdateSchema,
} from "@/schemas/request.schema";
import { useCreateRequest, useUpdateRequest } from "@/hooks/useRequests";
import { useLivestockAvailability } from "@/hooks/useLivestocks";
import { useEquipmentAvailability } from "@/hooks/useEquipments";
import { getRequestLines } from "@/utils/request";
import { getErrorMessage } from "@/utils/getErrorMessage";

function toFormShape(request) {
  return {
    title: request.title,
    severity: request.severity,
    entityType: request.entityType,
    lines: getRequestLines(request),
    details: request.details,
  };
}

export function RequestModal({ mode, initial, onClose, onSave }) {
  const [submitError, setSubmitError] = useState(null);
  const isEdit = mode === "edit";
  const { data: livestockData, isPending: livestockLoading, error: livestockError } = useLivestockAvailability();
  const { data: equipmentData, isPending: equipmentLoading, error: equipmentError } = useEquipmentAvailability();

  const normalizedInitial = useMemo(
    () => (initial ? toFormShape(initial) : initial),
    [initial],
  );

  const resolver = useMemo(
    () =>
      zodResolver(
        (isEdit ? createRequestUpdateSchema : createRequestFormSchema)({ equipment: equipmentData, livestock: livestockData }),
      ),
    [isEdit, equipmentData, livestockData],
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
      entityType: "equipment",
      lines: [],
      ...normalizedInitial,
    },
  });

  useEffect(() => {
    reset(
      {
        severity: "medium",
        entityType: "equipment",
        lines: [],
        ...normalizedInitial,
      },
      { keepDirty: false, keepDirtyValues: false },
    );
  }, [normalizedInitial, reset]);

  const entityType = watch("entityType");
  const lines = watch("lines") || [];
  const stock = (entityType === "equipment" ? equipmentData : livestockData) ?? [];
  const loadingStock = entityType === "equipment" ? equipmentLoading : livestockLoading;
  const stockError = entityType === "equipment" ? equipmentError : livestockError;
  const ItemIcon = entityType === "equipment" ? Wrench : Beef;
  const itemOptions = stock.map((entry) => ({
    value: entry.name ?? entry.animal,
    label: `${entry.name ?? entry.animal} — ${entry.available} available`,
    disabled: entry.available === 0,
  }));
  const onLinesChange = (keys) => setValue("lines", keys.map((key) =>
    lines.find((line) => line.key === key) ?? { key, quantity: 1 },
  ), { shouldValidate: true, shouldDirty: true });

  // Names/types belong to different inventory pools; never carry lines
  // across an entity-type change.
  const onTypeChange = (v) => {
    setValue("entityType", v);
    setValue("lines", [], { shouldValidate: true, shouldDirty: true });
  };

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateRequest({
      onError: (err) => {
        setSubmitError(getErrorMessage(err));
      },
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateRequest({
      onError: (err) => {
        setSubmitError(getErrorMessage(err));
      },
    });

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      const payload = {
        title: values.title,
        severity: values.severity,
        entityType: values.entityType,
        lines: values.lines,
        details: values.details,
      };

      if (mode === "add") {
        const { request } = await createMutateAsync(payload);
        onSave?.(request);
      } else {
        const { request } = await updateMutateAsync({
          id: initial._id,
          ...payload,
        });
        onSave?.(request);
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Failed to save request"));
    }
  };

  const busy = isCreating || isUpdating || loadingStock || !!stockError;

  return (
    <ModalShell
      eyebrow="Request"
      title={mode === "add" ? "Add New Request" : `Edit ${initial.title}`}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="accent"
            type="submit"
            form="request-form"
            disabled={busy}
          >
            {busy ? "Saving…" : mode === "add" ? "Add Request" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="request-form" onSubmit={handleSubmit(onSubmit)}>
        {submitError && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" full error={errors.title?.message}>
            <TextInput {...register("title")} placeholder="Short summary" />
          </Field>

          <Field label="Type" error={errors.entityType?.message}>
            <Controller
              name="entityType"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={onTypeChange}
                  options={TYPE_OPTIONS}
                />
              )}
            />
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

          <Field
            label={entityType === "equipment" ? "Equipment" : "Livestock"}
            full
            error={errors.lines?.message || stockError?.message}
          >
            <Controller
              name="lines"
              control={control}
              render={() => (
                <MultiSelect
                  values={lines.map((line) => line.key)}
                  onChange={onLinesChange}
                  options={itemOptions}
                  placeholder={loadingStock ? "Loading availability…" : `Select ${entityType} names/types…`}
                  searchPlaceholder={`Search ${entityType}…`}
                />
              )}
            />
          </Field>

          {lines.length > 0 && (
            <div className="sm:col-span-2 space-y-2">
              {lines.map((line, index) => {
                const available = stock.find((entry) => (entry.name ?? entry.animal) === line.key)?.available ?? 0;
                const quantityError = errors.lines?.[index]?.quantity?.message || (line.quantity > available ? `Only ${available} available` : undefined);
                return (
                  <div key={line.key} className="flex items-center justify-between gap-3 w-full bg-surface border border-border px-3 py-2 flex-wrap">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <ItemIcon className="h-4 w-4 text-accent" />{line.key}
                    </div>
                    <div className="w-full sm:w-auto">
                      <div className="flex items-center gap-3">
                        <label htmlFor={`request-quantity-${index}`} className="label-eyebrow shrink-0">Quantity</label>
                        <div className="w-24">
                          <TextInput id={`request-quantity-${index}`} type="number" min={1} max={available} step={1} aria-label={`Quantity of ${line.key}`}
                            aria-invalid={!!quantityError}
                            {...register(`lines.${index}.quantity`, { valueAsNumber: true })} />
                        </div>
                      </div>
                      {quantityError && <p className="mt-1 text-xs text-red-600">{quantityError}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Field label="Details" full error={errors.details?.message}>
            <textarea
              {...register("details")}
              placeholder="Describe the request…"
              rows={5}
              className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground resize-y"
            />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
