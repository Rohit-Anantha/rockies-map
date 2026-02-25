"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransitionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: -20 }} // Start slightly to the left
        animate={{ opacity: 1, x: 0 }} // Slide into place
        exit={{ opacity: 0, x: 20 }} // Slide out to the right
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
