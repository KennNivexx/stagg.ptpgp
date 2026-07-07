"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import QuotationModal from "./QuotationModal";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

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
    <motion.section
      id="cta"
      className="py-24 bg-orange-50/25 border-y border-orange-500/5 relative overflow-hidden scroll-mt-[72px]"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={container}
    >
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-pgp-red rounded-full blur-3xl opacity-5 pointer-events-none"></div>
      <motion.div
        className="absolute -bottom-20 -left-20 w-72 h-72 bg-pgp-navy rounded-full blur-3xl opacity-[0.03] pointer-events-none"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-10 left-1/3 w-48 h-48 bg-pgp-red rounded-full blur-3xl opacity-[0.04] pointer-events-none"
        animate={{ x: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.h2 className="text-4xl md:text-5xl font-extrabold text-pgp-navy mb-6 tracking-tight" variants={item}>
          {title}
        </motion.h2>
        <motion.p className="text-xl text-zinc-600 font-light mb-12" variants={item}>
          {subtitle}
        </motion.p>

        <motion.div className="flex flex-col sm:flex-row justify-center gap-4" variants={item}>
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
        </motion.div>
      </div>

      <QuotationModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </motion.section>
  );
}
