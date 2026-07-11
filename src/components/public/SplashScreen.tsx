"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const BUILDINGS = [
  { x: 0, w: 34, h: 58 }, { x: 32, w: 22, h: 88 }, { x: 52, w: 30, h: 66 },
  { x: 80, w: 20, h: 104 }, { x: 98, w: 34, h: 74 }, { x: 130, w: 24, h: 96 },
  { x: 152, w: 30, h: 60 }, { x: 180, w: 22, h: 82 }, { x: 200, w: 34, h: 70 },
  { x: 232, w: 20, h: 110 }, { x: 250, w: 30, h: 64 }, { x: 278, w: 26, h: 90 },
  { x: 302, w: 34, h: 72 }, { x: 334, w: 22, h: 58 }, { x: 354, w: 30, h: 100 },
  { x: 382, w: 24, h: 68 }, { x: 404, w: 34, h: 86 }, { x: 436, w: 22, h: 62 },
];

/**
 * Intro splash shown on every visit to the public homepage — an animated
 * city scene (drifting clouds, a building skyline, a truck driving across
 * the road) behind the logo, then the whole overlay fades to reveal the
 * (already server-rendered) page underneath. Purely decorative: the page
 * content behind it is already painted, so this never blocks or delays real
 * data.
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
    const totalMs = prefersReducedMotion ? 400 : 5500;
    const showTimer = setTimeout(() => setVisible(true), 0);
    const hideTimer = setTimeout(() => setVisible(false), totalMs);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [prefersReducedMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center overflow-hidden"
          style={{ background: "linear-gradient(180deg, #cfe9fb 0%, #e6f3fc 55%, #fbfdff 100%)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Sun glow */}
          <div
            className="absolute inset-x-0 top-0 h-2/3 opacity-70"
            style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,209,128,0.35), transparent 70%)" }}
          />

          {/* Drifting clouds, three depths for a little parallax */}
          {!prefersReducedMotion && (
            <>
              <motion.div
                className="absolute top-[8%] left-0 flex gap-24"
                animate={{ x: ["-10%", "10%"] }}
                transition={{ duration: 14, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
              >
                {[0, 1, 2].map((i) => (
                  <span key={i} className="block w-40 h-12 rounded-full bg-white/90 blur-md" />
                ))}
              </motion.div>
              <motion.div
                className="absolute top-[16%] left-0 flex gap-32"
                animate={{ x: ["6%", "-14%"] }}
                transition={{ duration: 19, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
              >
                {[0, 1].map((i) => (
                  <span key={i} className="block w-56 h-16 rounded-full bg-white/70 blur-lg" />
                ))}
              </motion.div>
            </>
          )}

          {/* Soft glowing orbs */}
          {!prefersReducedMotion && (
            <>
              <motion.div
                className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-pgp-red/10 blur-3xl"
                animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.15, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-28 -right-20 w-80 h-80 rounded-full bg-orange-300/15 blur-3xl"
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              />
            </>
          )}

          {/* Logo + name, upper-middle, above the skyline */}
          <div className="relative z-10 flex flex-col items-center flex-1 justify-center pb-16">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="flex items-center justify-center mb-4"
            >
              <span className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
                <Image src="/images/logo.png" alt="PT Pratama Galuh Perkasa" width={160} height={160} className="w-full h-full object-contain" priority />
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[#1A2A6C] font-black tracking-wide text-2xl sm:text-4xl text-center"
            >
              Pratama Galuh Perkasa
            </motion.p>
          </div>

          {/* City skyline sitting on the road */}
          <div className="relative z-10 w-full h-[120px] sm:h-[150px]">
            <svg viewBox="0 0 460 120" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
              {!prefersReducedMotion ? (
                <motion.g
                  animate={{ x: ["0%", "-4%"] }}
                  transition={{ duration: 22, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
                >
                  {BUILDINGS.map((b, i) => (
                    <g key={i}>
                      <rect x={b.x} y={120 - b.h} width={b.w} height={b.h} fill="#8fa3c7" />
                      {Array.from({ length: Math.floor(b.h / 16) }).map((_, row) => (
                        <rect key={row} x={b.x + 5} y={120 - b.h + 8 + row * 16} width={4} height={5} fill="#fbfdff" opacity={0.55} />
                      ))}
                    </g>
                  ))}
                </motion.g>
              ) : (
                BUILDINGS.map((b, i) => (
                  <rect key={i} x={b.x} y={120 - b.h} width={b.w} height={b.h} fill="#8fa3c7" />
                ))
              )}
            </svg>

            {/* Road */}
            <div className="absolute bottom-0 left-0 right-0 h-[14px] sm:h-[18px] bg-[#334066]">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] overflow-hidden">
                <motion.div
                  className="h-full w-[200%]"
                  style={{ backgroundImage: "repeating-linear-gradient(90deg, #F7941D 0 22px, transparent 22px 44px)" }}
                  animate={prefersReducedMotion ? undefined : { x: ["0%", "-50%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>

            {/* Truck driving left to right, pausing briefly in the middle */}
            {!prefersReducedMotion && (
              <motion.svg
                viewBox="0 0 200 90"
                className="absolute bottom-[10px] sm:bottom-[14px] w-[130px] sm:w-[160px] h-auto"
                initial={{ left: "-24%" }}
                animate={{ left: ["-24%", "42%", "42%", "108%"] }}
                transition={{ duration: 5, delay: 0.2, times: [0, 0.4, 0.65, 1], ease: ["easeOut", "linear", "easeIn"] }}
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
