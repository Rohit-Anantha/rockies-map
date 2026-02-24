import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { RoutePhoto } from "./ScrollyTellingPage";

interface PhotoPopupProps {
  selectedPhoto: RoutePhoto;
  onClose: () => void;
  onNavigate: (direction: "next" | "prev") => void;
}

export const PhotoPopup = ({
  selectedPhoto,
  onClose,
  onNavigate,
}: PhotoPopupProps) => {
  return (
    <AnimatePresence mode="wait">
      {/* CONTAINER: Use padding to define the "Safe Area" 
         md:pl-[35vw] ensures it never overlaps the sidebar 
      */}
      <div className="fixed inset-0 z-100 flex items-center justify-center md:justify-start p-4 md:pl-[38vw] md:pr-[5vw]">
        {/* Backdrop - Darker for better focus on content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        />

        {/* The Card: Changed w-full to w-auto to let it shrink for vertical photos */}
        <motion.div
          key={selectedPhoto.id}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 flex flex-col overflow-hidden border border-white/20 shadow-2xl rounded-3xl w-auto max-w-full max-h-[90vh]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-40 rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-all hover:bg-black/60"
          >
            <X size={20} />
          </button>

          {/* IMAGE CONTAINER: 
              Removed 'aspect-video'. 
              Used flex-1 and min-h-0 to make it scroll-safe. 
          */}
          <div className="relative flex-1 min-h-0 bg-slate-100 flex items-center justify-center">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption}
              /* object-contain: No cropping! 
                 max-h: Ensure we leave room for the footer 
              */
              className="w-auto h-auto max-w-full max-h-[60vh] md:max-h-[70vh] object-contain"
            />

            {/* Navigation Arrows */}
            <div className="absolute inset-y-0 -left-3 -right-3 flex items-center justify-between px-2 md:px-6 pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate("prev");
                }}
                className="pointer-events-auto flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform hover:scale-110 active:scale-90"
              >
                <ChevronLeft size={24} className="text-slate-900" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate("next");
                }}
                className="pointer-events-auto flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform hover:scale-110 active:scale-90"
              >
                <ChevronRight size={24} className="text-slate-900" />
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-white p-5 md:p-6 shrink-0">
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-full bg-orange-600 px-3 py-1 text-[10px] font-black text-white uppercase">
                Day {selectedPhoto.day}
              </span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {selectedPhoto.id || "Texas 4000 Moment"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
