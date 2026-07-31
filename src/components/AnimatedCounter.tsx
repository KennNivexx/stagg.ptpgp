"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (v: number) => string;
}

// Counts up from the previous value to the new one whenever `value` changes —
// used on dashboard KPI cards per the UI audit's "animasi angka (counter)"
// requirement. Framer Motion's imperative `animate()` drives the tween; a
// ref (not state) tracks the start point so re-renders don't restart it.
export default function AnimatedCounter({ value, duration = 1, formatter }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    const from = mounted.current ? prevValue.current : 0;
    mounted.current = true;
    const controls = animate(from, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    prevValue.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const fmt = formatter || ((v: number) => Math.round(v).toLocaleString("id-ID"));
  return <>{fmt(display)}</>;
}
