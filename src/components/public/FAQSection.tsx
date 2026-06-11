"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQSection() {
  const faqs = [
    {
      q: "Berapa lama proses pengiriman?",
      a: "Waktu pengiriman sangat bergantung pada jarak, rute, dan jenis layanan yang dipilih. Kami menyediakan opsi pengiriman ekspres dan reguler yang estimasi waktunya (SLA) akan diinformasikan secara transparan sebelum persetujuan kontrak."
    },
    {
      q: "Apakah tersedia asuransi cargo?",
      a: "Tentu, kami menyediakan opsi perlindungan asuransi kargo yang komprehensif bekerja sama dengan penyedia asuransi terkemuka untuk memastikan barang Anda aman dari segala risiko selama dalam perjalanan."
    },
    {
      q: "Apakah melayani ekspor impor?",
      a: "Ya, layanan Freight Forwarding kami mencakup pengurusan dokumen kepabeanan dan logistik untuk aktivitas ekspor dan impor secara menyeluruh, baik via darat, laut, maupun udara."
    },
    {
      q: "Bagaimana cara mendapatkan quotation?",
      a: "Anda dapat menekan tombol 'Request Quotation' di website ini atau menghubungi tim layanan pelanggan kami via WhatsApp. Tim kami akan merespons dengan cepat memberikan estimasi harga sesuai spesifikasi kargo Anda."
    },
    {
      q: "Apakah ada tracking pengiriman?",
      a: "Ya, kami menggunakan sistem manajemen transportasi (TMS) modern yang memungkinkan Anda untuk melacak status dan posisi pengiriman Anda secara real-time."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-[#FCF9F6]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
            Pertanyaan Umum
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy tracking-tight">
            FAQ
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left px-8 py-6 flex justify-between items-center focus:outline-none"
              >
                <span className="font-bold text-pgp-navy pr-8">{faq.q}</span>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-400 transition-transform duration-300 ${openIndex === index ? "rotate-180 text-pgp-red" : ""}`} 
                />
              </button>
              <div 
                className={`px-8 overflow-hidden transition-all duration-300 ${openIndex === index ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <p className="text-gray-500 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
