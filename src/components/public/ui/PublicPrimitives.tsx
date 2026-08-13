"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

/**
 * Shared visual language for the public marketing site — introduced to stop
 * every section from re-inventing its own container/heading/stat treatment.
 * None of this is used by the internal HRD/employee/director portals; those
 * keep their existing look untouched.
 */

export function Container({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

/** Small numbered/dotted kicker label — the "01 · KOMPETENSI" mark pattern. */
export function Eyebrow({
  children,
  number,
  tone = "light",
}: {
  children: React.ReactNode;
  number?: string;
  tone?: "light" | "dark";
}) {
  const toneClass = tone === "dark" ? "text-white/70" : "text-pgp-red";
  return (
    <div className={`flex items-center gap-2.5 mb-4 sm:mb-5 ${toneClass}`}>
      {number && (
        <span className="font-mono text-[11px] font-bold tracking-[0.15em] tabular-nums">{number}</span>
      )}
      <span className="h-px w-6 bg-current opacity-40" />
      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em]">{children}</span>
    </div>
  );
}

/** Consistent large-type section heading: eyebrow + big bold title + optional lede. */
export function SectionHeading({
  eyebrow,
  eyebrowNumber,
  title,
  lede,
  tone = "light",
  align = "left",
}: {
  eyebrow?: string;
  eyebrowNumber?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "center";
}) {
  const alignClass = align === "center" ? "text-center items-center mx-auto" : "text-left items-start";
  const titleColor = tone === "dark" ? "text-white" : "text-[#1A1612]";
  const ledeColor = tone === "dark" ? "text-white/70" : "text-[#5B5650]";
  return (
    <div className={`flex flex-col ${alignClass} max-w-2xl`}>
      {eyebrow && <Eyebrow number={eyebrowNumber} tone={tone}>{eyebrow}</Eyebrow>}
      <h2 className={`text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold leading-[1.08] tracking-tight ${titleColor}`}>
        {title}
      </h2>
      {lede && <p className={`mt-4 text-base sm:text-lg leading-relaxed ${ledeColor}`}>{lede}</p>}
    </div>
  );
}

/** Big bold number that counts up from 0 once scrolled into view — the
 * "Bukan janji. Angka di lapangan." style stat block. Parses a leading
 * numeric run out of strings like "2.500+" / "98%" / "28+ Tahun" so CMS
 * authors can keep typing free-form values; the animation still degrades
 * gracefully (renders the literal string) if no leading number is found. */
export function StatCounter({
  value,
  label,
  index,
  tone = "light",
  size = "lg",
}: {
  value: string;
  label: string;
  index?: number;
  tone?: "light" | "dark";
  size?: "sm" | "lg";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState("0");

  const match = value.match(/^([\d.,]+)(.*)$/);
  const numeric = match ? parseFloat(match[1].replace(/\./g, "").replace(",", ".")) : null;
  const suffix = match ? match[2] : "";
  const prefixFormatted = match ? match[1] : null;

  useEffect(() => {
    if (!inView || numeric === null) {
      if (!inView) return;
      setDisplay(value);
      return;
    }
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const usesDot = prefixFormatted?.includes(".") && !prefixFormatted?.includes(",");
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(numeric * eased);
      setDisplay(usesDot ? current.toLocaleString("id-ID") : String(current));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const numColor = tone === "dark" ? "text-white" : "text-[#1A1612]";
  const labelColor = tone === "dark" ? "text-white/50" : "text-[#8A8478]";
  const numSize = size === "lg" ? "text-4xl sm:text-5xl md:text-6xl" : "text-2xl sm:text-3xl";
  const labelSize = size === "lg" ? "text-xs sm:text-sm mt-2" : "text-[11px] mt-1";

  return (
    <div ref={ref}>
      {typeof index === "number" && (
        <div className="font-mono text-[11px] font-bold tracking-[0.15em] mb-3 text-pgp-red">
          {String(index).padStart(2, "0")}
        </div>
      )}
      <div className={`font-extrabold tracking-tight tabular-nums ${numSize} ${numColor}`}>
        {numeric !== null ? display : value}
        {numeric !== null && suffix}
      </div>
      <div className={`font-semibold uppercase tracking-wider ${labelSize} ${labelColor}`}>{label}</div>
    </div>
  );
}

/** Fade+rise-into-view wrapper — the one scroll-reveal treatment every
 * section should share instead of hand-rolling its own variants object. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
