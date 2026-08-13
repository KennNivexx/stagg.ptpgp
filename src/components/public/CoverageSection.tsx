"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Eyebrow } from "./ui/PublicPrimitives";

interface CoverageItem {
  region: string;
  description?: string;
}

interface CoverageProps {
  show?: boolean;
  title?: string;
  subtitle?: string;
  domestic?: CoverageItem[];
  international?: CoverageItem[];
}

const defaultDomestic: CoverageItem[] = [
  { region: "Jakarta" },
  { region: "Surabaya" },
  { region: "Medan" },
  { region: "Makassar" },
  { region: "Balikpapan" },
  { region: "Batam" }
];

const defaultInternational: CoverageItem[] = [
  { region: "Singapura" },
  { region: "Malaysia" },
  { region: "China" },
  { region: "Thailand" },
  { region: "Vietnam" },
  { region: "Timur Tengah" }
];

export default function CoverageSection({
  show = true,
  title = "Area Layanan",
  subtitle = "Cakupan Pengiriman",
  domestic = defaultDomestic,
  international = defaultInternational,
}: CoverageProps) {
  if (!show) return null;

  const domestik = domestic?.length ? domestic : defaultDomestic;
  const internasional = international?.length ? international : defaultInternational;

  return (
    <motion.section
      id="coverage"
      className="py-20 lg:py-28 bg-white overflow-hidden relative scroll-mt-[72px]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <Eyebrow number="04">{subtitle}</Eyebrow>
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-[#1A1612] tracking-tight leading-[1.08]">
            {title}
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2 bg-[#F7F3EE] rounded-2xl p-8 sm:p-10 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-extrabold mb-8 flex items-center gap-3 text-[#1A1612]">
              <span className="w-9 h-9 rounded-xl bg-white text-pgp-red flex items-center justify-center shadow-sm"><MapPin size={18}/></span>
              Domestik (Indonesia)
            </h3>
            <ul className="grid grid-cols-2 gap-y-6 gap-x-4">
              {domestik.map((item, idx) => (
                <li key={item.region} className="flex items-center gap-3 text-[#1A1612] text-sm font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-pgp-red"></div> {item.region}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:w-1/2 bg-[#1A1612] rounded-2xl p-8 sm:p-10 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-extrabold mb-8 flex items-center gap-3 text-white">
              <span className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center"><Globe size={18}/></span>
              Internasional
            </h3>
            <ul className="grid grid-cols-2 gap-y-6 gap-x-4">
              {internasional.map((item, idx) => (
                <li key={item.region} className="flex items-center gap-3 text-white text-sm font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/60"></div> {item.region}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function Globe({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
}
