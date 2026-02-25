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
    className="absolute z-30 inset-x-0 mx-auto w-fit 
           top-6 md:top-auto md:bottom-10
           bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl rounded-[2.5rem]
           px-5 py-3 md:px-8 md:py-4 
           scale-90 md:scale-100 origin-top md:origin-bottom"
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
