import { useState, useRef, useEffect } from "react";
import { Download, Loader2, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui";

export function ExportDropdown({
  label = "Export",
  variant = "outline",
  disabled = false,
  isExporting = false,
  onExport,
  align = "right",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (format) => {
    setOpen(false);
    if (onExport) {
      onExport(format);
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <Button
        variant={variant}
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled || isExporting}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isExporting ? "Exporting…" : label}
      </Button>

      {open && !isExporting && (
        <div
          className={`absolute z-30 mt-1 w-52 border border-border bg-surface shadow-lg rounded-lg py-1 transition-all ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-secondary uppercase tracking-wider border-b border-border mb-1">
            Export Format
          </div>

          <button
            type="button"
            onClick={() => handleSelect("pdf")}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
          >
            <FileText className="h-4 w-4 text-red-500 shrink-0" />
            <div className="flex flex-col">
              <span className="font-medium leading-none">PDF Document</span>
              <span className="text-[11px] text-secondary mt-0.5">.pdf format</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelect("xlsx")}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="flex flex-col">
              <span className="font-medium leading-none">Excel Spreadsheet</span>
              <span className="text-[11px] text-secondary mt-0.5">.xlsx format</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
