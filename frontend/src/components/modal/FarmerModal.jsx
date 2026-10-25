import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useAuth from "@/hooks/useAuth";
import {
  Button,
  Field,
  SingleSelect,
  TextInput,
  FullSelect,
} from "@/components/ui";
import { GENDER_OPTIONS, POSITION_OPTIONS } from "@/constants/data";
import { FileUploader } from "@/components/public";
import { ModalShell } from "./ModalShell";
import {
  createFarmerFormSchema,
  createFarmerUpdateSchema,
} from "@/schemas/farmer.schema";
import { useCreateFarmer, useUpdateFarmer } from "@/hooks/useFarmers";
import { useAssociations } from "@/hooks/useAssociations";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { LocationFields } from "./LocationFields";
import { referenceId } from "@/hooks/useLookups";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Maps a backend farmer record onto the form's field names.
function toFormShape(farmer, extra = {}) {
  return {
    id: farmer._id,
    lastName: farmer.lastName,
    firstName: farmer.firstName,
    middleName: farmer.middleName || "",
    contact: farmer.contactNumber,
    email: farmer.emailAddress,
    gender: farmer.gender,
    dob: farmer.birthDate?.slice
      ? farmer.birthDate.slice(0, 10)
      : farmer.birthDate,
    address: farmer.address,
    position: farmer.position,
    status: farmer.status,
    profileImage: farmer.profileImage ? [farmer.profileImage] : [],
    association: farmer.association?._id ?? farmer.association,
    ...extra,
  };
}

export function FarmerModal({ mode, initial, onClose, onSave }) {
  const { role } = useAuth();
  const isFar = role === "far";
  const [submitError, setSubmitError] = useState(null);
  const isEdit = mode === "edit";

  const { data: associationsData } = useAssociations(
    { all: true },
    { enabled: !isFar },
  );

  const associationOptions = (associationsData?.associations ?? []).map(
    (a) => ({ value: a._id, label: a.name }),
  );

  const normalizedInitial = useMemo(() => {
    if (!initial) return initial;

    return {
      ...initial,
      municipality: referenceId(initial.municipality),
      barangay: referenceId(initial.barangay),
      street: initial.street ?? "",
      association:
        initial.association == null
          ? initial.association
          : typeof initial.association === "string"
            ? initial.association
            : initial.association._id,
    };
  }, [initial]);

  const resolver = useMemo(
    () =>
      zodResolver(
        isEdit ? createFarmerUpdateSchema() : createFarmerFormSchema(isFar),
      ),
    [isEdit, isFar],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver,
    defaultValues: {
      gender: "male",
      position: normalizedInitial?.position || "member",
      association: normalizedInitial?.association ?? "",
      ...normalizedInitial,
    },
  });

  useEffect(() => {
    reset(
      {
        gender: "male",
        position: normalizedInitial?.position || "member",
        association: normalizedInitial?.association ?? "",
        ...normalizedInitial,
      },
      { keepDirty: false, keepDirtyValues: false },
    );
  }, [normalizedInitial, reset]);

  const { mutateAsync: createMutateAsync, isPending: isCreating } =
    useCreateFarmer({
      onError: (err) => {
        setSubmitError(
          err?.response?.data?.message || err.message || "Something went wrong",
        );
      },
    });

  const { mutateAsync: updateMutateAsync, isPending: isUpdating } =
    useUpdateFarmer({
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
        lastName: values.lastName,
        firstName: values.firstName,
        middleName: values.middleName,
        contactNumber: values.contact,
        emailAddress: values.email || undefined,
        gender: values.gender,
        birthDate: values.dob,
        municipality: values.municipality,
        barangay: values.barangay,
        street: values.street,
        position: values.position,
        profileImage: values.profileImage,
        ...(!isFar && values.association
          ? { associationId: values.association }
          : {}),
      };

      if (mode === "add") {
        const { farmer } = await createMutateAsync(payload);
        onSave?.(
          toFormShape(farmer, {
            farms: values.farms,
            livestock: values.livestock,
            equipment: values.equipment,
          }),
        );
      } else {
        const { farmer } = await updateMutateAsync({
          id: initial.id,
          ...payload,
          status: values.status, // only relevant/sent on edit
        });
        onSave?.(
          toFormShape(farmer, {
            farms: values.farms,
            livestock: values.livestock,
            equipment: values.equipment,
          }),
        );
      }
    } catch (err) {
      const message = getErrorMessage(err, "Failed to save farmer");
      if (message === "This position is already taken in this association") {
        setError("position", { type: "server", message });
      }
      setSubmitError(
        err?.response?.data?.message || err?.message || "Failed to save farmer",
      );
    }
  };

  const busy = isCreating || isUpdating;

  const modalTitle =
    mode === "add"
      ? "Add New Farmer"
      : `Edit ${[initial.firstName, initial.lastName].filter(Boolean).join(" ")}`;

  return (
    <ModalShell
      title={modalTitle}
      eyebrow="Farmer"
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
            form="farmer-form"
            disabled={busy}
          >
            {busy ? "Saving…" : mode === "add" ? "Add Farmer" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="farmer-form" onSubmit={handleSubmit(onSubmit)}>
        {submitError && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Last Name" error={errors.lastName?.message}>
            <TextInput {...register("lastName")} placeholder="Dela Cruz" />
          </Field>
          <Field label="First Name" error={errors.firstName?.message}>
            <TextInput {...register("firstName")} placeholder="Juan" />
          </Field>
          <Field
            label="Middle Name (Optional)"
            error={errors.middleName?.message}
          >
            <TextInput {...register("middleName")} placeholder="Recto" />
          </Field>

          <Field label="Email Address (Optional)" error={errors.email?.message}>
            <TextInput
              type="email"
              {...register("email")}
              placeholder="name@email.com"
            />
          </Field>

          <Field label="Contact Number" full error={errors.contact?.message}>
            <TextInput
              {...register("contact")}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11);
                register("contact").onChange(e);
              }}
              inputMode="numeric"
              maxLength={11}
              placeholder="09123456789"
            />
          </Field>

          <Field label="Gender" error={errors.gender?.message}>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={GENDER_OPTIONS}
                  defaultValue="male"
                />
              )}
            />
          </Field>

          <Field label="Birth Date" error={errors.dob?.message}>
            <TextInput type="date" {...register("dob")} />
          </Field>

          <LocationFields control={control} setValue={setValue} register={register} initial={initial} errors={errors} street />

          {isEdit && (
            <Field label="Status" error={errors.status?.message}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FullSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={STATUS_OPTIONS}
                  />
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

          <Field label="Position" full error={errors.position?.message}>
            <Controller
              name="position"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={POSITION_OPTIONS}
                  defaultValue="member"
                />
              )}
            />
          </Field>

          <Field label="Profile Image" full error={errors.profileImage?.message}>
            <Controller
              name="profileImage"
              control={control}
              render={({ field }) => (
                <FileUploader value={field.value} onChange={field.onChange} accept="image/*" multiple={false} />
              )}
            />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
