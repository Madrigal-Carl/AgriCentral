import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import useAuthStore from "@/stores/auth.store";
import { useUpdateUser } from "@/hooks/useUsers";
import { PageHeader } from "@/components/public";
import { Button } from "@/components/ui";

function Field({ label, ...rest }) {
  return (
    <label className="block">
      <span className="label-eyebrow !text-[10px]">{label}</span>
      <input
        {...rest}
        className="mt-2 block w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
      />
    </label>
  );
}

function PasswordField({ label, visible, onToggleVisible, ...rest }) {
  return (
    <label className="block">
      <span className="label-eyebrow !text-[10px]">{label}</span>
      <div className="relative mt-2">
        <input
          {...rest}
          type={visible ? "text" : "password"}
          className="block w-full border border-border bg-surface px-3 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-foreground"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </label>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="bg-surface border border-border rounded-lg">
      <header className="border-b border-border px-6 py-5">
        <h2 className="font-display text-lg text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-secondary">{description}</p>
        )}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

const blankForm = {
  fullname: "",
  email: "",
  current: "",
  next: "",
  confirm: "",
};

export function SettingsPage() {
  const { user } = useAuth();
  // useAuth's `user` comes from this Zustand store, not React Query — so
  // after we PATCH our own user record, invalidating React Query's user
  // cache does nothing for the header/avatar's idea of "me". Re-pull it
  // from the store directly so we can refresh it after a successful save.
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);

  const [form, setForm] = useState(blankForm);
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // useAuth's `user` loads asynchronously (fetchCurrentUser runs in an
  // effect inside useAuth), so it's still null on first render here.
  // Re-sync whenever it actually becomes available/changes, otherwise the
  // fields just stay permanently blank.
  useEffect(() => {
    if (user) {
      setForm((s) => ({
        ...s,
        fullname: user.fullname ?? "",
        email: user.email ?? "",
      }));
    }
  }, [user]);

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const toggleShowPassword = (k) =>
    setShowPassword((s) => ({ ...s, [k]: !s[k] }));

  const { mutateAsync: updateUserMutateAsync, isPending: isSaving } =
    useUpdateUser({
      onError: (err) => {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to save changes",
        );
      },
    });

  const handleCancel = () => {
    setError(null);
    setSuccess(null);
    setShowPassword({ current: false, next: false, confirm: false });
    setForm({
      ...blankForm,
      fullname: user?.fullname ?? "",
      email: user?.email ?? "",
    });
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!user?._id) return;

    const wantsPasswordChange = form.next || form.confirm || form.current;

    if (wantsPasswordChange) {
      if (!form.current) {
        setError("Enter your current password to set a new one.");
        return;
      }
      if (!form.next) {
        setError("Enter a new password.");
        return;
      }
      if (form.next !== form.confirm) {
        setError("New password and confirmation don't match.");
        return;
      }
    }

    const payload = {
      id: user._id,
      fullname: form.fullname,
      email: form.email,
      ...(wantsPasswordChange ? { password: form.next } : {}),
    };

    try {
      await updateUserMutateAsync(payload);
      await fetchCurrentUser();
      setForm((s) => ({ ...s, current: "", next: "", confirm: "" }));
      setShowPassword({ current: false, next: false, confirm: false });
      setSuccess("Settings saved.");
    } catch (err) {
      setError(err.message || "Failed to save changes");
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Account preferences and security."
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-6">
        <Section
          title="Profile Information"
          description="This information is visible to your team."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full Name"
              value={form.fullname}
              onChange={update("fullname")}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={update("email")}
            />
          </div>
        </Section>

        <Section
          title="Change Password"
          description="Use a strong password you don't use elsewhere. Leave blank to keep your current password."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PasswordField
              label="Current Password"
              value={form.current}
              onChange={update("current")}
              visible={showPassword.current}
              onToggleVisible={() => toggleShowPassword("current")}
            />
            <PasswordField
              label="New Password"
              value={form.next}
              onChange={update("next")}
              visible={showPassword.next}
              onToggleVisible={() => toggleShowPassword("next")}
            />
            <PasswordField
              label="Confirm Password"
              value={form.confirm}
              onChange={update("confirm")}
              visible={showPassword.confirm}
              onToggleVisible={() => toggleShowPassword("confirm")}
            />
          </div>
        </Section>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
