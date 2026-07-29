"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import QuotationModal from "./QuotationModal";

interface HeroProps {
  badge?: string;
  title?: string;
  titleHighlight?: string;
  subtitle?: string;
  bgVideoUrl?: string;
  bgImageUrl?: string;
}

export default function HeroSection({
  badge = "PT Pratama Galuh Perkasa",
  title = "Solusi Transportasi & Freight Forwarding Terpercaya",
  titleHighlight = "Freight Forwarding",
  subtitle = "Melayani pengiriman darat, laut, dan udara dengan jaringan luas, armada modern, serta layanan yang tepat waktu dan aman.",
  bgVideoUrl = "",
  bgImageUrl = "",
}: HeroProps) {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  const renderTitle = () => {
    if (titleHighlight && title.includes(titleHighlight)) {
      const parts = title.split(titleHighlight);
      return (
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
            {parts[0]}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pgp-red">{titleHighlight}</span>
            {parts[1]}
          </h1>
      );
    }
    return (
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
        {title}
      </h1>
    );
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-20 sm:pb-24 overflow-hidden">
      <div className="absolute inset-0 z-0">
        {bgVideoUrl ? (
          <iframe
            className="absolute top-1/2 left-1/2 w-[177.77vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none object-cover"
            src={bgVideoUrl}
            allow="autoplay; encrypted-media"
            title="Hero background video"
          />
        ) : bgImageUrl ? (
          <Image src={bgImageUrl} alt="" fill className="object-cover" priority />
        ) : (
          // Default hero background — brand-colored gradient mesh + faint dot
          // grid + drifting glow orbs, so the hero has depth and brand
          // personality even when no CMS image/video has been configured
          // (the previous fallback was a single flat slate gradient).
          <div className="relative w-full h-full bg-gradient-to-br from-[#0a0e17] via-[#111827] to-[#1a0805] overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #fff 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <motion.div
              className="absolute -top-32 -right-20 w-[36rem] h-[36rem] rounded-full bg-pgp-red/30 blur-[120px]"
              animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.08, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-24 -left-16 w-[28rem] h-[28rem] rounded-full bg-orange-500/20 blur-[110px]"
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            />
            <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-blue-500/10 blur-[100px]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl space-y-0">
          {badge && (
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="inline-flex items-center gap-2 py-1.5 px-4 bg-white/10 text-orange-300 font-extrabold text-xs tracking-wider uppercase rounded-full mb-6 border border-white/15 backdrop-blur-md"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-400"></span>
              </span>
              {badge}
            </motion.span>
          )}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          >
            {renderTitle()}
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl text-zinc-100 mb-8 md:mb-10 leading-relaxed font-normal max-w-2xl"
          >
            {subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={() => setIsQuoteOpen(true)}
              className="group bg-pgp-red hover:bg-pgp-red-hover text-white px-8 py-4 rounded-full font-bold transition-all shadow-xl shadow-pgp-red/20 hover:shadow-2xl hover:shadow-pgp-red/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              Request Quotation
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              href="#contact"
              className="group bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 hover:border-white/40 px-8 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 text-sm hover:-translate-y-0.5"
            >
              Hubungi Kami
              <MessageSquare size={18} className="transition-transform group-hover:scale-110" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1, ease: "easeOut" }}
            className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-10 pt-8 border-t border-white/15"
          >
            {[
              { value: "28+", label: "Tahun Pengalaman" },
              { value: "500+", label: "Klien Aktif" },
              { value: "98%", label: "On-Time Delivery" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">{stat.value}</span>
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Curved transition into the next (white) section — a flat rectangular
          cut here is exactly what makes a stacked-sections page read as a
          template; a smooth curve is a cheap, high-leverage way to make the
          page feel deliberately designed. */}
      <div className="absolute bottom-0 left-0 w-full leading-none z-10 pointer-events-none">
        <svg viewBox="0 0 1440 80" className="w-full h-[50px] sm:h-[70px]" preserveAspectRatio="none">
          <path d="M0,80 C360,0 1080,0 1440,80 L1440,80 L0,80 Z" fill="white" />
        </svg>
      </div>

      <QuotationModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </section>
  );
}
