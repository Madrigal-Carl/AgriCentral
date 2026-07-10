import {
  Button,
  IconButton,
  Select,
  SingleSelect,
  Field,
  TextInput,
  FullSelect,
} from "@/components/ui";
import { useState } from "react";
import { ModalShell } from "./ModalShell";
import { EQUIPMENT_CONDITION_OPTIONS } from "@/constants/data";

export function EquipmentModal({ nextId, catalog, onClose, onSave }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("available");
  const [acquisitionDate, setAcquisitionDate] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!name) return;
    onSave({ name, status, acquisitionDate });
  };

  return (
    <ModalShell
      eyebrow={`Equipment · ${nextId}`}
      title="Add New Equipment"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} type="submit">
            Add Equipment
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Equipment">
          <SingleSelect
            value={name}
            onChange={setName}
            options={catalog}
            placeholder="Select equipment…"
            searchPlaceholder="Search or add equipment…"
            allowCreate
          />
        </Field>
        <Field label="Condition">
          <FullSelect
            value={status}
            onChange={setStatus}
            options={EQUIPMENT_CONDITION_OPTIONS}
          />
        </Field>
        <Field label="Acquisition Date">
          <TextInput
            type="date"
            value={acquisitionDate}
            onChange={setAcquisitionDate}
          />
        </Field>
      </form>
    </ModalShell>
  );
}
