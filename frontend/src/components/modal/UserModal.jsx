import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { DEFAULT_PASSWORD, ROLE_OPTIONS } from "@/constants/data";
import {
  Field,
  TextInput,
  FullSelect,
  Button,
  SingleSelect,
} from "@/components/ui";
import { ModalShell } from "./ModalShell";
import { userFormSchema, userUpdateSchema } from "@/schemas/user.schema";
import { useCreateUser, useUpdateUser } from "@/hooks/useUsers";
import { useAvailableAssociations } from "@/hooks/useAssociations";

export function UserModal({ mode, initial, onClose, onSave }) {
  const [submitError, setSubmitError] = useState(null);
  const isEdit = mode === "edit";

  // Password only ever gets sent when the admin explicitly resets it —
  // disabled field always displays DEFAULT_PASSWORD, but that value in
  // form state alone doesn't mean "the admin wants to change it."
  const [passwordWasReset, setPasswordWasReset] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? userUpdateSchema : userFormSchema),
    defaultValues: {
      role: "far",
      password: DEFAULT_PASSWORD,
      ...initial,
    },
  });

  // Only associations with no assignedUser show up here, plus (in edit
  // mode) the association this user already holds — includeId keeps that
  // one visible/selectable even though it technically has an assignedUser.
  const { data: associationsData, isLoading: associationsLoading } =
    useAvailableAssociations({ includeId: initial?.association });
  const associationOptions = (associationsData?.associations ?? []).map(
    (a) => ({
      value: a._id,
      label: a.name,
    }),
  );

  const { mutate: createMutate, isPending: isCreating } = useCreateUser({
    onError: (err) => {
      setSubmitError(
        err?.response?.data?.message || err.message || "Something went wrong",
      );
    },
  });

  const { mutate: updateMutate, isPending: isUpdating } = useUpdateUser({
    onError: (err) => {
      setSubmitError(
        err?.response?.data?.message || err.message || "Something went wrong",
      );
    },
  });

  const onSubmit = (values) => {
    setSubmitError(null);

    const payload = {
      fullname: values.fullname,
      email: values.email,
      role: values.role,
      ...(values.role === "far" ? { association: values.association } : {}),
      ...(!isEdit || passwordWasReset ? { password: values.password } : {}),
    };

    if (mode === "add") {
      createMutate(payload, {
        onSuccess: (data) => onSave?.(data.user),
      });
    } else {
      updateMutate(
        { id: initial._id, ...payload },
        {
          onSuccess: (data) => onSave?.(data.user),
        },
      );
    }
  };

  const handleResetPassword = () => {
    setValue("password", DEFAULT_PASSWORD, { shouldValidate: true });
    setPasswordWasReset(true);
  };

  const busy = isCreating || isUpdating;

  return (
    <ModalShell
      title={mode === "add" ? "Add New User" : `Edit ${initial.fullname}`}
      eyebrow="User"
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
            form="user-form"
            disabled={busy}
          >
            {busy ? "Saving…" : mode === "add" ? "Add User" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit(onSubmit)}>
        {submitError && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name" full error={errors.fullname?.message}>
            <TextInput {...register("fullname")} placeholder="Jane Doe" />
          </Field>

          <Field label="Email Address" full error={errors.email?.message}>
            <TextInput
              type="email"
              {...register("email")}
              placeholder="name@email.com"
            />
          </Field>

          <Field label="Role" full error={errors.role?.message}>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <FullSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={ROLE_OPTIONS}
                />
              )}
            />
          </Field>

          {/* Association only applies to FAR accounts, since FAR is tied
              to a specific association. Shown whenever the selected role
              is FAR, in both add and edit mode. Note: this isn't a field
              on the User model itself — it's sent as part of the user
              payload, and the backend syncs Association.assignedUser to
              match (and clears whichever association the user previously
              held, if any). */}
          <Controller
            name="role"
            control={control}
            render={({ field: roleField }) =>
              roleField.value === "far" ? (
                <Field
                  label="Association"
                  full
                  error={errors.association?.message}
                >
                  <Controller
                    name="association"
                    control={control}
                    render={({ field }) => (
                      <SingleSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={associationOptions}
                        placeholder={
                          associationsLoading
                            ? "Loading associations…"
                            : "Select association"
                        }
                        searchPlaceholder="Search associations..."
                      />
                    )}
                  />
                </Field>
              ) : null
            }
          />

          {/* Password is always view-only. In add mode it shows the fixed
              default password the new user will receive; in edit mode it
              shows a masked placeholder, with a Reset Password action
              underneath that sets it to the default password to be
              applied on Save. */}
          <Field label="Password" full>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextInput
                  type="text"
                  value={isEdit && !passwordWasReset ? "" : field.value}
                  onChange={() => {}}
                  readOnly
                  disabled
                  placeholder={isEdit ? "••••••••" : field.value}
                />
              )}
            />
            {isEdit && (
              <button
                type="button"
                onClick={handleResetPassword}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:underline"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Reset Password
              </button>
            )}
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
