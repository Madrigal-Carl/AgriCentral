import { useState, useMemo, useRef, useEffect } from "react";
import { MapPin, Wheat, Scale, Filter } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/public";
import { Select } from "@/components/ui";
import {
  FARMS,
  BOAC_CENTER,
  CROP_OPTIONS,
  CROP_STATUS_TONE,
  CROP_STATUS_LABEL,
} from "@/constants/data";

const MARKER_ICON_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const MARKER_ICON_2X_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const MARKER_SHADOW_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const TONE_COLOR = {
  success: "#16a34a",
  info: "#2563eb",
  neutral: "#64748b",
  warning: "#d97706",
  danger: "#dc2626",
};

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

// farmers are stored like "FR-001 · Lina Okoro" — strip the id, keep the name
function farmerName(entry) {
  const parts = String(entry).split("·");
  return (parts[1] || parts[0]).trim();
}

function popupHtml(farm) {
  const farmerNames = (farm.farmers || []).map(farmerName);

  const crops = farm.crops
    .map((c) => {
      const color = TONE_COLOR[CROP_STATUS_TONE[c.status]] || "#64748b";
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0;">
          <span style="font-size:13px;color:#0f172a;font-weight:500;">${escapeHtml(c.crop)}</span>
          <span style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase;letter-spacing:0.04em;">
            ${escapeHtml(CROP_STATUS_LABEL[c.status] || c.status)}
          </span>
        </div>`;
    })
    .join("");
  return `
    <div style="min-width:200px;font-family:inherit;">
      <div style="font-weight:700;font-size:14px;color:#0f172a;margin-bottom:2px;">
        ${escapeHtml(farm.address)}
      </div>
      <div style="font-size:11px;color:#64748b;margin-bottom:8px;">
        ${escapeHtml(farm.id)} · ${farm.size} ha
      </div>
      <div style="border-top:1px solid #e2e8f0;padding-top:6px;margin-bottom:6px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:2px;">
          ${farmerNames.length > 1 ? "Farmers" : "Farmer"}
        </div>
        <div style="font-size:13px;font-weight:600;color:#0f172a;">
          ${
            farmerNames.length
              ? farmerNames.map(escapeHtml).join(", ")
              : '<span style="font-weight:400;color:#64748b;">Unassigned</span>'
          }
        </div>
      </div>
      <div style="border-top:1px solid #e2e8f0;padding-top:6px;margin-bottom:6px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:2px;">
          Yielded Crops
        </div>
        <div style="font-size:15px;font-weight:700;color:#0f172a;">
          ${farm.yieldKg.toLocaleString()} kg
        </div>
      </div>
      <div style="border-top:1px solid #e2e8f0;padding-top:6px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:2px;">
          Crops
        </div>
        ${crops || '<div style="font-size:12px;color:#64748b;">No crops</div>'}
      </div>
    </div>
  `;
}

function FarmsLeafletMap({ farms }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const iconRef = useRef(null);
  const farmsRef = useRef(farms);
  farmsRef.current = farms;

  const drawMarkers = (L, map, layer, icon, currentFarms) => {
    layer.clearLayers();
    const pts = [];
    currentFarms.forEach((f) => {
      if (!f.location) return;
      const m = L.marker([f.location.lat, f.location.lng], { icon });
      m.bindPopup(popupHtml(f));
      m.on("mouseover", () => m.openPopup());
      m.addTo(layer);
      pts.push([f.location.lat, f.location.lng]);
    });
    if (pts.length === 1) {
      map.setView(pts[0], 15);
    } else if (pts.length > 1) {
      map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView([BOAC_CENTER.lat, BOAC_CENTER.lng], 13);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let cleanup = [];
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      iconRef.current = L.icon({
        iconUrl: MARKER_ICON_URL,
        iconRetinaUrl: MARKER_ICON_2X_URL,
        shadowUrl: MARKER_SHADOW_URL,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const map = L.map(containerRef.current, {
        center: [BOAC_CENTER.lat, BOAC_CENTER.lng],
        zoom: 13,
        scrollWheelZoom: true,
      });
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const layer = L.layerGroup().addTo(map);
      layerRef.current = layer;

      drawMarkers(L, map, layer, iconRef.current, farmsRef.current);

      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(containerRef.current);
      cleanup.push(() => ro.disconnect());
      setTimeout(() => map.invalidateSize(), 50);
    })();

    return () => {
      cancelled = true;
      cleanup.forEach((fn) => fn());
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      drawMarkers(L, map, layer, iconRef.current, farms);
    })();
    return () => {
      cancelled = true;
    };
  }, [farms]);

  return (
    <div
      ref={containerRef}
      className="relative z-0 w-full h-[calc(100vh-260px)] min-h-[480px] border border-border bg-muted rounded-lg"
    />
  );
}

export function FarmMapsPage() {
  const [cropFilter, setCropFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    return FARMS.filter((f) => {
      if (!f.location) return false;
      if (cropFilter && !f.crops.some((c) => c.crop === cropFilter))
        return false;
      if (statusFilter && !f.crops.some((c) => c.status === statusFilter))
        return false;
      return true;
    });
  }, [cropFilter, statusFilter]);

  const totalYield = useMemo(
    () => filtered.reduce((s, f) => s + (f.yieldKg || 0), 0),
    [filtered],
  );

  return (
    <div>
      <PageHeader
        title="Farm Maps"
        subtitle="Geospatial view of all farms. Hover a pin to see the farmer, yielded crops, and status."
      />

      <div className="mb-4 grid grid-cols-1 gap-3 border border-border bg-surface px-4 py-3 sm:flex sm:flex-wrap sm:items-center">
        <div className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-wide text-secondary sm:flex">
          <Filter className="h-3.5 w-3.5" /> Filters
        </div>
        <div className="min-w-0 sm:min-w-[180px]">
          <Select
            value={cropFilter}
            onChange={setCropFilter}
            placeholder="All crops"
            options={[
              { value: "", label: "All crops" },
              ...CROP_OPTIONS.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>
        <div className="min-w-0 sm:min-w-[180px]">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All statuses"
            options={[
              { value: "", label: "All statuses" },
              { value: "planted", label: "Planted" },
              { value: "growing", label: "Growing" },
              { value: "harvested", label: "Harvested" },
              { value: "fallow", label: "Fallow" },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm sm:ml-auto">
          <div className="flex items-center gap-1.5 text-secondary">
            <MapPin className="h-4 w-4 text-accent" />
            <span className="font-semibold text-foreground">
              {filtered.length}
            </span>{" "}
            farms
          </div>
          <div className="flex items-center gap-1.5 text-secondary">
            <Scale className="h-4 w-4 text-accent" />
            <span className="font-semibold text-foreground">
              {totalYield.toLocaleString()}
            </span>{" "}
            kg total
          </div>
        </div>
      </div>

      <FarmsLeafletMap farms={filtered} />

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-secondary">
        <Wheat className="h-3.5 w-3.5 text-accent" />
        <span>Status legend:</span>
        {["planted", "growing", "harvested", "fallow"].map((s) => (
          <StatusPill key={s} tone={CROP_STATUS_TONE[s]}>
            {CROP_STATUS_LABEL[s]}
          </StatusPill>
        ))}
      </div>
    </div>
  );
}
