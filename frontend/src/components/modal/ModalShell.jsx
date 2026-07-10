import { X } from "lucide-react";

export function ModalShell({
  title,
  eyebrow,
  onClose,
  children,
  footer,
  maxWidth = "max-w-lg",
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-40 p-4"
      onClick={onClose}
    >
      <div
        className={`relative flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden bg-surface border border-border shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            {eyebrow && <div className="label-eyebrow mb-1">{eyebrow}</div>}
            <h2 className="font-display text-xl tracking-tight text-foreground">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center text-secondary hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted-30 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
