// shortcut: free OSM Nominatim (~1 req/s, no SLA); switch to a keyed geocoder if traffic grows.
const NOMINATIM = "https://nominatim.openstreetmap.org";

// Town centers of Marinduque's six municipalities (from OSM), keyed by lookup name.
export const MUNICIPALITY_CENTERS = {
  Boac: { lat: 13.4479, lng: 121.84 },
  Buenavista: { lat: 13.2542, lng: 121.9426 },
  Gasan: { lat: 13.3242, lng: 121.8467 },
  Mogpog: { lat: 13.4736, lng: 121.8608 },
  "Santa Cruz": { lat: 13.4764, lng: 122.0279 },
  Torrijos: { lat: 13.3204, lng: 122.086 },
};

const norm =(s = "") => s.toLowerCase().replace(/^(barangay|brgy\.?)\s+/, "").replace(/[^a-z0-9ñ]/g, "");

export async function geocodeAddress(query) {
  const res = await fetch(`${NOMINATIM}/search?format=json&limit=1&countrycodes=ph&q=${encodeURIComponent(query)}`);
  const [hit] = res.ok ? await res.json() : [];
  return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
}

export async function reverseGeocode({ lat, lng }) {
  const res = await fetch(`${NOMINATIM}/reverse?format=json&zoom=18&addressdetails=1&lat=${lat}&lon=${lng}`);
  return res.ok ? ((await res.json()).address ?? null) : null;
}

// Match a lookup item (municipality/barangay) against any of OSM's candidate address names.
export const findByName = (items = [], ...names) =>
  items.find((item) => names.some((name) => name && norm(name) === norm(item.name)));
