"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import QuotationModal from "./QuotationModal";

export default function HeroSection() {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Video (Full Bleed, Rich Colors) */}
      <div className="absolute inset-0 z-0">
        <iframe
          className="absolute top-1/2 left-1/2 w-[177.77vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none object-cover"
          src="https://www.youtube.com/embed/9xzh68Ig0BY?autoplay=1&mute=1&loop=1&playlist=9xzh68Ig0BY&controls=0&showinfo=0&rel=0&playsinline=1"
          allow="autoplay; encrypted-media"
          title="Hero background video"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl">
          <span className="inline-block py-1.5 px-4 bg-pgp-red/30 text-orange-400 font-extrabold text-xs tracking-wider uppercase rounded-full mb-6 border border-orange-500/30 backdrop-blur-sm">
            PT Pratama Galuh Perkasa
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
            Solusi Transportasi & <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pgp-red">Freight Forwarding</span> Terpercaya
          </h1>
          <p className="text-lg md:text-xl text-zinc-100 mb-10 leading-relaxed font-normal max-w-2xl">
            Melayani pengiriman darat, laut, dan udara dengan jaringan luas, armada modern, serta layanan yang tepat waktu dan aman untuk pengiriman domestik maupun internasional.
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
