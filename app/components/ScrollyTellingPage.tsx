"use client";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import Map, {
  MapRef,
  Source,
  Layer,
  NavigationControl,
  Marker,
} from "react-map-gl/maplibre";
import { AnimatePresence, motion } from "framer-motion";
import "maplibre-gl/dist/maplibre-gl.css";
import rawRouteData from "../../public/t4k_route_weather.json";
import bbox from "@turf/bbox";
import { journalEntries } from "./journal";

import { Camera } from "lucide-react";
import { JournalEntry } from "./JournalDay";
import { PhotoPopup } from "./PhotoPopup";
import { StatsHUD } from "./StatsHUD";
import { SidebarHeader } from "./SidebarHeader";
import { AuthOverlay } from "./AuthOverlay";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const mapRef = useRef<MapRef>(null);
  const [activeDay, setActiveDay] = useState("1");
  const [selectedPhoto, setSelectedPhoto] = useState<RoutePhoto | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeDayRef = useRef(activeDay);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const selectedPhotoRef = useRef<RoutePhoto | null>(null);
  const isManualScrolling = useRef(false);

  const updateMapAndUI = useCallback(
    (dayId: string, duration: number) => {
      if (!dayId || !mapRef.current) return;

      const feature = featuresByDay[dayId];
      if (!feature) return;

      const map = mapRef.current.getMap();
      const canvas = map.getCanvas();
      const isMobile = window.innerWidth < 768;

      // 1. Get the Bounding Box
      const [minX, minY, maxX, maxY] = bbox(feature as any);
      const center: [number, number] = [(minX + maxX) / 2, (minY + maxY) / 2];

      // 2. Calculate the required Zoom level for the bounding box
      // This helper replaces the glitchy fitBounds behavior
      const getBoundsZoom = (
        west: number,
        south: number,
        east: number,
        north: number,
      ) => {
        const WORLD_DIM = { height: 256, width: 256 };
        const ZOOM_MAX = 21;

        function latRad(lat: number) {
          const sin = Math.sin((lat * Math.PI) / 180);
          const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
          return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
        }

        function zoom(mapPx: number, worldPx: number, fraction: number) {
          return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
        }

        const latFraction = (latRad(north) - latRad(south)) / Math.PI;
        const lngDiff = east - west;
        const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;

        const latZoom = zoom(
          canvas.clientHeight,
          WORLD_DIM.height,
          latFraction,
        );
        const lngZoom = zoom(canvas.clientWidth, WORLD_DIM.width, lngFraction);
        const paddingFactor = isMobile ? 0.25 : 0.25;

        return Math.min(latZoom, lngZoom, ZOOM_MAX) - paddingFactor;
      };

      // Subtract 1 or 2 from the calculated zoom for "padding"
      const calculatedZoom = Math.max(
        0,
        getBoundsZoom(minX, minY, maxX, maxY) - 1,
      );

      // 3. Offset Logic (Your existing code)
      let offset: [number, number] = [0, 0];
      if (isMobile) {
        const visibleHeight = canvas.clientHeight * 0.45;
        offset = [0, -(canvas.clientHeight / 2 - visibleHeight / 2)];
      } else {
        const sidebarWidth = canvas.clientWidth / 3;
        offset = [sidebarWidth / 2, 0];
      }

      // Update state ONLY if it's different to prevent loops
      setActiveDay((prev) => (prev !== dayId ? dayId : prev));

      map.easeTo({
        center: center,
        zoom: Math.min(calculatedZoom, 15), // Cap zoom so it doesn't dive into the ground
        offset: offset,
        duration: duration,
        essential: true,
      });
    },
    [featuresByDay],
  ); // Ensure dependencies are correct

  useEffect(() => {
    selectedPhotoRef.current = selectedPhoto;
  }, [selectedPhoto]);

  useEffect(() => {
    activeDayRef.current = activeDay;
  }, [activeDay]);

  // Update your onIntersect logic
  const onIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      // Check the REF, not the state
      if (selectedPhotoRef.current || isManualScrolling.current) {
        console.log("Observer Blocked:", {
          photoOpen: !!selectedPhotoRef.current,
          manualScroll: isManualScrolling.current,
        });
        return;
      }

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const dayId = entry.target.getAttribute("data-day");
          console.log("Intersection Detected:", dayId);
          if (dayId && dayId !== activeDayRef.current) {
            setActiveDay(dayId);
            updateMapAndUI(dayId, 2000);
          }
        }
      });
    },
    [updateMapAndUI], // selectedPhoto is no longer a dependency, preventing re-binds
  );

  const scrollToDay = useCallback(
    (day: string) => {
      isManualScrolling.current = true;
      updateMapAndUI(day, 1000); // Faster map jump

      const element = document.querySelector(`[data-day="${day}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        isManualScrolling.current = false;
      }, 1200);
    },
    [updateMapAndUI],
  );

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const isMobile = window.innerWidth < 768;

    const observer = new IntersectionObserver(onIntersect, {
      root: scrollContainerRef.current,
      /* MOBILE: Trigger when the day is anywhere in the top 40% of the bar.
       DESKTOP: Trigger when the day is in the middle 30% of the sidebar.
    */
      rootMargin: isMobile ? "-5% 0px -60% 0px" : "-25% 0px -45% 0px",
      threshold: [0, 0.1, 0.2], // Multiple thresholds make it more responsive to fast scrolls
    });

    // Re-observe whenever the component re-renders or auth changes
    const elements = document.querySelectorAll(".day-section");
    elements.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, [onIntersect, isAuthenticated]); // Added isAuthenticated to ensure it runs after login

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

  // Photo Navigation
  const navigatePhoto = useCallback(
    (direction: "next" | "prev") => {
      setSelectedPhoto((current) => {
        if (!current) return null;

        const currentDay = parseInt(activeDayRef.current) || 0;
        const filtered = photos.filter((p) => Number(p.day) <= currentDay);
        const currentIndex = filtered.findIndex((p) => p.id === current.id);

        if (currentIndex === -1) return current;

        let newIndex =
          direction === "next"
            ? (currentIndex + 1) % filtered.length
            : (currentIndex - 1 + filtered.length) % filtered.length;

        const nextPhoto = filtered[newIndex];
        const isMobile = window.innerWidth < 768;

        // Apply padding so the marker is centered in the VISIBLE area
        mapRef.current?.flyTo({
          center: nextPhoto.coordinates,
          zoom: 12,
          padding: isMobile
            ? { top: 50, bottom: 100, left: 20, right: 20 } // Changed from 0.6 height
            : { top: 50, bottom: 50, left: 480, right: 50 },
          duration: 800,
        });

        return nextPhoto;
      });
    },
    [photos],
  );

  const closePhotoAndResetMap = useCallback(() => {
    if (!selectedPhotoRef.current) return;

    setSelectedPhoto(null);
    selectedPhotoRef.current = null;
    isManualScrolling.current = false;

    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.stop(); // Kill the high-zoom photo flyTo

      requestAnimationFrame(() => {
        // Transition from Zoom 12 (Photo) back to Zoom 10 (Route)
        updateMapAndUI(activeDayRef.current, 1200);
      });
    }
  }, [updateMapAndUI]);

  useEffect(() => {
    if (!selectedPhoto && mapRef.current) {
      const map = mapRef.current.getMap();
      // Re-enable interactions just in case they were suppressed
      map.scrollZoom.enable();
      map.dragPan.enable();
      map.doubleClickZoom.enable();
    }
  }, [selectedPhoto]);

  useEffect(() => {
    if (isAuthenticated) {
      // 1. Reset the scroll position to the very top
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }

      // 2. Fly the map to Day 1 coordinates
      // We use a slight delay to ensure the map container has finished
      // its entry transition/blur exit.
      const timer = setTimeout(() => {
        updateMapAndUI("1", 2000);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, updateMapAndUI]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-50 font-sans selection:bg-orange-100">
      <AuthOverlay
        isAuthenticated={isAuthenticated}
        onAuth={(val) => {
          setPasswordInput(val);
          if (val.trim().toLowerCase() === "whatever the weather")
            setIsAuthenticated(true);
        }}
      />
      {/* MAP CONTAINER */}
      <div className="absolute top-0 left-0 w-full h-[45vh] md:left-auto md:right-0 md:w-2/3 md:h-full z-0 bg-slate-100">
        <Map
          ref={mapRef}
          cooperativeGestures={true}
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
          <NavigationControl position="top-right" />
        </Map>
        <StatsHUD miles={totals.miles} elevation={totals.elevation} />
      </div>

      {/* SIDEBAR CONTAINER */}
      <div className="absolute bottom-0 left-0 w-full h-[60vh] md:top-0 md:h-full md:w-1/3 z-20 flex flex-col bg-white/80 backdrop-blur-md md:border-r border-slate-200 rounded-t-3xl md:rounded-none shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-2xl">
        {/* Fixed Header & Slider Section */}
        <SidebarHeader
          activeDay={activeDay}
          activeDayNum={activeDayNum}
          onScrollToDay={scrollToDay}
        />
        {/* Scrollable Journal */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 md:p-8 pt-2 md:pt-4 no-scrollbar space-y-[30vh] md:space-y-[40vh] pb-[40vh] md:pb-[60vh] overscroll-contain overflow-x-hidden"
        >
          {Array.from({ length: 70 }, (_, i) => i + 1).map((dayNum) => {
            const d = String(dayNum);
            return (
              <div key={d} data-day={d} className="day-section">
                <JournalEntry
                  day={d}
                  isActive={activeDay === d}
                  geoProps={featuresByDay[d]?.properties}
                  entry={journalEntries[d]}
                  prevEntry={journalEntries[String(dayNum - 1)]}
                  isFirstDay={dayNum === 1}
                />
              </div>
            );
          })}
        </div>
      </div>
      {selectedPhoto && (
        <PhotoPopup
          selectedPhoto={selectedPhoto} // TS now knows this is a RoutePhoto
          onClose={closePhotoAndResetMap}
          onNavigate={navigatePhoto}
        />
      )}
    </div>
  );
}
