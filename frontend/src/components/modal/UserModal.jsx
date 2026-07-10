import { useState } from "react";
import {
  DEFAULT_PASSWORD,
  ROLE_OPTIONS,
  ASSOCIATION_OPTIONS,
} from "@/constants/data";
import { KeyRound } from "lucide-react";
import {
  Field,
  TextInput,
  FullSelect,
  Button,
  SingleSelect,
} from "@/components/ui";
import { ModalShell } from "./ModalShell";

export function UserModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email) return;
    onSave(form);
  };

  const handleResetPassword = () => set("password", DEFAULT_PASSWORD);

  return (
    <ModalShell
      title={mode === "add" ? "Add New User" : `Edit ${initial.fullName}`}
      eyebrow="User"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            {mode === "add" ? "Add User" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name" full>
            <TextInput
              value={form.fullName}
              onChange={(v) => set("fullName", v)}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Email Address" full>
            <TextInput
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              placeholder="name@email.com"
            />
          </Field>
          <Field label="Role" full>
            <FullSelect
              value={form.role}
              onChange={(v) => set("role", v)}
              options={ROLE_OPTIONS}
            />
          </Field>

          {/* Association only applies to FAR accounts, since FAR
              is tied to a specific association. Shown whenever
              the selected role is FAR, in both add and edit mode. */}
          {form.role === "far" && (
            <Field label="Association" full>
              <SingleSelect
                value={form.association}
                onChange={(v) => set("association", v)}
                options={ASSOCIATION_OPTIONS}
                placeholder="Select association"
                searchPlaceholder="Search associations..."
              />
            </Field>
          )}

          {/* Password is always view-only. In add mode it shows the fixed
              default password the new user will receive; in edit mode it
              shows the current password, with a Reset Password action
              underneath that drafts the default password to be applied
              on Save. */}
          <Field label="Password" full>
            <TextInput
              type="text"
              value={form.password}
              onChange={() => {}}
              readOnly
              disabled
              placeholder="••••••••"
            />
            {mode === "edit" && (
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
