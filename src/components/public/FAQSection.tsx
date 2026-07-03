"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

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
      className="py-24 bg-[#FCFAF6] scroll-mt-[72px]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
            {subtitle}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy tracking-tight">
            {title}
          </h2>
        </div>

        <div className="space-y-4">
          {items.map((faq, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left px-8 py-6 flex justify-between items-center focus:outline-none"
              >
                <span className="font-bold text-pgp-navy pr-8">{faq.question}</span>
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
