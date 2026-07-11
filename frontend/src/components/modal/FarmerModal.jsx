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
import {
  GENDER_OPTIONS,
  ASSOCIATION_OPTIONS,
  POSITION_OPTIONS,
} from "@/constants/data";
import { FileUploader } from "@/components/public";
import { ModalShell } from "./ModalShell";
import { farmerFormSchema } from "@/schemas/farmer.schema";
import { useCreateFarmer } from "@/hooks/useFarmers";

export function FarmerModal({ mode, initial, onClose, onSave }) {
  const { role } = useAuth();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(farmerFormSchema),
    defaultValues: initial,
  });

  const { mutateAsync, isPending } = useCreateFarmer({
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
      };

      if (mode === "add") {
        const { farmer } = await mutateAsync(payload);
        onSave?.({
          ...farmer,
          name: farmer.fullName,
          contact: farmer.contactNumber,
          email: farmer.emailAddress,
          dob: farmer.birthDate,
          files: farmer.attachments,
          farms: values.farms,
          livestock: values.livestock,
          equipment: values.equipment,
        });
      } else {
        // Edit flow: hook up to an update endpoint later; for now keep local behavior.
        onSave?.({ ...values });
      }
    } catch (err) {
      setSubmitError(err.message || "Failed to save farmer");
    }
  };

  const busy = isPending;

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
                />
              )}
            />
          </Field>

          <Field label="Birth Date" error={errors.dob?.message}>
            <TextInput type="date" {...register("dob")} />
          </Field>

          <Field label="Address" full error={errors.address?.message}>
            <TextInput {...register("address")} placeholder="Street, City" />
          </Field>

          {role !== "far" && (
            <Field label="Association" full>
              <Controller
                name="association"
                control={control}
                render={({ field }) => (
                  <SingleSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={ASSOCIATION_OPTIONS}
                    placeholder="Select association…"
                    searchPlaceholder="Search association…"
                  />
                )}
              />
            </Field>
          )}

          {role === "far" && (
            <Field label="Position" full>
              <Controller
                name="position"
                control={control}
                render={({ field }) => (
                  <FullSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={POSITION_OPTIONS}
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
