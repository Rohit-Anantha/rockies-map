import { motion } from "framer-motion";
import { Odometer } from "./Odometer";

export const StatsHUD = ({
  miles,
  elevation,
}: {
  miles: number;
  elevation: number;
}) => (
  <motion.div
    layout
    className="absolute top-4 left-4 md:bottom-10 md:left-10 md:top-auto md:right-auto z-30 bg-white/60 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 rounded-[2.5rem] border border-slate-200 shadow-xl scale-90 md:scale-100 origin-top-left md:origin-bottom-left"
  >
    <div className="flex items-center gap-4 md:gap-8">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
          Miles
        </p>
        <div className="flex items-baseline gap-1">
          <Odometer value={miles.toFixed(1)} colorClass="text-slate-900" />
          <span className="text-xs font-bold text-slate-400">mi</span>
        </div>
      </div>
      <div className="w-px h-8 bg-slate-300/50" />
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
          Elevation
        </p>
        <div className="flex items-baseline gap-1">
          <Odometer
            value={Math.floor(elevation)}
            colorClass="text-orange-600"
          />
          <span className="text-xs font-bold text-orange-400">ft</span>
        </div>
      </div>
    </div>
  </motion.div>
);
