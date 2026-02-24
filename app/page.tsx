import MapShell from "./components/MapShell";
import processedPhotos from "./data/photos.json"; // Direct import
import { RoutePhoto } from "./utils/get-photos";

export default function Page() {
  // No more 'await getRoutePhotos()' needed!
  return <MapShell photos={processedPhotos as RoutePhoto[]} />;
}
