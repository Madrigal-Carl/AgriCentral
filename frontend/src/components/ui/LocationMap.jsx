import { LeafletMap } from "@/components/ui";
import { MapPin, ExternalLink } from "lucide-react";
import { fmtCoord } from "@/utils/format";

export function LocationMap({ location }) {
  const { lat, lng } = location;
  return (
    <div className="space-y-3">
      <LeafletMap location={location} interactive={false} height="h-56" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-accent" />
          <span className="font-mono text-foreground">
            {fmtCoord(lat, "N", "S")}, {fmtCoord(lng, "E", "W")}
          </span>
        </div>
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
        >
          Open in maps <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
