"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageSquare } from "lucide-react";
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
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
          {parts[0]}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pgp-red">{titleHighlight}</span>
          {parts[1]}
        </h1>
      );
    }
    return (
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
        {title}
      </h1>
    );
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
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
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl">
          {badge && (
            <span className="inline-block py-1.5 px-4 bg-pgp-red/30 text-orange-400 font-extrabold text-xs tracking-wider uppercase rounded-full mb-6 border border-orange-500/30 backdrop-blur-sm">
              {badge}
            </span>
          )}
          {renderTitle()}
          <p className="text-lg md:text-xl text-zinc-100 mb-10 leading-relaxed font-normal max-w-2xl">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setIsQuoteOpen(true)}
              className="bg-pgp-red hover:bg-pgp-red-hover text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-pgp-red/25 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              Request Quotation <ArrowRight size={18} />
            </button>
            <Link 
              href="#contact" 
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-bold transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              Hubungi Kami <MessageSquare size={18} />
            </Link>
          </div>
        </div>
      </div>

      <QuotationModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </section>
  );
}
