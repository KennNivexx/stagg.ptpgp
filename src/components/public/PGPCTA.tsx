"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PGPCTA() {
  return (
    <section id="contact" className="py-24 bg-pgp-red relative overflow-hidden">
      {/* Abstract background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,100 L100,0 L100,100 Z" fill="#ffffff" />
        </svg>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
          Siap Mengoptimalkan Rantai Pasokan Global Anda?
        </h2>
        <p className="text-xl text-red-100 mb-10 max-w-2xl mx-auto">
          Bermitra dengan PT Pratama Galuh Perkasa untuk solusi logistik yang mulus, efisien, dan andal yang disesuaikan dengan kebutuhan spesifik Anda.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/#contact" className="bg-white text-pgp-red px-8 py-4 rounded-md font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-lg shadow-lg">
            Hubungi Kami <ArrowRight size={20} />
          </Link>
          <Link href="/#quote" className="bg-transparent text-white border border-white px-8 py-4 rounded-md font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-lg">
            Minta Penawaran
          </Link>
        </div>
      </div>
    </section>
  );
}
