export const SidebarHeader = ({
  activeDay,
  activeDayNum,
  onScrollToDay,
}: {
  activeDay: string;
  activeDayNum: number;
  onScrollToDay: (day: string) => void;
}) => (
  <div className="flex-none p-4 md:p-8 pb-2">
    {/* Title Row */}
    <div className="flex items-center justify-between md:mb-2">
      <h1 className="text-xl md:text-4xl font-black tracking-tighter italic text-slate-900 uppercase">
        Texas 4000
      </h1>
      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase">
        {Math.round((activeDayNum / 70) * 100)}%
      </span>
    </div>

    {/* Slider Dashboard */}
    <div className="mt-2 md:mt-4 px-3 py-3 md:px-5 rounded-2xl md:rounded-3xl bg-white border border-slate-100 shadow-sm relative z-30">
      <div className="flex items-center gap-4">
        {/* Day Counter - Fixed width keeps the slider from jumping as numbers change */}
        <div className="flex-none min-w-18">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
            Timeline
          </p>
          <p className="text-xl md:text-2xl font-black italic text-slate-900 leading-none">
            Day {activeDay}
          </p>
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-8 bg-slate-100" />

        {/* Range Slider - flex-1 makes it take up the rest of the row */}
        <div className="flex-1 pt-1">
          <input
            type="range"
            min="1"
            max="70"
            value={activeDayNum}
            onChange={(e) => onScrollToDay(e.target.value)}
            className="w-full h-1.5 md:h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-orange-600"
          />
        </div>
      </div>
    </div>
  </div>
);
