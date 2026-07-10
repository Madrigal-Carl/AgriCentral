import { useEffect, useRef, useState } from "react";
import { BOAC_CENTER } from "@/constants/data";

const MARKER_ICON_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const MARKER_ICON_2X_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const MARKER_SHADOW_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

export function LeafletMap({
  location,
  onPick,
  height = "h-56",
  interactive = true,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onPickRef = useRef(onPick);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // Mount Leaflet once on the client.
  useEffect(() => {
    let cancelled = false;
    let cleanupFns = [];

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const icon = L.icon({
        iconUrl: MARKER_ICON_URL,
        iconRetinaUrl: MARKER_ICON_2X_URL,
        shadowUrl: MARKER_SHADOW_URL,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const start = location || BOAC_CENTER;
      const zoom = location ? 15 : 13;

      const map = L.map(containerRef.current, {
        center: [start.lat, start.lng],
        zoom,
        scrollWheelZoom: interactive,
        dragging: interactive,
        doubleClickZoom: interactive,
        zoomControl: interactive,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      if (location) {
        markerRef.current = L.marker([location.lat, location.lng], {
          icon,
          draggable: interactive,
        }).addTo(map);
        if (interactive) {
          markerRef.current.on("dragend", (e) => {
            const { lat, lng } = e.target.getLatLng();
            onPickRef.current?.({
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
            });
          });
        }
      }

      if (interactive) {
        map.on("click", (e) => {
          const lat = Number(e.latlng.lat.toFixed(6));
          const lng = Number(e.latlng.lng.toFixed(6));
          if (!markerRef.current) {
            markerRef.current = L.marker([lat, lng], {
              icon,
              draggable: true,
            }).addTo(map);
            markerRef.current.on("dragend", (ev) => {
              const ll = ev.target.getLatLng();
              onPickRef.current?.({
                lat: Number(ll.lat.toFixed(6)),
                lng: Number(ll.lng.toFixed(6)),
              });
            });
          } else {
            markerRef.current.setLatLng([lat, lng]);
          }
          onPickRef.current?.({ lat, lng });
        });
      }

      // Leaflet needs a size recalc when mounted in modals/drawers.
      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(containerRef.current);
      cleanupFns.push(() => ro.disconnect());

      // Initial paint fix.
      setTimeout(() => map.invalidateSize(), 50);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => fn());
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
    // Mount once per instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external location changes (e.g. "Use my location", "Clear").
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!location) {
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
        return;
      }
      const latlng = [location.lat, location.lng];
      if (markerRef.current) {
        markerRef.current.setLatLng(latlng);
      } else {
        const icon = L.icon({
          iconUrl: MARKER_ICON_URL,
          iconRetinaUrl: MARKER_ICON_2X_URL,
          shadowUrl: MARKER_SHADOW_URL,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });
        markerRef.current = L.marker(latlng, {
          icon,
          draggable: interactive,
        }).addTo(map);
        if (interactive) {
          markerRef.current.on("dragend", (e) => {
            const ll = e.target.getLatLng();
            onPickRef.current?.({
              lat: Number(ll.lat.toFixed(6)),
              lng: Number(ll.lng.toFixed(6)),
            });
          });
        }
      }
      map.setView(latlng, Math.max(map.getZoom(), 13));
    })();
  }, [location?.lat, location?.lng, ready, interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative z-0 w-full ${height} border border-border bg-muted`}
    />
  );
}
