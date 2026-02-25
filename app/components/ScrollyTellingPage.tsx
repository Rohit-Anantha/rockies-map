"use client";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import rawRouteData from "../../public/t4k_route_weather.json";
import { journalEntries } from "./journal";

import { useMapContext } from "../context/MapContext";
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
  const { activeDay, setActiveDay, selectedPhoto, setSelectedPhoto } =
    useMapContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeDayRef = useRef(activeDay);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const selectedPhotoRef = useRef<RoutePhoto | null>(null);
  const isManualScrolling = useRef(false);

  useEffect(() => {
    const expiry = localStorage.getItem("journey_auth_expiry");
    if (expiry && new Date().getTime() < parseInt(expiry)) {
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("journey_auth_expiry");
    }
  }, []);

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
      if (selectedPhotoRef.current || isManualScrolling.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const dayId = entry.target.getAttribute("data-day");
          if (dayId && dayId !== activeDayRef.current) {
            setActiveDay(dayId);
          }
        }
      });
    },
    [setActiveDay],
  );

  const scrollToDay = useCallback(
    (day: string) => {
      isManualScrolling.current = true;
      setActiveDay(day);

      const element = document.querySelector(`[data-day="${day}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        isManualScrolling.current = false;
      }, 1200);
    },
    [setActiveDay],
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

        return filtered[newIndex];
      });
    },
    [photos],
  );

  const closePhotoAndResetMap = useCallback(() => {
    setSelectedPhoto(null);
    selectedPhotoRef.current = null;
    isManualScrolling.current = false;
  }, [setSelectedPhoto]);

  useEffect(() => {
    if (isAuthenticated) {
      // 1. Reset the scroll position to the very top
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      setActiveDay("1");
    }
  }, [isAuthenticated, setActiveDay]);
  return (
    <div className="relative w-full h-screen overflow-hidden font-sans selection:bg-orange-100 bg-transparent">
      <AuthOverlay
        isAuthenticated={isAuthenticated}
        onAuth={(val) => {
          if (val.trim().toLowerCase() === "whatever the weather") {
            setIsAuthenticated(true);
            const expiry = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours from now
            localStorage.setItem("journey_auth_expiry", expiry.toString());
          }
        }}
      />
      {/* SIDEBAR CONTAINER */}
      <div className="absolute bottom-0 left-0 w-full h-[60vh] md:top-0 md:h-full md:w-1/3 z-20 flex flex-col bg-white/95 backdrop-blur-md md:border-r border-slate-200 rounded-t-3xl md:rounded-none shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-2xl pointer-events-auto">
        {/* Fixed Header & Slider Section */}
        <SidebarHeader
          activeDay={activeDay}
          activeDayNum={activeDayNum}
          onScrollToDay={scrollToDay}
        />
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
      <StatsHUD miles={totals.miles} elevation={totals.elevation} />
      {selectedPhoto && (
        <div className="pointer-events-auto">
          <PhotoPopup
            selectedPhoto={selectedPhoto} // TS now knows this is a RoutePhoto
            onClose={closePhotoAndResetMap}
            onNavigate={navigatePhoto}
          />
        </div>
      )}
    </div>
  );
}
