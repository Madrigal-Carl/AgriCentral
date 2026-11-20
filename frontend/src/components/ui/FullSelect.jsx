import { Select } from "@/components/ui";

export function FullSelect({ value, onChange, options, defaultValue, placeholder }) {
  return (
    <div className="[&>div]:w-full">
      <Select
        value={value}
        onChange={onChange}
        options={options}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </div>
  );
}
