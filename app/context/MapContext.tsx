"use client";
import React, { createContext, useContext, useState } from "react";
import { RoutePhoto } from "../components/ScrollyTellingPage";

interface MapContextType {
  activeDay: string;
  setActiveDay: (day: string) => void;
  selectedPhoto: RoutePhoto | null;
  setSelectedPhoto: React.Dispatch<React.SetStateAction<RoutePhoto | null>>;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [activeDay, setActiveDay] = useState("1");
  const [selectedPhoto, setSelectedPhoto] = useState<RoutePhoto | null>(null);

  return (
    <MapContext.Provider
      value={{ activeDay, setActiveDay, selectedPhoto, setSelectedPhoto }}
    >
      {children}
    </MapContext.Provider>
  );
}

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context)
    throw new Error("useMapContext must be used within MapProvider");
  return context;
};
