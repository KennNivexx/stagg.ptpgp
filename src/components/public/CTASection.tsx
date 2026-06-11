"use client";

import { useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import QuotationModal from "./QuotationModal";

interface CTAProps {
  show?: boolean;
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_url?: string;
  whatsapp_text?: string;
  whatsapp_number?: string;
}

export default function CTASection({
  show = true,
  title = "Siap Mengirim Barang dengan Aman dan Tepat Waktu?",
  subtitle = "Hubungi tim kami sekarang untuk mendapatkan penawaran terbaik sesuai kebutuhan bisnis logistik Anda.",
  button_text = "Request Quotation",
  button_url = "",
  whatsapp_text = "WhatsApp Sekarang",
  whatsapp_number = "6281234567890",
}: CTAProps) {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  if (!show) return null;

  return (
    <section id="contact" className="py-24 bg-orange-50/25 border-y border-orange-500/5 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-pgp-red rounded-full blur-3xl opacity-5 pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-pgp-navy mb-6 tracking-tight">
          {title}
        </h2>
        <p className="text-xl text-zinc-600 font-light mb-12">
          {subtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {button_url ? (
            <a 
              href={button_url}
              className="bg-pgp-red hover:bg-pgp-red-hover text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-pgp-red/20 flex items-center justify-center gap-2"
            >
              {button_text} <ArrowRight size={18} />
            </a>
          ) : (
            <button 
              onClick={() => setIsQuoteOpen(true)}
              className="bg-pgp-red hover:bg-pgp-red-hover text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-pgp-red/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {button_text} <ArrowRight size={18} />
            </button>
          )}
          <a 
            href={`https://wa.me/${whatsapp_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {whatsapp_text} <MessageCircle size={18} />
          </a>
        </div>
      </div>

      <QuotationModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </section>
  );
}
