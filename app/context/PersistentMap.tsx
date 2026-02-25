"use client";
import { useRef, useEffect, useCallback, useState } from "react";
import Map, {
  MapRef,
  Source,
  Layer,
  NavigationControl,
  Marker,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import rawRouteData from "../../public/t4k_route_weather.json";
import bbox from "@turf/bbox";
import { useMapContext } from "../context/MapContext";
import { usePathname } from "next/navigation";
import { Camera } from "lucide-react";
import { RoutePhoto } from "../components/ScrollyTellingPage";

interface FeatureProperties {
  day: string;
  date?: string;
  [key: string]: any;
}

interface GeoJSONFeature {
  type: "Feature";
  properties: FeatureProperties;
  geometry: any;
}

const routeData = rawRouteData as { type: string; features: GeoJSONFeature[] };

const featuresByDay = routeData.features.reduce(
  (acc, feature) => {
    acc[String(feature.properties.day)] = feature;
    return acc;
  },
  {} as Record<string, GeoJSONFeature>,
);

const DESKTOP_PADDING = { left: 450, right: 50, top: 50, bottom: 50 };
const MOBILE_PADDING = { top: 50, bottom: 250, left: 20, right: 20 };

export default function PersistentMap({
  photos = [],
}: {
  photos?: RoutePhoto[];
}) {
  const mapRef = useRef<MapRef>(null);
  const { activeDay, setActiveDay, selectedPhoto, setSelectedPhoto } =
    useMapContext();
  const pathname = usePathname();
  const [isMapReady, setIsMapReady] = useState(false);

  const getPadding = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    return isMobile ? MOBILE_PADDING : DESKTOP_PADDING;
  }, []);

  const updateMapPosition = useCallback(
    (dayId: string, duration: number) => {
      if (!dayId || !mapRef.current) return;

      const feature = featuresByDay[dayId];
      if (!feature) return;

      const map = mapRef.current.getMap();

      const [minX, minY, maxX, maxY] = bbox(feature as any);

      try {
        map.fitBounds(
          [
            [minX, minY],
            [maxX, maxY],
          ],
          {
            padding: getPadding(),
            duration: duration,
            essential: true,
          },
        );
      } catch (e) {
        console.error("Error updating map position:", e);
      }
    },
    [getPadding],
  );

  useEffect(() => {
    const handleResize = () => {
      if (activeDay && !selectedPhoto && isMapReady) {
        updateMapPosition(activeDay, 0);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeDay, selectedPhoto, isMapReady, updateMapPosition]);

  useEffect(() => {
    const dayMatch = pathname.match(/\/day\/(\d+)/);
    if (dayMatch) {
      const day = dayMatch[1];
      if (day !== activeDay) {
        setActiveDay(day);
      }
    }
  }, [pathname, activeDay, setActiveDay]);

  useEffect(() => {
    if (!isMapReady) return;

    if (selectedPhoto) {
      mapRef.current?.flyTo({
        center: selectedPhoto.coordinates,
        zoom: 12,
        padding: getPadding(),
        duration: 800,
      });
    } else {
      const duration = activeDay === "1" ? 4000 : 1200;
      updateMapPosition(activeDay, duration);
    }
  }, [selectedPhoto, activeDay, updateMapPosition, isMapReady, getPadding]);

  const activeDayNum = parseInt(activeDay) || 0;

  const isDetailPage = pathname.includes("/day/");

  useEffect(() => {
    if (isDetailPage && isMapReady) {
      // When reading the full story, zoom out slightly and
      // shift the map so the route isn't hidden behind the article card
      mapRef.current?.flyTo({
        padding: { left: 0, right: 0, top: 0, bottom: 0 },
        zoom: 10,
        pitch: 65, // Add some perspective for the "hero" look
        duration: 2000,
      });
    } else {
      mapRef.current?.flyTo({
        pitch: 0, // Flattens the map
        bearing: 0, // Resets rotation to North
        duration: 1500,
        padding: getPadding(), // Re-apply sidebar offsets
      });
    }
  }, [isDetailPage]);

  return (
    <div className="fixed inset-0 z-0 bg-slate-100">
      <Map
        ref={mapRef}
        cooperativeGestures={true}
        initialViewState={{ longitude: -97.74, latitude: 30.26, zoom: 5 }}
        mapStyle="https://api.maptiler.com/maps/dataviz-light/style.json?key=XCPlLU3aHjY0DmwHehir"
        onLoad={() => setIsMapReady(true)}
        // terrain={{ source: "terrain-data", exaggeration: 1.5 }}
      >
        <Source
          id="terrain-data"
          type="raster-dem"
          url="https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=XCPlLU3aHjY0DmwHehir"
          tileSize={256}
        >
          <Layer
            id="hills"
            type="hillshade"
            paint={{
              "hillshade-shadow-color": "#222",
              "hillshade-exaggeration": 0.8,
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
        {photos.map((photo) => (
          <Marker
            key={photo.id}
            longitude={photo.coordinates[0]}
            latitude={photo.coordinates[1]}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedPhoto(photo);
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
      {pathname.includes("/day/") && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] pointer-events-none transition-opacity duration-1000" />
      )}
    </div>
  );
}
