"use client";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import Map, {
  MapRef,
  Source,
  Layer,
  NavigationControl,
  Marker,
  Popup,
} from "react-map-gl/maplibre";
import { AnimatePresence, motion } from "framer-motion";
import "maplibre-gl/dist/maplibre-gl.css";
import rawRouteData from "../../public/t4k_route_weather.json";
import bbox from "@turf/bbox";
import { journalEntries } from "./journal";
import { Odometer } from "./Odometer";

import { Camera } from "lucide-react";
import { JournalEntry } from "./JournalDay";

export interface RoutePhoto {
  id: string;
  url: string;
  coordinates: [number, number];
  day: string;
  caption?: string;
}

interface WeatherData {
  code: number;
  max: number;
  min: number;
  precip: number;
}

interface FeatureProperties {
  day: string;
  date?: string;
  weather?: WeatherData;
  [key: string]: any;
}

interface GeoJSONFeature {
  type: "Feature";
  properties: FeatureProperties;
  geometry: any;
}

const routeData = rawRouteData as { type: string; features: GeoJSONFeature[] };

// Pre-compute lookup map for O(1) access instead of O(N) find inside render loop
const featuresByDay = routeData.features.reduce(
  (acc, feature) => {
    acc[String(feature.properties.day)] = feature;
    return acc;
  },
  {} as Record<string, GeoJSONFeature>,
);

