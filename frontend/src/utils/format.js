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

export function fmtPendingSince(value, now = Date.now()) {
    const submitted = new Date(value).getTime();
    if (!value || !Number.isFinite(submitted)) return "—";
    const minutes = Math.max(0, Math.floor((now - submitted) / 60000));
    if (minutes < 1) return "just now";
    const hours = Math.floor(minutes / 60);
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
}
