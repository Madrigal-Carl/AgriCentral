import { useState } from "react";
import { MapPin, Crosshair, X, AlertTriangle } from "lucide-react";
import { LeafletMap } from "@/components/ui";
import { fmtCoord } from "@/utils/format";

export function LocationPicker({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    setBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setBusy(false);
      },
      (err) => {
        setError(err.message || "Unable to get current location.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3 border border-border p-3">
      <div className="flex items-start gap-2 text-xs text-secondary">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
        <span>
          Click anywhere on the map to drop a pin. Drag the pin to refine the
          farm's exact location.
        </span>
      </div>

      <LeafletMap location={value} onPick={onChange} height="h-64" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          {value ? (
            <span className="font-mono text-foreground">
              {fmtCoord(value.lat, "N", "S")}, {fmtCoord(value.lng, "E", "W")}
            </span>
          ) : (
            <span className="text-secondary">No pin dropped yet.</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={busy}
            className="inline-flex items-center gap-1.5 border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60"
          >
            <Crosshair className="h-3.5 w-3.5 text-accent" />
            {busy ? "Locating…" : "Use my location"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-secondary hover:text-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-1.5 text-xs text-danger">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
