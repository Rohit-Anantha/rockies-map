import { AnimatePresence, motion } from "framer-motion";

export const AuthOverlay = ({
  isAuthenticated,
  onAuth,
}: {
  isAuthenticated: boolean;
  onAuth: (pass: string) => void;
}) => {
  return (
    <AnimatePresence>
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 1, backdropFilter: "blur(16px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-white/40 backdrop-blur-xl pointer-events-auto"
        >
          <div className="w-full max-w-md p-8 bg-white/80 rounded-3xl shadow-2xl border border-white/60">
            <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">
              We&apos;ll be together ...
            </h2>
            <input
              type="text"
              /* Ensure text-base (16px) or text-lg is used */
              className="w-full px-4 py-3 rounded-xl border border-stone-400 text-center outline-none bg-white text-slate-900 text-base"
              onChange={(e) => onAuth(e.target.value)}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
