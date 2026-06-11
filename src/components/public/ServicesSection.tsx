"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ServicesSection() {
  return (
    <section id="services" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left Text Side */}
          <div className="lg:w-1/2 flex flex-col justify-center">
            <div className="w-12 h-1 bg-pgp-red mb-8 rounded-full"></div>
            <h2 className="text-4xl lg:text-5xl font-bold text-pgp-navy mb-6 leading-tight tracking-tight">
              Solusi Logistik Komprehensif
              <br />
              <span className="text-gray-400 font-light">Tepat untuk Anda</span>
            </h2>
            <p className="text-lg text-gray-500 mb-10 font-light leading-relaxed max-w-lg">
              Kami menyediakan solusi logistik menyeluruh untuk membantu Anda
              mencapai target bisnis dengan mulus. Dukungan tim profesional
              dengan pengalaman lebih dari 20 tahun menjamin setiap tahap rantai
              pasokan Anda beroperasi tanpa hambatan.
            </p>
            <div>
              <Link
                href="/#contact"
                className="group inline-flex items-center gap-3 text-pgp-red font-semibold text-sm hover:text-pgp-red-hover transition-colors"
              >
                Konsultasikan Kebutuhan Anda
                <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </Link>
            </div>
          </div>

          {/* Right Image Side */}
          <div className="lg:w-1/2 w-full">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
                className="w-full h-full object-cover"
                alt="Port Logistics"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-pgp-navy/20 to-transparent mix-blend-overlay"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
