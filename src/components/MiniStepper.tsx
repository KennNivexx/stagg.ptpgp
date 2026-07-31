"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

export interface MiniStepperStage {
  key: string;
  label: string;
}

interface MiniStepperProps {
  stages: MiniStepperStage[];
  /** index into `stages` of the current stage; ignored when rejected */
  currentIndex: number;
  rejected?: boolean;
  /** stages up to and including this index still render as "done" when rejected */
  lastReachedIndex?: number;
}

// Compact horizontal progress stepper (submitted -> review -> interview ->
// result) for the applicant dashboard summary — the full detailed version
// lives at /applicant/status; this is a preview so the status is visible at
// a glance without navigating away.
export default function MiniStepper({ stages, currentIndex, rejected, lastReachedIndex = 0 }: MiniStepperProps) {
  return (
    <div className="flex items-center w-full">
      {stages.map((stage, i) => {
        const isDone = rejected ? i <= lastReachedIndex : i < currentIndex;
        const isCurrent = !rejected && i === currentIndex;
        const isRejectedHere = rejected && i > lastReachedIndex;

        return (
          <div key={stage.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border-2 ${
                  isRejectedHere
                    ? "bg-red-50 border-red-300 text-red-500"
                    : isDone
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isCurrent
                    ? "bg-white border-[#CC0000] text-[#CC0000]"
                    : "bg-slate-50 border-slate-200 text-slate-300"
                }`}
              >
                {isRejectedHere ? <XCircle size={14} /> : isDone ? <CheckCircle2 size={14} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                {isCurrent && (
                  <motion.span
                    className="absolute h-7 w-7 rounded-full border-2 border-[#CC0000]"
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </motion.div>
              <span className={`text-[10px] font-semibold text-center leading-tight max-w-[70px] ${isCurrent ? "text-[#CC0000]" : isDone ? "text-emerald-600" : "text-slate-400"}`}>
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: i * 0.08 + 0.1 }}
                style={{ transformOrigin: "left" }}
                className={`h-0.5 flex-1 mx-1 mb-4 ${isDone ? "bg-emerald-400" : "bg-slate-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
