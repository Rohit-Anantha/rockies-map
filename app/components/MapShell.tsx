"use client";

import dynamic from "next/dynamic";
// Import the type from your central utils or data folder
import type { RoutePhoto } from "../utils/get-photos";

const ScrollytellingPage = dynamic(() => import("./ScrollyTellingPage"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-slate-100 animate-pulse flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest">
      Initialising Austin → Anchorage...
    </div>
  ),
});

export default function MapShell({ photos }: { photos: RoutePhoto[] }) {
  // You can now safely pass the photos from the JSON
  return <ScrollytellingPage photos={photos} />;
}
