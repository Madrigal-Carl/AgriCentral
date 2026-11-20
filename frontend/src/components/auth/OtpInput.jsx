import { useRef } from "react";

// Six single-digit boxes. `value` is an array of 6 strings ("" when empty).
// Supports typing, backspace/arrow navigation, paste and SMS/email autofill.
export function OtpInput({ value, onChange, length = 6, disabled = false, invalid = false, autoFocus = false }) {
  const refs = useRef([]);

  const focusAt = (index) => {
    const target = refs.current[Math.max(0, Math.min(length - 1, index))];
    target?.focus();
    target?.select();
  };

  // Writes digits starting at `start`, then focuses the next empty box.
  const fill = (start, digits) => {
    const next = [...value];
    let index = start;
    for (const digit of digits) {
      if (index >= length) break;
      next[index] = digit;
      index += 1;
    }
    onChange(next);
    focusAt(index);
  };

  const handleChange = (index, event) => {
    const digits = event.target.value.replace(/\D/g, "");
    if (!digits) {
      const next = [...value];
      next[index] = "";
      onChange(next);
      return;
    }
    // Typing over a filled box yields two characters; keep the newest one.
    fill(index, digits.length === 2 && value[index] ? digits.slice(-1) : digits);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      event.preventDefault();
      const next = [...value];
      next[index - 1] = "";
      onChange(next);
      focusAt(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (index, event) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    event.preventDefault();
    // A full code pasted anywhere replaces the whole code.
    fill(digits.length >= length ? 0 : index, digits.slice(0, length));
  };

  return (
    <div role="group" aria-label="6-digit code" className="flex justify-between gap-2">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && index === 0}
          maxLength={length}
          value={value[index] ?? ""}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          className={`h-12 w-full min-w-0 rounded-[5px] border bg-white text-center text-[18px] font-medium text-[#0F3D2E] outline-none transition-colors focus:border-[#00A36C] focus:ring-2 focus:ring-[#00A36C]/20 disabled:opacity-60 ${
            invalid ? "border-red-400" : "border-[#cfe0d5]"
          }`}
        />
      ))}
    </div>
  );
}
