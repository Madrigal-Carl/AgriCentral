export function fmtDate(s) {
    if (!s) return "—";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function fmtBytes(b) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function fmtCoord(n, pos, neg) {
    const dir = n >= 0 ? pos : neg;
    return `${Math.abs(n).toFixed(4)}° ${dir}`;
}

export function fmtLongDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// "Just now", "5m ago", "3h ago", "2d ago"; older than a week shows the date.
export function fmtRelativeTime(value, now = Date.now()) {
    const time = new Date(value).getTime();
    if (!value || !Number.isFinite(time)) return "—";
    const minutes = Math.max(0, Math.floor((now - time) / 60000));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days <= 7) return `${days}d ago`;
    return fmtDate(value);
}

export function fmtRequestedAt(value, now = Date.now()) {
    const submitted = new Date(value).getTime();
    if (!value || !Number.isFinite(submitted)) return "—";
    const minutes = Math.max(0, Math.floor((now - submitted) / 60000));
    if (minutes < 1) return "Just now";
    const hours = Math.floor(minutes / 60);
    if (hours >= 24) return `${Math.floor(hours / 24)}d`;
    if (hours) return `${hours}hr`;
    return `${minutes}m`;
}
