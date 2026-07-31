"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Generic entrance animation wrapper so Server Component pages (which can't
// use framer-motion directly) can still get the "animasi masuk (fade/slide)"
// treatment the UI audit asks for, without converting the whole page client-side.
export default function FadeIn({
  children,
  delay = 0,
  y = 12,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
