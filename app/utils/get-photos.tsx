import processedPhotos from "../data/photos.json";

export interface RoutePhoto {
  id: string;
  day: string;
  coordinates: [number, number];
  url: string;
  caption?: string;
}

export function getRoutePhotos(): RoutePhoto[] {
  // Since the script already sorted them and calculated the days,
  // we can just return the imported JSON.
  return processedPhotos as RoutePhoto[];
}
