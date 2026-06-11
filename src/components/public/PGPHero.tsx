"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PGPHero() {
  return (
    <section className="relative h-screen min-h-[650px] max-h-[800px] flex items-center justify-center overflow-hidden mt-[72px]">
      {/* Background Video/Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-pgp-navy/90 via-pgp-navy/40 to-black/20 z-10" />
        <div className="w-full h-full object-cover overflow-hidden pointer-events-none">
          <iframe
            className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2"
            src="https://www.youtube.com/embed/9xzh68Ig0BY?rel=0&autoplay=1&mute=1&enablejsapi=1&controls=0&loop=1&playlist=9xzh68Ig0BY&fs=0&modestbranding=1"
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block py-1 px-4 border border-white/20 bg-white/5 backdrop-blur-sm rounded-full text-white/90 text-[10px] font-bold tracking-widest uppercase mb-8">
            PT Pratama Galuh Perkasa
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md">
            PRATAMA{" "}
            <span className="font-light text-white/90">GALUH PERKASA</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-12 leading-relaxed font-light max-w-2xl mx-auto drop-shadow">
            Kami memberikan solusi logistik komprehensif, mulai dari
            transportasi darat hingga pengiriman laut dan pergudangan tingkat
            lanjut. Dengan pengalaman lebih dari 20 tahun, tim profesional kami
            memastikan rantai pasokan Anda berjalan efisien.
          </p>

          <div className="flex justify-center">
            <Link
              href="/#contact"
              className="group bg-pgp-red text-white px-8 py-3.5 rounded-full font-semibold hover:bg-pgp-red-hover transition-all duration-300 text-sm flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Hubungi Kami{" "}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
