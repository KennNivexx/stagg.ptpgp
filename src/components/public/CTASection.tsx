"use client";

import { useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import QuotationModal from "./QuotationModal";

export default function CTASection() {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  return (
    <section id="contact" className="py-24 bg-orange-50/25 border-y border-orange-500/5 relative overflow-hidden">
      {/* Decorative red accent */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-pgp-red rounded-full blur-3xl opacity-5 pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-pgp-navy mb-6 tracking-tight">
          Siap Mengirim Barang dengan Aman dan Tepat Waktu?
        </h2>
        <p className="text-xl text-zinc-600 font-light mb-12">
          Hubungi tim kami sekarang untuk mendapatkan penawaran terbaik sesuai kebutuhan bisnis logistik Anda.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => setIsQuoteOpen(true)}
            className="bg-pgp-red hover:bg-pgp-red-hover text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-pgp-red/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            Request Quotation <ArrowRight size={18} />
          </button>
          <a 
            href="https://wa.me/6281234567890" // Placeholder number
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            WhatsApp Sekarang <MessageCircle size={18} />
          </a>
        </div>
      </div>

      <QuotationModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </section>
  );
}
