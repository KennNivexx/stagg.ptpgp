"use client";

import { motion } from "framer-motion";
import { Truck } from "lucide-react";

// Shared ambient background for every logged-in portal (HRD, Director,
// Department, Employee, Superadmin, Applicant): dot grid, drifting glow
// orbs, and a faint delivery-route path with a truck gliding along it —
// nodding to the logistics business this HRIS runs for. Fixed + clipped so
// the moving truck never causes page scroll, and pointer-events-none so it
// never blocks clicks on real content.
export default function PageBackgroundDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <motion.div
        className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-[#CC0000]/8 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 -right-24 h-[28rem] w-[28rem] rounded-full bg-orange-400/8 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg
        className="absolute bottom-16 left-0 w-full h-40 opacity-[0.18]"
        viewBox="0 0 1200 160"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M -50 120 C 150 60, 350 160, 550 90 S 900 20, 1250 100"
          stroke="#CC0000"
          strokeWidth="2.5"
          strokeDasharray="10 10"
          fill="none"
        />
      </svg>
      <motion.div
        className="absolute bottom-16 text-[#CC0000]/25"
        style={{ left: 0 }}
        animate={{
          left: ["-5%", "105%"],
          top: [88, 48, 108, 68, 88],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear", times: [0, 0.25, 0.5, 0.75, 1] }}
      >
        <Truck size={26} />
      </motion.div>
    </div>
  );
}
