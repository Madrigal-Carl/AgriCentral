import { useState } from "react";
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
import { farmerFormSchema, farmerUpdateSchema } from "@/schemas/farmer.schema";
import { useCreateFarmer, useUpdateFarmer } from "@/hooks/useFarmers";
import { useAssociations } from "@/hooks/useAssociations";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Maps a backend farmer record onto the form's field names.
function toFormShape(farmer, extra = {}) {
  return {
    id: farmer._id,
    name: farmer.fullName,
    contact: farmer.contactNumber,
    email: farmer.emailAddress,
    gender: farmer.gender,
    dob: farmer.birthDate?.slice
      ? farmer.birthDate.slice(0, 10)
      : farmer.birthDate,
    address: farmer.address,
    position: farmer.position,
    status: farmer.status,
    files: farmer.attachments || [],
    association: farmer.association?._id ?? farmer.association,
    ...extra,
  };
}

export function FarmerModal({ mode, initial, onClose, onSave }) {
  const { role } = useAuth();
  const isFar = role === "far";
  const [submitError, setSubmitError] = useState(null);
  const isEdit = mode === "edit";

  // FAR users edit position directly and don't pick an association — the
  // backend resolves their own association from the authenticated user.
  // Everyone else assigns the farmer to an association explicitly.
  const { data: associationsData } = useAssociations(
    { all: true },
    { enabled: !isFar },
  );

  const associationOptions = (associationsData?.associations ?? []).map(
    (a) => ({ value: a._id, label: a.name }),
  );

  // Association may arrive populated ({_id, name, ...}) or as a plain id
  // string depending on the endpoint — normalize so SingleSelect/useForm
  // always work with a string.
  const normalizedInitial = initial
    ? {
        ...initial,
        association:
          initial.association == null
            ? initial.association
            : typeof initial.association === "string"
              ? initial.association
              : initial.association._id,
      }
    : initial;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? farmerUpdateSchema : farmerFormSchema),
    defaultValues: {
      gender: "male",
      ...normalizedInitial,
      position: initial?.position || "member",
    },
  });

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
        fullName: values.name,
        contactNumber: values.contact,
        emailAddress: values.email,
        gender: values.gender,
        birthDate: values.dob,
        address: values.address,
        position: values.position,
        files: values.files, // hook resolves this into `attachments`
        // FAR users never pick an association — omit the key entirely so
        // the backend falls back to resolving it from req.user.
        ...(!isFar ? { associationId: values.association } : {}),
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
      setSubmitError(err.message || "Failed to save farmer");
    }
  };

  const busy = isCreating || isUpdating;

  return (
    <ModalShell
      title={mode === "add" ? "Add New Farmer" : `Edit ${initial.name}`}
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
          <Field label="Full Name" full error={errors.name?.message}>
            <TextInput {...register("name")} placeholder="Jane Doe" />
          </Field>

          <Field label="Contact Number" error={errors.contact?.message}>
            <TextInput
              {...register("contact")}
              placeholder="+254 700 000 000"
            />
          </Field>

          <Field label="Email Address" error={errors.email?.message}>
            <TextInput
              type="email"
              {...register("email")}
              placeholder="name@email.com"
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

          <Field label="Address" full={!isEdit} error={errors.address?.message}>
            <TextInput {...register("address")} placeholder="Street, City" />
          </Field>

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

          {isFar && (
            <Field label="Position" full>
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
          )}

          <Field label="Attachments" full>
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
