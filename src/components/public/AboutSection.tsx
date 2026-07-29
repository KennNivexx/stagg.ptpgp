"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface AboutProps {
  show?: boolean;
  title?: string;
  description?: string;
  mission_text?: string;
  vision_text?: string;
  image_url?: string;
  years_experience?: string;
}

export default function AboutSection({
  show = true,
  title = "Mitra Logistik Terpercaya Sejak 1996",
  description = "Berawal dari CV Putra Galuh yang didirikan oleh Bapak Maman Rohman pada tahun 1996, PT Pratama Galuh Perkasa (PGP) telah berkembang menjadi salah satu perusahaan jasa transportasi dan logistik terkemuka yang berpusat di Cilegon, Banten.\n\nSelama lebih dari dua dekade, kami telah melayani kebutuhan pengiriman barang industri dan komersial dengan cakupan layanan seluruh Indonesia hingga jangkauan internasional.\n\nSebagai perusahaan yang memiliki legalitas penuh dan mematuhi standar keselamatan industri, visi kami adalah menjadi perusahaan logistik terintegrasi dengan kapabilitas layanan global yang andal, aman, dan efisien.",
  mission_text = "Memberikan solusi pengiriman tepat waktu, aman, dan transparan.",
  vision_text = "Menjadi penyedia layanan logistik global terpadu yang profesional.",
  image_url = "https://images.unsplash.com/photo-1566847413444-469612348b6c?auto=format&fit=crop&q=80&w=1000",
  years_experience = "28+",
}: AboutProps) {
  if (!show) return null;

  const paragraphs = description.split("\n\n").filter(Boolean);

  return (
    <motion.section
      id="about"
      className="py-16 lg:py-24 bg-white scroll-mt-[72px]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {image_url ? (
            <div className="lg:w-1/2 relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-pgp-red/20 via-orange-300/10 to-transparent rounded-[2rem] -z-10 blur-sm" />
              <div className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-pgp-navy/20 ring-1 ring-black/5 relative z-10">
                <Image
                  src={image_url}
                  alt="Tentang PT Pratama Galuh Perkasa"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pgp-navy/30 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-pgp-red/10 rounded-3xl -z-10"></div>
              <div className="absolute top-12 -left-8 bg-white p-6 rounded-2xl shadow-xl shadow-pgp-navy/10 border border-gray-100 z-20 hidden md:block">
                <div className="text-4xl font-black bg-gradient-to-br from-pgp-navy to-pgp-red bg-clip-text text-transparent">{years_experience}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Tahun Pengalaman
                </div>
              </div>
            </div>
          ) : null}

          <div className="lg:w-1/2">
            <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
              Tentang Perusahaan
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy mb-6 tracking-tight leading-tight">
              {title}
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed font-light">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border-l-2 border-pgp-red pl-4">
                <div className="font-bold text-pgp-navy mb-1">Visi Kami</div>
                <div className="text-sm text-gray-500">
                  {vision_text}
                </div>
              </div>
              <div className="border-l-2 border-pgp-red pl-4">
                <div className="font-bold text-pgp-navy mb-1">Misi Kami</div>
                <div className="text-sm text-gray-500">
                  {mission_text}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
