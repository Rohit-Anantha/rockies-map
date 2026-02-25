import { motion } from "framer-motion";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
} from "lucide-react";
import { memo } from "react";
import Link from "next/link";

const getWeatherIcon = (code: number) => {
  // Clear & Mostly Clear (0-2)
  if (code === 0) return <Sun className="text-orange-500" size={18} />;
  if (code === 1 || code === 2)
    return <CloudSun className="text-amber-500" size={18} />;

  // Overcast (3)
  if (code === 3) return <Cloud className="text-slate-400" size={18} />;

  // Drizzle (51, 53, 55) -> Use a lighter rain icon
  if (code >= 51 && code <= 55)
    return <CloudDrizzle className="text-blue-300" size={18} />;

  // Rain (61, 63, 65) -> Use a heavy rain icon
  if (code >= 61 && code <= 67)
    return <CloudRain className="text-blue-500" size={18} />;

  // Storms (95+)
  if (code >= 95)
    return <CloudLightning className="text-purple-500" size={18} />;

  return <Cloud className="text-slate-400" size={18} />;
};

const getWeatherDescription = (code: number) => {
  const mapping: Record<number, string> = {
    0: "Clear Skies",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    95: "Thunderstorms",
  };
  return mapping[code] || "Variable Conditions";
};

export const JournalEntry = memo(
  ({ day, isActive, geoProps, entry, prevEntry, isFirstDay }: any) => {
    // Logic moved inside the component to keep the main loop clean
    const origin = isFirstDay
      ? "Austin, TX"
      : prevEntry?.title || "Previous Stop";
    const destination = entry?.title || "On the Road";

    const formattedDate = geoProps?.date
      ? new Date(geoProps.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "long",
          day: "numeric",
        })
      : entry?.date;

    return (
      <motion.section
        data-day={day}
        animate={{
          opacity: isActive ? 1 : 0.1,
          x: isActive ? 0 : -20,
        }}
        transition={{ duration: 0.5 }}
      >
        {/* Date & Day Label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-orange-500">
            Day {day} • {formattedDate}
          </span>
          {entry?.isRestDay && (
            <span className="bg-slate-100 text-slate-500 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
              Rest Day
            </span>
          )}
        </div>

        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-6">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 italic">
            {origin} —
          </span>
          {destination}
        </h2>

        {/* Featured Image */}
        {entry?.featuredImage && (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-sm border border-slate-100 group">
            <img
              src={entry.featuredImage}
              alt={entry?.title || "Day photo"}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {entry?.imageCaption && (
              <p className="text-[10px] text-slate-400 p-2 bg-white italic">
                {entry.imageCaption}
              </p>
            )}
          </div>
        )}

        {geoProps?.weather && (
          <div className="flex items-center gap-3 md:gap-5 mb-6 p-2.5 md:p-3 rounded-xl bg-slate-50/50 border border-slate-100 w-fit">
            {/* 1. Condition & Icon */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white rounded-md shadow-sm shrink-0">
                {/* Pass a smaller size to your icon function if possible, e.g., size={14} */}
                {getWeatherIcon(geoProps.weather.code)}
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-0.5">
                  Cond
                </span>
                <span className="text-[11px] md:text-xs font-black text-slate-700 whitespace-nowrap leading-none">
                  {getWeatherDescription(geoProps.weather.code)}
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-200" />

            {/* 2. Temperatures */}
            <div className="flex flex-col justify-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-0.5">
                Temp
              </span>
              <span className="text-[11px] md:text-xs font-black text-slate-700 leading-none">
                {Math.round(geoProps.weather.max)}°
                <span className="text-slate-300 font-medium mx-0.5">/</span>
                {Math.round(geoProps.weather.min)}°
              </span>
            </div>

            {/* 3. Precipitation */}
            {geoProps.weather.precip > 0 && (
              <>
                <div className="h-5 w-px bg-slate-200" />
                <div className="flex flex-col justify-center">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-0.5">
                    Rain
                  </span>
                  <span className="text-[11px] md:text-xs font-black text-blue-600 leading-none">
                    {geoProps.weather.precip.toFixed(2)}
                    <span className="text-[9px] ml-0.5 font-bold uppercase">
                      in
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Metrics */}
        {!entry?.isRestDay && entry?.metrics && (
          <div className="flex gap-8 mb-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Distance
              </p>
              <p className="text-xl font-black text-slate-800">
                {entry.metrics.miles}{" "}
                <span className="text-xs font-normal text-slate-400">mi</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Climb
              </p>
              <p className="text-xl font-black text-slate-800">
                {entry.metrics.elevation.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-400">ft</span>
              </p>
            </div>
          </div>
        )}

        <div className="text-slate-500 text-lg leading-relaxed font-light italic border-l-4 border-slate-100 pl-6">
          {entry?.content || "No journal entry for this day yet."}
        </div>
        <Link
          href={`/day/${day}`}
          className="ml-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors"
        >
          Read full story
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      </motion.section>
    );
  },
);

JournalEntry.displayName = "JournalEntry";
