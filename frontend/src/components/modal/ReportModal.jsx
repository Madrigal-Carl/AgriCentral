import { useState } from "react";
import { Button, Field, FullSelect, TextInput } from "@/components/ui";
import { FileUploader } from "@/components/public";
import { ModalShell } from "./ModalShell";
import { REPORT_TYPE_OPTIONS, SEVERITY_OPTIONS } from "@/constants/data";

export function ReportModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title) return;
    onSave(form);
  };

  return (
    <ModalShell
      eyebrow="Report"
      title={mode === "add" ? "Add New Report" : `Edit ${initial.id}`}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" type="submit" form="report-form">
            {mode === "add" ? "Add Report" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="report-form" onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" full>
            <TextInput
              value={form.title}
              onChange={(v) => set("title", v)}
              placeholder="Short summary"
            />
          </Field>
          <Field label="Type">
            <FullSelect
              value={form.type}
              onChange={(v) => set("type", v)}
              options={REPORT_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Severity">
            <FullSelect
              value={form.severity}
              onChange={(v) => set("severity", v)}
              options={SEVERITY_OPTIONS}
            />
          </Field>
          <Field label="Details" full>
            <textarea
              value={form.details}
              onChange={(e) => set("details", e.target.value)}
              placeholder="Describe the report…"
              rows={5}
              className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground resize-y"
            />
          </Field>
          <Field label="Files (Optional)" full>
            <FileUploader
              value={form.files}
              onChange={(v) => set("files", v)}
            />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
