"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Eyebrow } from "./ui/PublicPrimitives";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  show?: boolean;
  title?: string;
  subtitle?: string;
  faqs?: FAQItem[];
}

const defaultFaqs: FAQItem[] = [
  {
    question: "Berapa lama proses pengiriman?",
    answer: "Waktu pengiriman sangat bergantung pada jarak, rute, dan jenis layanan yang dipilih. Kami menyediakan opsi pengiriman ekspres dan reguler yang estimasi waktunya (SLA) akan diinformasikan secara transparan sebelum persetujuan kontrak."
  },
  {
    question: "Apakah tersedia asuransi cargo?",
    answer: "Tentu, kami menyediakan opsi perlindungan asuransi kargo yang komprehensif bekerja sama dengan penyedia asuransi terkemuka untuk memastikan barang Anda aman dari segala risiko selama dalam perjalanan."
  },
  {
    question: "Apakah melayani ekspor impor?",
    answer: "Ya, layanan Freight Forwarding kami mencakup pengurusan dokumen kepabeanan dan logistik untuk aktivitas ekspor dan impor secara menyeluruh, baik via darat, laut, maupun udara."
  },
  {
    question: "Bagaimana cara mendapatkan quotation?",
    answer: "Anda dapat menekan tombol 'Request Quotation' di website ini atau menghubungi tim layanan pelanggan kami via WhatsApp. Tim kami akan merespons dengan cepat memberikan estimasi harga sesuai spesifikasi kargo Anda."
  },
  {
    question: "Apakah ada tracking pengiriman?",
    answer: "Ya, kami menggunakan sistem manajemen transportasi (TMS) modern yang memungkinkan Anda untuk melacak status dan posisi pengiriman Anda secara real-time."
  }
];

export default function FAQSection({
  show = true,
  title = "FAQ",
  subtitle = "Pertanyaan Umum",
  faqs = defaultFaqs,
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!show) return null;

  const items = faqs?.length ? faqs : defaultFaqs;

  return (
    <motion.section
      id="faq"
      className="py-20 lg:py-28 bg-white scroll-mt-[72px]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-14 sm:mb-16">
          <Eyebrow number="09">{subtitle}</Eyebrow>
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-[#1A1612] tracking-tight leading-[1.08]">
            {title}
          </h2>
        </div>

        <div className="space-y-3">
          {items.map((faq, index) => (
            <div key={faq.question} className="bg-[#F7F3EE] rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left px-6 sm:px-8 py-5 sm:py-6 flex justify-between items-center focus:outline-none"
              >
                <span className="font-bold text-[#1A1612] pr-8">{faq.question}</span>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-400 transition-transform duration-300 ${openIndex === index ? "rotate-180 text-pgp-red" : ""}`} 
                />
              </button>
              <div 
                className={`px-8 overflow-hidden transition-all duration-300 ${openIndex === index ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <p className="text-gray-500 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
