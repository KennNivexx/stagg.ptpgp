"use client";

import { Container, Eyebrow, StatCounter, Reveal } from "./ui/PublicPrimitives";

interface StatItem {
  label: string;
  value: string;
  icon?: string;
}

interface StatsProps {
  show?: boolean;
  title?: string;
  stats?: StatItem[];
}

const defaultStats: StatItem[] = [
  { value: "28+", label: "Tahun Pengalaman" },
  { value: "500+", label: "Klien Aktif" },
  { value: "50.000+", label: "Pengiriman" },
  { value: "98%", label: "On-Time Delivery" },
];

export default function StatsSection({ show = true, title = "", stats = defaultStats }: StatsProps) {
  if (!show) return null;
  const items = stats?.length ? stats : defaultStats;

  return (
    <section className="relative bg-[#F7F3EE] py-20 sm:py-24 lg:py-28 overflow-hidden">
      {/* Faint oversized watermark number — the quiet "we track this for
          real" texture that a flat color band can't convey on its own. */}
      <div className="absolute -right-8 -top-10 select-none pointer-events-none text-[#1A1612]/[0.03] font-extrabold text-[16rem] leading-none tracking-tighter">
        #
      </div>

      <Container className="relative">
        <Reveal>
          <div className="flex flex-col items-center text-center mb-14 sm:mb-16">
            <Eyebrow number="DAMPAK">Bukan estimasi</Eyebrow>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1A1612] tracking-tight leading-[1.08] max-w-2xl">
              {title || "Angka yang benar-benar kami kerjakan"}
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-6 sm:gap-x-10">
          {items.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.08} className="text-center md:text-left border-t border-[#1A1612]/10 pt-6 md:border-t-0 md:pt-0">
              <StatCounter value={stat.value} label={stat.label} index={index + 1} tone="light" />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
