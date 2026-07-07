"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";

interface TestimonialItem {
  name: string;
  role?: string;
  company?: string;
  quote?: string;
  text?: string;
  avatar_url?: string;
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
  const [active, setActive] = useState(0);
  const total = items.length;

  const next = useCallback(() => setActive((p) => (p + 1) % total), [total]);
  const prev = useCallback(() => setActive((p) => (p - 1 + total) % total), [total]);

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [total, next]);

  return (
    <motion.section
      className="py-24 bg-[#FCF9F6] text-pgp-navy"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
            Testimoni Klien
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-pgp-navy">
            {title}
          </h2>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {items.map((t, index) => {
              if (index !== active) return null;
              const content = t.quote || t.text || "";
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="bg-zinc-50/70 border border-zinc-100 p-10 rounded-3xl relative shadow-sm mx-auto max-w-2xl text-center"
                >
                  <Quote size={48} className="text-pgp-red/10 absolute top-8 left-1/2 -translate-x-1/2" />
                  <p className="text-lg md:text-xl text-zinc-600 font-light leading-relaxed mb-8 italic relative z-10 pt-8">
                    &ldquo;{content}&rdquo;
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {t.avatar_url && (
                      <Image
                        src={t.avatar_url}
                        alt={t.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover shrink-0"
                      />
                    )}
                    <div className="text-left">
                      <div className="font-bold text-pgp-navy">{t.name}</div>
                      {(t.company || t.role) && (
                        <div className="text-xs text-zinc-400 font-semibold uppercase tracking-widest mt-1">
                          {[t.role, t.company].filter(Boolean).join(" — ")}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {total > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={prev} className="w-10 h-10 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center transition-colors">
                <ChevronLeft size={18} className="text-zinc-500" />
              </button>
              <div className="flex gap-2">
                {items.map((_, i) => (
                  <button key={i} onClick={() => setActive(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === active ? "bg-pgp-red w-6" : "bg-zinc-300 hover:bg-zinc-400"}`}
                  />
                ))}
              </div>
              <button onClick={next} className="w-10 h-10 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center transition-colors">
                <ChevronRight size={18} className="text-zinc-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
