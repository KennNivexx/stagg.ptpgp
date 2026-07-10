"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Intro splash shown on every visit to the public homepage — a
 * flat SVG truck drives across a road, then the whole overlay fades away to
 * reveal the (already server-rendered) page underneath. Purely decorative:
 * the page content behind it is already painted, so this never blocks or
 * delays real data.
 *
 * Only opacity/transform are animated (no layout-affecting properties) to
 * avoid the mobile CLS/perf issues that got the previous public-site
 * animations removed — see commit afe5936.
 */
export default function SplashScreen() {
  // Starts false on both server and client render, so there's no hydration
  // mismatch — the effect below is what decides (client-only) whether to
  // actually show it. Shows every time this component mounts (i.e. every
  // fresh visit to the homepage), not just once per browser session.
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const totalMs = prefersReducedMotion ? 400 : 2200;
    const showTimer = setTimeout(() => setVisible(true), 0);
    const hideTimer = setTimeout(() => setVisible(false), totalMs);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [prefersReducedMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a1628] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Batik-inspired kawung motif, tiled and slowly drifting */}
          {!prefersReducedMotion && (
            <motion.div
              className="absolute inset-[-60px] opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 12px 12px, #fff 3px, transparent 3.5px), radial-gradient(circle at 36px 36px, #fff 3px, transparent 3.5px), radial-gradient(circle at 12px 36px, transparent 3px, transparent 3.5px), radial-gradient(circle at 36px 12px, transparent 3px, transparent 3.5px)",
                backgroundSize: "48px 48px",
              }}
              animate={{ backgroundPositionX: [0, 48], backgroundPositionY: [0, 48] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
          )}

          {/* Soft glowing orbs */}
          {!prefersReducedMotion && (
            <>
              <motion.div
                className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-pgp-red/25 blur-3xl"
                animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.15, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-28 -right-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl"
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              />
            </>
          )}

          {/* Thin animated grid lines for depth */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative flex items-center justify-center mb-3"
          >
            <span className="w-20 h-20 flex items-center justify-center">
              <Image src="/images/logo.png" alt="PT Pratama Galuh Perkasa" width={80} height={80} className="w-full h-full object-contain" priority />
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative text-center leading-tight mb-1"
          >
            <span className="block text-white font-black tracking-wide text-lg sm:text-2xl">
              PT PRATAMA
            </span>
            <span className="block bg-gradient-to-r from-orange-400 via-pgp-red to-orange-400 bg-clip-text text-transparent font-black tracking-wide text-lg sm:text-2xl">
              GALUH PERKASA
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="relative text-white/40 text-[10px] sm:text-xs tracking-wide mb-8"
          >
            Solusi transportasi & freight forwarding terpercaya
          </motion.p>

          <div className="relative w-[220px] sm:w-[280px] h-[90px]">
            {!prefersReducedMotion && (
              <motion.svg
                viewBox="0 0 200 90"
                className="absolute bottom-0 left-0 w-[150px] sm:w-[180px] h-auto"
                initial={{ x: -220 }}
                animate={{ x: 60 }}
                transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Container / trailer */}
                <rect x="6" y="18" width="98" height="46" rx="5" fill="#1A2A6C" />
                <rect x="10" y="22" width="90" height="19" rx="2" fill="#F7941D" />
                <rect x="10" y="41" width="90" height="19" rx="2" fill="#FF6F5E" />
                {[24, 41, 58, 75].map((cx) => (
                  <rect key={cx} x={cx} y="26" width="7" height="30" rx="3" fill="#ffffff" />
                ))}

                {/* Coupling */}
                <rect x="104" y="46" width="9" height="10" rx="1.5" fill="#8B8BE8" />

                {/* Cab */}
                <path d="M113 24h28c9 0 15 4 19 12l8 16v12h-55z" fill="#1A2A6C" />
                <path d="M117 28h24c7 0 12 3 15 9l6 13h-45z" fill="#F7941D" />
                <rect x="122" y="32" width="18" height="16" rx="2" fill="#ffffff" />

                {/* Wheels */}
                {[32, 58, 134].map((cx) => (
                  <g key={cx}>
                    <circle cx={cx} cy="72" r="11" fill="#1A2A6C" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
                      style={{ originX: 0.5, originY: 0.5 }}
                    >
                      <circle cx={cx} cy="72" r="4.5" fill="#8B8BE8" />
                      <rect x={cx - 1} y="63" width="2" height="18" fill="#8B8BE8" opacity="0.5" />
                      <rect x={cx - 9} y="71" width="18" height="2" fill="#8B8BE8" opacity="0.5" />
                    </motion.g>
                  </g>
                ))}
              </motion.svg>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 overflow-hidden rounded-full">
              <motion.div
                className="h-full bg-gradient-to-r from-transparent via-orange-400 to-pgp-red"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="relative text-white/50 text-[11px] mt-6 tracking-wide flex items-center gap-2"
          >
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-orange-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
            Menyiapkan solusi logistik Anda...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
