import { useMemo, useRef, useState, useEffect } from "react";
import { Wheat, Filter, Search } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/public";
import { Select } from "@/components/ui";
import { useFarms } from "@/hooks/useFarms";
import { useCrops } from "@/hooks/useCrops";
import {
  BOAC_CENTER,
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

// The farm list API (filterActiveCrops in farm.service.js) only ever
// returns crop entries with one of these two statuses — harvested/withered/
// destroyed crops are stripped off the farm before it reaches the client.
// So these are the only statuses that can ever actually match here.
const ACTIVE_CROP_STATUSES = ["planted", "growing"];

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

function popupHtml(farm) {
  const farmerNames = farm.farmers;

  const crops = farm.crops
    .map((c) => {
      const color = TONE_COLOR[CROP_STATUS_TONE[c.status]] || "#64748b";
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0;">
          <span style="font-size:13px;color:#0f172a;font-weight:500;">${escapeHtml(c.name)}</span>
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
        ${escapeHtml(farm.tag)}
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
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // The backend already resolves `search` (tag/address) and `crop` (crop
  // name) into a farm filter server-side (see getFarms in farm.service.js),
  // so both are sent straight through as query params rather than
  // re-filtered client-side.
  const { data, isError, error } = useFarms({
    all: true,
    ...(search ? { search } : {}),
    ...(cropFilter ? { crop: cropFilter } : {}),
  });

  // Crop name options for the dropdown — same pattern used on the Farms
  // table page (`all: true` skips pagination since we just need names).
  const { data: cropsData } = useCrops({ all: true });
  const cropOptions = Array.from(
    new Set((cropsData?.crops ?? []).map((c) => c.name)),
  ).map((name) => ({ value: name, label: name }));

  const farms = useMemo(() => {
    return (data?.farms ?? []).map((f) => ({
      id: f._id,
      tag: f.tag,
      address: f.address,
      location:
        f.latitude != null && f.longitude != null
          ? { lat: Number(f.latitude), lng: Number(f.longitude) }
          : null,
      farmers: (f.assignedFarmers || []).map((farmer) =>
        typeof farmer === "string" ? farmer : farmer.fullName,
      ),
      crops: (f.crops || []).map((c) => ({
        name:
          typeof c.crop === "string"
            ? c.crop
            : (c.crop?.name ?? "Unknown crop"),
        status: c.status,
        yield: c.yield || 0,
      })),
      yieldKg: (f.crops || []).reduce((sum, c) => sum + (c.yield || 0), 0),
    }));
  }, [data]);

  const filtered = useMemo(() => {
    return farms.filter((f) => {
      if (!f.location) return false;
      if (statusFilter && !f.crops.some((c) => c.status === statusFilter))
        return false;
      return true;
    });
  }, [farms, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Farm Maps"
        subtitle="Geospatial view of all farms. Hover a pin to see the farmer, yielded crops, and status."
      />

      {isError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load farms"}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 border border-border bg-surface p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tag or address…"
            className="w-full border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-secondary focus:border-foreground"
          />
        </div>
        <Select
          value={cropFilter}
          onChange={setCropFilter}
          placeholder="All crops"
          options={[{ value: "", label: "All crops" }, ...cropOptions]}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All statuses"
          options={[
            { value: "", label: "All statuses" },
            ...ACTIVE_CROP_STATUSES.map((s) => ({
              value: s,
              label: CROP_STATUS_LABEL[s] || s,
            })),
          ]}
        />
      </div>

      <FarmsLeafletMap farms={filtered} />

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-secondary">
        <Wheat className="h-3.5 w-3.5 text-accent" />
        <span>Status legend:</span>
        {ACTIVE_CROP_STATUSES.map((s) => (
          <StatusPill key={s} tone={CROP_STATUS_TONE[s]}>
            {CROP_STATUS_LABEL[s]}
          </StatusPill>
        ))}
      </div>
    </div>
  );
}
