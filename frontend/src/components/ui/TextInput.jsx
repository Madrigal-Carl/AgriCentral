import { forwardRef } from "react";

export const TextInput = forwardRef(function TextInput(
  { error, className = "", ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`w-full border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground ${
        error ?? "border-border"
      } ${className}`}
      {...rest}
    />
  );
});
