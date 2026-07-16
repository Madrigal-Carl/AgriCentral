import { useEffect, useMemo, useState } from "react";
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
import { useAvailableLivestocks } from "@/hooks/useLivestocks";
import { useAvailableEquipments } from "@/hooks/useEquipments";

function toFormShape(request) {
  return {
    title: request.title,
    severity: request.severity,
    entityType: request.entityType,
    // entityIds comes back from the API as a plain array of id strings —
    // no unwrapping needed here (unlike FarmModal's assignedFarmers, which
    // is an array of {farmer, classification} objects).
    entityIds: request.entityIds ?? [],
    details: request.details,
  };
}

export function RequestModal({ mode, initial, onClose, onSave }) {
  const [submitError, setSubmitError] = useState(null);
  const isEdit = mode === "edit";

  const normalizedInitial = useMemo(
    () => (initial ? toFormShape(initial) : initial),
    [initial],
  );

  const resolver = useMemo(
    () =>
      zodResolver(
        isEdit ? createRequestUpdateSchema() : createRequestFormSchema(),
      ),
    [isEdit],
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
      entityIds: [],
      ...normalizedInitial,
    },
  });

  useEffect(() => {
    reset(
      {
        severity: "medium",
        entityType: "equipment",
        entityIds: [],
        ...normalizedInitial,
      },
      { keepDirty: false, keepDirtyValues: false },
    );
  }, [normalizedInitial, reset]);

  const entityType = watch("entityType");
  const entityIds = watch("entityIds") || [];

  const { data: livestockData } = useAvailableLivestocks({
    enabled: entityType === "livestock",
  });
  const { data: equipmentData } = useAvailableEquipments({
    enabled: entityType === "equipment",
  });

  const itemOptions =
    entityType === "equipment"
      ? (equipmentData?.equipments ?? []).map((e) => ({
          value: e._id,
          label: `${e.propertyNumber} · ${e.name}`,
        }))
      : (livestockData?.livestocks ?? []).map((l) => ({
          value: l._id,
          label: `${l.propertyNumber} · ${l.animal}`,
        }));

  // Switching type invalidates the previous selection since livestock and
  // equipment ids live in entirely different collections — a request can
  // only target one type, never both (see request.model.js).
  const onTypeChange = (v) => {
    setValue("entityType", v);
    setValue("entityIds", [], { shouldValidate: true });
  };

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateRequest({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateRequest({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      const payload = {
        title: values.title,
        severity: values.severity,
        entityType: values.entityType,
        entityIds: values.entityIds,
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
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save request",
      );
    }
  };

  const busy = isCreating || isUpdating;

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
            error={errors.entityIds?.message}
          >
            <Controller
              name="entityIds"
              control={control}
              render={() => (
                <MultiSelect
                  values={entityIds}
                  onChange={(next) =>
                    setValue("entityIds", next, { shouldValidate: true })
                  }
                  options={itemOptions}
                  placeholder={`Select ${entityType}…`}
                  searchPlaceholder={`Search ${entityType}…`}
                />
              )}
            />
          </Field>

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
