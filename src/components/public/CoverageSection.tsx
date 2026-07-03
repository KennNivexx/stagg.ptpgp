"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

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
      className="py-24 bg-gradient-to-b from-white to-slate-50 text-pgp-navy overflow-hidden relative border-y border-zinc-200/40 scroll-mt-[72px]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-pgp-red font-extrabold text-xs tracking-widest uppercase mb-4 block">
            {subtitle}
          </span>
          <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight text-zinc-950">
            {title}
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/2 bg-white border border-orange-100/50 rounded-3xl p-10 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-extrabold mb-8 flex items-center gap-3 text-zinc-950">
              <span className="w-9 h-9 rounded-xl bg-orange-50 text-pgp-red flex items-center justify-center border border-orange-100/50"><MapPin size={18}/></span>
              Domestik (Indonesia)
            </h3>
            <ul className="grid grid-cols-2 gap-y-6 gap-x-4">
              {domestik.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-zinc-950 text-sm font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-pgp-red"></div> {item.region}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:w-1/2 bg-white border border-blue-100/50 rounded-3xl p-10 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-extrabold mb-8 flex items-center gap-3 text-zinc-950">
              <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50"><Globe size={18}/></span>
              Internasional
            </h3>
            <ul className="grid grid-cols-2 gap-y-6 gap-x-4">
              {internasional.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-zinc-950 text-sm font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> {item.region}
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
