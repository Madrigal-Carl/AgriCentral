import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
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

export function SettingsPage() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.fullname,
    email: user?.email,
    phone: "+1 (415) 555 0142",
    current: "",
    next: "",
    confirm: "",
  });

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Account preferences and security."
      />
      <div className="space-y-6">
        <Section
          title="Profile Information"
          description="This information is visible to your team."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full Name"
              value={form.name}
              onChange={update("name")}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={update("email")}
            />
            <Field
              label="Contact Number"
              value={form.phone}
              onChange={update("phone")}
            />
          </div>
        </Section>

        <Section
          title="Change Password"
          description="Use a strong password you don't use elsewhere."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Current Password"
              type="password"
              value={form.current}
              onChange={update("current")}
            />
            <Field
              label="New Password"
              type="password"
              value={form.next}
              onChange={update("next")}
            />
            <Field
              label="Confirm Password"
              type="password"
              value={form.confirm}
              onChange={update("confirm")}
            />
          </div>
        </Section>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button variant="accent">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
