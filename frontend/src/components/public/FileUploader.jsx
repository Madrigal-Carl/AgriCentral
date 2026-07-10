import { fmtBytes } from "@/utils/format";
import { Upload, FileText, Check, X } from "lucide-react";
import { useEffect, useRef } from "react";

export function FileUploader({ value = [], onChange }) {
  const files = Array.isArray(value) ? value : [];
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const setFiles = (updater) =>
    onChange(
      typeof updater === "function" ? updater(filesRef.current) : updater,
    );

  const inputRef = useRef(null);

  const startUpload = (id) => {
    const tick = () => {
      let stillRunning = false;
      setFiles((prev) => {
        const next = prev.map((f) => {
          if (f.id !== id || f.progress >= 100) return f;
          const inc = Math.floor(Math.random() * 18) + 7;
          const np = Math.min(100, f.progress + inc);
          if (np < 100) stillRunning = true;
          return {
            ...f,
            progress: np,
            status: np >= 100 ? "done" : "uploading",
          };
        });
        return next;
      });
      if (stillRunning) setTimeout(tick, 250);
    };
    setTimeout(tick, 200);
  };

  const onPick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const mapped = picked.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
      progress: 0,
      status: "uploading",
    }));
    setFiles((prev) => [...prev, ...mapped]);
    mapped.forEach((m) => startUpload(m.id));
    e.target.value = "";
  };

  const remove = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-1.5 border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-secondary hover:border-foreground-40 hover:bg-muted-40"
      >
        <Upload className="h-5 w-5" />
        <span className="font-medium text-foreground">
          Click to upload files
        </span>
        <span className="text-xs">You can select multiple files</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={onPick}
      />
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 border border-border bg-surface px-3 py-2.5"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center bg-muted text-secondary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm font-medium text-foreground hover:underline"
                  >
                    {f.name}
                  </a>
                  <span className="shrink-0 text-xs text-secondary">
                    {fmtBytes(f.size)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-muted">
                    <div
                      className={`h-full transition-all ${
                        f.status === "done" ? "bg-success" : "bg-accent"
                      }`}
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-secondary">
                    {f.status === "done" ? (
                      <Check className="ml-auto h-3.5 w-3.5 text-success" />
                    ) : (
                      `${f.progress}%`
                    )}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="grid h-7 w-7 shrink-0 place-items-center text-secondary hover:bg-muted hover:text-foreground"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
