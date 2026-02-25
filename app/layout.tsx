import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MapProvider } from "./context/MapContext";
import PersistentMap from "./context/PersistentMap";
import processedPhotos from "./data/photos.json";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Texas 4000 For Cancer",
  description: "Rohit's Journey to Alaska",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MapProvider>
          <PersistentMap photos={processedPhotos as any} />
          <main className="relative z-10 w-full h-full pointer-events-none">
            {children}
          </main>
        </MapProvider>
      </body>
    </html>
  );
}
