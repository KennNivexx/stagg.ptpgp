"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import QuotationModal from "./QuotationModal";
import { Eyebrow } from "./ui/PublicPrimitives";

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
      className="py-20 lg:py-28 bg-[#F7F3EE] border-y border-[#1A1612]/[0.06] relative overflow-hidden scroll-mt-[72px]"
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

      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div variants={item} className="flex justify-center">
          <Eyebrow number="MULAI">Langkah berikutnya</Eyebrow>
        </motion.div>
        <motion.h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-[#1A1612] mb-6 tracking-tight leading-[1.05]" variants={item}>
          {title}
        </motion.h2>
        <motion.p className="text-base md:text-lg text-[#5B5650] mb-12 max-w-xl mx-auto" variants={item}>
          {subtitle}
        </motion.p>

        <motion.div className="flex flex-col sm:flex-row justify-center gap-4" variants={item}>
          {/* "/contact" is treated the same as empty because it's a known-dead
              route (no page exists there) that the CTA editor's old default
              could have already saved into the live settings for any site
              whose CTA section was ever saved before that default was fixed —
              this keeps the button working even for already-persisted data. */}
          {button_url && button_url !== "/contact" ? (
            <a
              href={button_url}
              className="bg-pgp-red hover:bg-pgp-red-hover text-white px-8 py-4 rounded-xl font-extrabold transition-all shadow-[0_10px_30px_-6px_rgba(221,44,0,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {button_text} <ArrowRight size={18} />
            </a>
          ) : (
            <button
              onClick={() => setIsQuoteOpen(true)}
              className="bg-pgp-red hover:bg-pgp-red-hover text-white px-8 py-4 rounded-xl font-extrabold transition-all shadow-[0_10px_30px_-6px_rgba(221,44,0,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              {button_text} <ArrowRight size={18} />
            </button>
          )}
          <a
            href={`https://wa.me/${whatsapp_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1A1612] hover:bg-[#1A1612]/85 text-white px-8 py-4 rounded-xl font-extrabold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            {whatsapp_text} <MessageCircle size={18} />
          </a>
        </motion.div>
      </div>

      <QuotationModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </motion.section>
  );
}