export default function ScrollytellingPage({
  photos = [],
}: {
  photos?: RoutePhoto[];
}) {
  const mapRef = useRef<MapRef>(null);
  const [activeDay, setActiveDay] = useState("1");
  const [selectedPhoto, setSelectedPhoto] = useState<RoutePhoto | null>(null);

  // LOCK MECHANISM: Prevents map from jumping during manual scrubs
  const isManualScroll = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const updateMapAndUI = useCallback((dayId: string, duration: number) => {
    setActiveDay(dayId);
    const feature = featuresByDay[dayId];

    if (feature && mapRef.current) {
      const [minX, minY, maxX, maxY] = bbox(feature as any);
      mapRef.current.fitBounds(
        [
          [minX, minY],
          [maxX, maxY],
        ],
        {
          padding: { top: 100, bottom: 100, left: 450, right: 100 },
          duration: duration,
        },
      );
    }
  }, []);

  const onIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const dayId = entry.target.getAttribute("data-day");
          if (dayId && dayId !== activeDay && !isManualScroll.current) {
            updateMapAndUI(dayId, 2000);
          }
        }
      });
    },
    [updateMapAndUI],
  );

  const scrollToDay = useCallback(
    (day: string) => {
      isManualScroll.current = true;
      updateMapAndUI(day, 1000); // Faster map jump

      const element = document.querySelector(`[data-day="${day}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        isManualScroll.current = false;
      }, 1200);
    },
    [updateMapAndUI],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(onIntersect, { threshold: 0.6 });
    document
      .querySelectorAll(".day-section")
      .forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [onIntersect]);

  const activeDayNum = parseInt(activeDay) || 0;

  // Totals Calculation
  const totals = useMemo(() => {
    return Array.from({ length: activeDayNum }, (_, i) => String(i + 1)).reduce(
      (acc, d) => {
        const entry = journalEntries[d];
        if (entry?.metrics) {
          acc.miles += entry.metrics.miles;
          acc.elevation += entry.metrics.elevation;
        }
        return acc;
      },
      { miles: 0, elevation: 0 },
    );
  }, [activeDayNum]);

  // Get the currently visible photos (up to the active day)
  const visiblePhotos = useMemo(() => {
    return photos.filter((p) => Number(p.day) <= activeDayNum);
  }, [photos, activeDayNum]);

  const navigatePhoto = useCallback(
    (direction: "next" | "prev") => {
      // Use a functional update or ensure selectedPhoto is in the dependency array
      setSelectedPhoto((current) => {
        if (!current) return null;

        const visiblePhotos = photos.filter(
          (p) => Number(p.day) <= activeDayNum,
        );
        const currentIndex = visiblePhotos.findIndex(
          (p) => p.id === current.id,
        );

        if (currentIndex === -1) return current;

        let newIndex;
        if (direction === "next") {
          newIndex = (currentIndex + 1) % visiblePhotos.length;
        } else {
          newIndex =
            (currentIndex - 1 + visiblePhotos.length) % visiblePhotos.length;
        }

        const nextPhoto = visiblePhotos[newIndex];

        // Optional: Move the map to the new photo location
        mapRef.current?.flyTo({
          center: nextPhoto.coordinates,
          padding: { top: 50, bottom: 50, left: 450, right: 50 },
          duration: 800,
        });

        return nextPhoto;
      });
    },
    [photos, activeDayNum],
  );

  useEffect(() => {
    if (!selectedPhoto && mapRef.current) {
      const map = mapRef.current.getMap();
      // Re-enable interactions just in case they were suppressed
      map.scrollZoom.enable();
      map.dragPan.enable();
      map.doubleClickZoom.enable();
    }
  }, [selectedPhoto]);

  const closePhotoAndResetMap = useCallback(() => {
    setSelectedPhoto(null);

    // Trigger the scrollytelling zoom for the current day
    // We use the same function your scroll observer uses
    updateMapAndUI(activeDay, 1500);
  }, [activeDay, updateMapAndUI]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans selection:bg-orange-100">
      {/* LEFT SIDEBAR */}
      <div className="w-full md:w-1/3 bg-white/80 backdrop-blur-md z-10 shadow-2xl flex flex-col h-screen border-r border-slate-200">
        {/* Header Section */}
        <div className="p-8 pb-4">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black mb-1 tracking-tighter uppercase italic text-slate-900"
          >
            Texas 4000
          </motion.h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
            Austin → Anchorage
          </p>
        </div>
        {/* Floating Style Dashboard */}
        <div className="px-6 py-4 mx-4 mb-4 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Timeline
              </p>
              <p className="text-2xl font-black text-slate-900 italic">
                Day {activeDay}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase">
                {Math.round((activeDayNum / 70) * 100)}% Complete
              </span>
            </div>
          </div>

          {/* Range Slider Scrubber */}
          <div className="relative group px-1">
            <input
              type="range"
              min="1"
              max="70"
              value={activeDayNum}
              onChange={(e) => scrollToDay(e.target.value)}
              className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-orange-600 transition-all hover:h-2"
              aria-label="Timeline scrubber"
            />

            <div className="flex justify-between mt-2 px-0.5 pointer-events-none">
              {[0, 25, 50, 75, 100].map((p) => (
                <div
                  key={p}
                  className="text-[8px] font-bold text-slate-300 uppercase"
                >
                  {p}%
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Scrollable Journal */}
        <div className="overflow-y-auto grow p-8 pt-4 no-scrollbar space-y-[40vh] pb-[60vh]">
          {Array.from({ length: 70 }, (_, i) => i + 1).map((dayNum) => {
            const d = String(dayNum);
            return (
              <JournalEntry
                key={d}
                day={d}
                isActive={activeDay === d}
                geoProps={featuresByDay[d]?.properties}
                entry={journalEntries[d]}
                prevEntry={journalEntries[String(dayNum - 1)]}
                isFirstDay={dayNum === 1}
              />
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE: Map */}
      <div className="w-full md:w-2/3 h-[50vh] md:h-screen sticky top-0 bg-slate-100">
        <Map
          ref={mapRef}
          initialViewState={{ longitude: -97.74, latitude: 30.26, zoom: 5 }}
          mapStyle="https://api.maptiler.com/maps/dataviz-light/style.json?key=XCPlLU3aHjY0DmwHehir"
        >
          <Source
            id="terrain-data"
            type="raster-dem"
            url="https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=XCPlLU3aHjY0DmwHehir"
            tileSize={256}
          >
            {/* This layer creates the 'shadows' on the mountains */}
            <Layer
              id="hills"
              type="hillshade"
              paint={{
                "hillshade-shadow-color": "#222",
                "hillshade-exaggeration": 0.8, // Adjust for more/less 'bumpy' mountains
              }}
            />
          </Source>
          <Source id="route-data" type="geojson" data={routeData as any}>
            <Layer
              id="route-line-past"
              type="line"
              filter={["<", ["to-number", ["get", "day"]], activeDayNum]}
              paint={{
                "line-color": "#fdba74",
                "line-width": 3,
                "line-opacity": 0.6,
              }}
            />
            <Layer
              id="route-line-active"
              type="line"
              filter={["==", ["to-number", ["get", "day"]], activeDayNum]}
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{ "line-color": "#f97316", "line-width": 4 }}
            />
          </Source>

          {/* Photo Markers */}
          {photos
            .filter((p) => Number(p.day) <= activeDayNum)
            .map((photo) => (
              <Marker
                key={photo.id}
                longitude={photo.coordinates[0]}
                latitude={photo.coordinates[1]}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedPhoto(photo); // Open the popup directly
                  mapRef.current?.flyTo({
                    center: [photo.coordinates[0], photo.coordinates[1]],
                    offset: [0, -100], // Shift the center down so the popup (which opens 'top') stays in view
                    zoom: 12, // Optional: zoom in a bit for a closer look
                    duration: 1000,
                  });
                }}
              >
                <div className="bg-white p-1.5 rounded-full shadow-md cursor-pointer hover:scale-125 transition-transform border border-slate-200 group">
                  <Camera
                    size={16}
                    className="text-slate-600 group-hover:text-orange-600"
                  />
                </div>
              </Marker>
            ))}

          {/* Large Carousel Popup */}
          {selectedPhoto && (
            <Popup
              longitude={selectedPhoto.coordinates[0]}
              latitude={selectedPhoto.coordinates[1]}
              anchor="center"
              onClose={() => closePhotoAndResetMap()}
              closeOnClick={false}
              closeButton={false} // We'll use our own close button
              className="z-50 glass-popup"
              maxWidth="450px"
              offset={20}
            >
              <div className="group relative rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl overflow-hidden ring-1 ring-black/5 flex flex-col">
                {/* Navigation Overlay (Visible on Hover) */}
                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigatePhoto("prev");
                    }}
                    className="pointer-events-auto bg-white/80 hover:bg-white text-slate-900 p-2 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-90"
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigatePhoto("next");
                    }}
                    className="pointer-events-auto bg-white/80 hover:bg-white text-slate-900 p-2 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-90"
                  >
                    →
                  </button>
                </div>

                {/* Large Image Container */}
                <div className="relative h-[300px] w-full">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.caption}
                    className="w-full h-full object-cover"
                  />
                  {/* Close Button */}
                  <button
                    onClick={() => closePhotoAndResetMap()}
                    className="absolute top-3 right-3 bg-black/30 hover:bg-black/60 text-white rounded-full p-1.5 backdrop-blur-md transition-colors z-30"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Photo Info Footer */}
                <div className="p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black bg-orange-500 text-white px-2 py-0.5 rounded-md">
                      DAY {selectedPhoto.day}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {selectedPhoto.id}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    {selectedPhoto.caption || "Texas 4000 Moment"}
                  </p>
                </div>
              </div>
            </Popup>
          )}
          <NavigationControl position="top-right" />
        </Map>

        {/* Floating Stats HUD */}
        <motion.div
          layout
          className="absolute bottom-10 left-10 z-30 bg-white/60 backdrop-blur-md px-6 py-4 rounded-[2.5rem] border border-slate-200 shadow-xl"
        >
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-0.5">
                Cumulative Miles
              </p>
              <div className="flex items-baseline gap-1">
                <div className="text-3xl">
                  <Odometer
                    value={totals.miles.toFixed(1)}
                    colorClass="text-slate-900"
                  />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase">
                  mi
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-300/50" />

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-0.5">
                Total Elevation
              </p>
              <div className="flex items-baseline gap-1">
                <div className="text-3xl">
                  <Odometer
                    value={Math.floor(totals.elevation)}
                    colorClass="text-orange-600"
                  />
                </div>
                <span className="text-xs font-bold text-orange-400 uppercase">
                  ft
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
