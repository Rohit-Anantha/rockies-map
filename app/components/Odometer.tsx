import { motion } from "framer-motion";

export function Odometer({
  value,
  colorClass = "text-slate-900",
}: {
  value: number | string;
  colorClass?: string;
}) {
  const digits = String(value).split("");

  return (
    <div className={`${colorClass} relative inline-block`}>
      <span className="sr-only">{value}</span>
      <div
        className="flex overflow-hidden leading-none font-black"
        aria-hidden="true"
      >
        {digits.map((digit, i) => {
          // Handle decimals or commas without animation
          if (isNaN(parseInt(digit))) {
            return <span key={i}>{digit}</span>;
          }

          return (
            <div key={i} className="relative h-[1em] w-[0.6em] overflow-hidden">
              <motion.div
                initial={false}
                animate={{ translateY: `-${parseInt(digit) * 10}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="absolute w-full"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <div
                    key={n}
                    className="h-[1em] flex items-center justify-center"
                  >
                    {n}
                  </div>
                ))}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
