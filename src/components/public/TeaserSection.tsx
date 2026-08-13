"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Eyebrow } from "./ui/PublicPrimitives";

interface TeaserProps {
  career_badge?: string;
  career_title?: string;
  career_description?: string;
  career_link_text?: string;
  career_href?: string;
  career_image_url?: string;
  epro_badge?: string;
  epro_title?: string;
  epro_description?: string;
  epro_link_text?: string;
  epro_href?: string;
  epro_image_url?: string;
}

export default function TeaserSection({
  career_badge = "Peluang Karir",
  career_title = "Karir di Pratama Galuh Perkasa",
  career_description = "Kami percaya bahwa sumber daya manusia adalah kunci keberhasilan. Oleh karena itu, kami menyediakan berbagai peluang karir bagi individu dinamis yang memiliki semangat untuk berkembang bersama.",
  career_link_text = "Lihat Lowongan Tersedia",
  career_href = "/career",
  career_image_url = "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800",
}: TeaserProps) {
  return (
    <section className="py-20 lg:py-28 bg-[#F7F3EE]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 space-y-16 lg:space-y-32">
        {/* Career Banner */}
        <motion.div
          className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24"
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="lg:w-1/2 flex flex-col justify-center">
            <Eyebrow number="11">{career_badge}</Eyebrow>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1612] mb-6 leading-[1.08] tracking-tight">
              {career_title}
            </h2>
            <p className="text-base md:text-lg text-[#5B5650] mb-10 leading-relaxed max-w-lg">
              {career_description}
            </p>
            <div>
              <Link
                href={career_href}
                className="group inline-flex items-center gap-3 text-[#1A1612] font-bold text-sm hover:text-pgp-red transition-colors"
              >
                {career_link_text}
                <span className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:bg-pgp-red group-hover:text-white transition-all">
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="relative aspect-video lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
              <Image src={career_image_url} alt={career_title} fill unoptimized className="object-cover" />
            </div>
          </div>
        </motion.div>

        {/* E-Procurement Banner hidden from public site per request; props kept for CMS settings compatibility. */}
      </div>
    </section>
  );
}
