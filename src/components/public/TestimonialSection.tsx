"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

interface TestimonialItem {
  name: string;
  role?: string;
  company?: string;
  quote?: string;
  text?: string;
  avatar?: string;
}

interface TestimonialProps {
  show?: boolean;
  title?: string;
  testimonials?: TestimonialItem[];
}

const defaultTestimonials: TestimonialItem[] = [
  {
    text: "Pengiriman selalu tepat waktu dan tim sangat responsif dalam menangani setiap kendala di lapangan.",
    name: "Budi Haryanto",
    company: "PT Global Manufacturing"
  },
  {
    text: "Partner logistik terpercaya untuk kebutuhan ekspor-impor perusahaan kami. Sangat profesional.",
    name: "Sarah Wijaya",
    company: "Retail Nusantara"
  }
];

export default function TestimonialSection({
  show = true,
  title = "Apa Kata Mereka?",
  testimonials = defaultTestimonials,
}: TestimonialProps) {
  if (!show) return null;

  const items = testimonials?.length ? testimonials : defaultTestimonials;

  return (
    <motion.section
      className="py-24 bg-[#FCF9F6] text-pgp-navy"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
            Testimoni Klien
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-pgp-navy">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((t, index) => {
            const content = t.quote || t.text || "";
            return (
              <div key={index} className="bg-zinc-50/70 border border-zinc-100 p-10 rounded-3xl relative shadow-sm hover:shadow-md transition-shadow">
                <Quote size={40} className="text-pgp-red/15 absolute top-8 right-8" />
                <p className="text-lg md:text-xl text-zinc-600 font-light leading-relaxed mb-8 italic relative z-10">
                  &ldquo;{content}&rdquo;
                </p>
                <div>
                  <div className="font-bold text-pgp-navy">{t.name}</div>
                  {(t.company || t.role) && (
                    <div className="text-xs text-zinc-400 font-semibold uppercase tracking-widest mt-1">
                      {[t.role, t.company].filter(Boolean).join(" — ")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
