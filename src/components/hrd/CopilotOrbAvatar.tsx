"use client";

import { motion } from "framer-motion";

// Abstract "AI orb" mark for the HRD Copilot, replacing the generic lucide
// Bot/Sparkles icon per the UI audit. Deliberately not a robot — an
// elegant rotating mark that pulses/glows while a reply is being generated,
// with no visible AI-vendor branding anywhere (see hrd-copilot.ts's
// toClientResult — the vendor name never reaches this component either).
export default function CopilotOrbAvatar({ size = 24, thinking = false }: { size?: number; thinking?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {thinking && (
        <motion.span
          className="absolute inset-0 rounded-full bg-gradient-to-br from-[#CC0000] to-orange-500 blur-sm"
          animate={{ opacity: [0.35, 0.75, 0.35], scale: [1, 1.25, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <span className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-[#CC0000] to-orange-500 overflow-hidden">
        <motion.svg
          width={size * 0.62}
          height={size * 0.62}
          viewBox="0 0 24 24"
          fill="none"
          animate={{ rotate: 360 }}
          transition={{ duration: thinking ? 2.2 : 9, repeat: Infinity, ease: "linear" }}
        >
          <ellipse cx="12" cy="12" rx="10" ry="4" stroke="white" strokeWidth="1.4" opacity="0.9" />
          <ellipse cx="12" cy="12" rx="10" ry="4" stroke="white" strokeWidth="1.4" opacity="0.6" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" stroke="white" strokeWidth="1.4" opacity="0.6" transform="rotate(120 12 12)" />
          <circle cx="12" cy="12" r="2.2" fill="white" />
        </motion.svg>
      </span>
    </div>
  );
}
