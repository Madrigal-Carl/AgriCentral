import "leaflet/dist/leaflet.css";
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
  const genRef = useRef(0); // bumped every mount; stale async work checks against this
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // A marker is only safe to mutate if it still belongs to a live map.
  // After map.remove() (or React StrictMode's double-invoke teardown),
  // a lingering reference's `_icon`/`_map` is nulled out by Leaflet —
  // calling setLatLng/update on it is what throws "_leaflet_pos" errors.
  const isMarkerLive = (marker) => !!marker && !!marker._map && !!marker._icon;

  // Mount Leaflet once per instance.
  useEffect(() => {
    let cancelled = false;
    let cleanupFns = [];
    const myGen = ++genRef.current;

    (async () => {
      const L = (await import("leaflet")).default;
      // Bail if this effect run has since been superseded (StrictMode
      // double-invoke, fast unmount, or the container is gone).
      if (cancelled || myGen !== genRef.current || !containerRef.current)
        return;

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

      const attachDragEnd = (marker) => {
        marker.on("dragend", (e) => {
          // Guard: only act if this marker/map are still the live ones —
          // a dragend firing after teardown would otherwise touch a
          // removed marker.
          if (mapRef.current !== map || !isMarkerLive(marker)) return;
          const { lat, lng } = e.target.getLatLng();
          onPickRef.current?.({
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
          });
        });
      };

      if (location) {
        markerRef.current = L.marker([location.lat, location.lng], {
          icon,
          draggable: interactive,
        }).addTo(map);
        if (interactive) attachDragEnd(markerRef.current);
      }

      if (interactive) {
        map.on("click", (e) => {
          // Ignore clicks delivered to a map instance that's no longer
          // the current one (can happen with a queued event during
          // fast StrictMode remount/unmount cycles).
          if (mapRef.current !== map) return;

          const lat = Number(e.latlng.lat.toFixed(6));
          const lng = Number(e.latlng.lng.toFixed(6));

          if (!isMarkerLive(markerRef.current)) {
            markerRef.current = L.marker([lat, lng], {
              icon,
              draggable: true,
            }).addTo(map);
            attachDragEnd(markerRef.current);
          } else {
            markerRef.current.setLatLng([lat, lng]);
          }
          onPickRef.current?.({ lat, lng });
        });
      }

      // Leaflet needs a size recalc when mounted in modals/drawers.
      const ro = new ResizeObserver(() => {
        // A callback can still be queued in the microtask/task queue at
        // the moment ro.disconnect() runs during cleanup — this guard
        // makes that a no-op instead of calling invalidateSize on (or
        // repositioning markers of) an already-removed map.
        if (mapRef.current !== map) return;
        map.invalidateSize();
      });
      ro.observe(containerRef.current);
      cleanupFns.push(() => ro.disconnect());

      // Initial paint fix — same staleness guard as above.
      setTimeout(() => {
        if (mapRef.current === map) map.invalidateSize();
      }, 50);

      if (myGen === genRef.current) setReady(true);
    })();

    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => fn());
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
      setReady(false);
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
      // The map this run was scoped to may have been torn down while
      // we were awaiting the dynamic import.
      if (mapRef.current !== map) return;

      if (!location) {
        if (markerRef.current) {
          if (isMarkerLive(markerRef.current)) markerRef.current.remove();
          markerRef.current = null;
        }
        return;
      }

      const latlng = [location.lat, location.lng];

      if (isMarkerLive(markerRef.current)) {
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
            if (mapRef.current !== map || !isMarkerLive(markerRef.current))
              return;
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
