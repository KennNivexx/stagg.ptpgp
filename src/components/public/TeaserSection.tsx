"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function TeaserSection() {
  return (
    <section className="py-32 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
        {/* Career Banner */}
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="lg:w-1/2 flex flex-col justify-center">
            <span className="text-pgp-red font-semibold text-xs tracking-widest uppercase mb-4">
              Peluang Karir
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-pgp-navy mb-6 leading-tight tracking-tight">
              Karir di <br />
              Pratama Galuh Perkasa
            </h2>
            <p className="text-lg text-gray-500 mb-10 font-light leading-relaxed max-w-lg">
              Kami percaya bahwa sumber daya manusia adalah kunci keberhasilan.
              Oleh karena itu, kami menyediakan berbagai peluang karir bagi
              individu dinamis yang memiliki semangat untuk berkembang bersama.
            </p>
            <div>
              <Link
                href="/career"
                className="group inline-flex items-center gap-3 text-pgp-navy font-semibold text-sm hover:text-pgp-red transition-colors"
              >
                Lihat Lowongan Tersedia
                <span className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover:border-pgp-red group-hover:text-pgp-red transition-all">
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </Link>
            </div>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="relative aspect-video lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800"
                alt="Career at PGP"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* E-Procurement Banner */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24">
          <div className="lg:w-1/2 flex flex-col justify-center">
            <span className="text-pgp-red font-semibold text-xs tracking-widest uppercase mb-4">
              Kemitraan
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-pgp-navy mb-6 leading-tight tracking-tight">
              E-Procurement <br />
              Pratama Galuh Perkasa
            </h2>
            <p className="text-lg text-gray-500 mb-10 font-light leading-relaxed max-w-lg">
              Pratama Galuh Perkasa membuka peluang bagi para vendor untuk
              menjadi mitra resmi kami dalam mendukung kebutuhan pengadaan
              barang dan jasa dengan sistem yang transparan dan akuntabel.
            </p>
            <div>
              <Link
                href="/e-procurement"
                className="group inline-flex items-center gap-3 text-pgp-navy font-semibold text-sm hover:text-pgp-red transition-colors"
              >
                Daftar sebagai Vendor
                <span className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover:border-pgp-red group-hover:text-pgp-red transition-all">
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </Link>
            </div>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="relative aspect-video lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800"
                alt="E-Procurement"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
