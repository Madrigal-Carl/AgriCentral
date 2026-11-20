import { useMemo, useRef, useState, useEffect } from "react";
import { Wheat, Search } from "lucide-react";
import { PageHeader } from "@/components/public";
import { Select } from "@/components/ui";
import { useFarmMap } from "@/hooks/useFarms";
import { useLookups, lookupOptions } from "@/hooks/useLookups";
import { BOAC_CENTER } from "@/constants/data";

const MARKER_ICON_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const MARKER_ICON_2X_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const MARKER_SHADOW_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

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

const MAX_POPUP_CROPS = 3;
const SECTION_LABEL_STYLE =
  "font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:2px;";

// "13.44560, 121.84030" (latitude, longitude, 5 decimals).
const formatCoordinates = (location) =>
  `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;

// Stage of the latest approved report, plus its area when reported.
const cropStageText = (c) =>
  c.latestAreaHa > 0 ? `${c.stageLabel} · ${c.latestAreaHa.toLocaleString()} ha` : c.stageLabel;

// Crops arrive sorted by yield kg (sum of approved harvested production),
// then planted quantity (both descending).
function popupHtml(farm) {
  const farmerNames = farm.farmers;
  const shown = farm.crops.slice(0, MAX_POPUP_CROPS);
  const hidden = farm.crops.length - shown.length;

  const crops = shown
    .map(
      (c) => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 0;">
          <span style="font-size:12px;color:#0f172a;font-weight:500;">
            ${escapeHtml(c.name)}${
              c.ownership === "farmer"
                ? ' <span style="font-size:10px;font-weight:600;color:#b45309;">Farmer-owned</span>'
                : ""
            }
          </span>
          <span style="font-size:11px;font-weight:600;color:#64748b;white-space:nowrap;">${escapeHtml(cropStageText(c))}</span>
        </div>`,
    )
    .join("");
  return `
    <div style="min-width:200px;max-width:260px;font-family:inherit;">
      <div style="font-weight:700;font-size:13px;color:#0f172a;">${escapeHtml(farm.tag)}</div>
      <div style="font-size:12px;color:#334155;">${escapeHtml(farm.address)}</div>
      <div style="font-size:11px;color:#64748b;margin-bottom:6px;">${escapeHtml(formatCoordinates(farm.location))}</div>
      <div style="border-top:1px solid #e2e8f0;padding-top:4px;margin-bottom:4px;">
        <div style="${SECTION_LABEL_STYLE}">${farmerNames.length > 1 ? "Farmers" : "Farmer"}</div>
        <div style="font-size:12px;font-weight:600;color:#0f172a;">
          ${
            farmerNames.length
              ? farmerNames.map(escapeHtml).join(", ")
              : '<span style="font-weight:400;color:#64748b;">Unassigned</span>'
          }
        </div>
      </div>
      <div style="border-top:1px solid #e2e8f0;padding-top:4px;margin-bottom:4px;">
        <div style="${SECTION_LABEL_STYLE}">Yielded kg · approved reports</div>
        <div style="font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(farm.yieldKg.toLocaleString())} kg</div>
      </div>
      <div style="border-top:1px solid #e2e8f0;padding-top:4px;">
        <div style="${SECTION_LABEL_STYLE}">Crops</div>
        ${crops || '<div style="font-size:12px;color:#64748b;">No crops</div>'}
        ${hidden > 0 ? `<div style="font-size:11px;color:#64748b;padding-top:2px;">+${escapeHtml(hidden)} more</div>` : ""}
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

  // Map-specific data is derived from fully approved reports on the backend.
  const { data, isError, error } = useFarmMap({
    ...(search ? { search } : {}),
    ...(cropFilter ? { crop: cropFilter } : {}),
  });

  const { data: lookups } = useLookups();
  const cropOptions = lookupOptions(lookups?.crops);

  const farms = useMemo(() => {
    return (data?.farms ?? []).map((f) => ({
      id: f._id,
      tag: f.tag,
      address: f.address,
      location:
        f.latitude != null && f.longitude != null
          ? { lat: Number(f.latitude), lng: Number(f.longitude) }
          : null,
      farmers: (f.assignedFarmers || []).map((a) =>
        typeof a.farmer === "string" ? a.farmer : a.farmer?.fullName,
      ),
      crops: f.crops ?? [],
      yieldKg: f.yieldKg ?? 0,
    }));
  }, [data]);

  const filtered = useMemo(() => {
    return farms.filter((f) => !!f.location);
  }, [farms]);

  return (
    <div>
      <PageHeader
        title="Farm Maps"
        subtitle="Farm crops and yielded kg from reports approved by both AEW and Coordinator."
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
      </div>

      <FarmsLeafletMap farms={filtered} />

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-secondary">
        <Wheat className="h-3.5 w-3.5 text-accent" />
        <span>Pins show each farm's crops with their current stage, and cumulative yielded kg from fully approved reports only.</span>
      </div>
    </div>
  );
}
