"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Eyebrow } from "./ui/PublicPrimitives";

interface ImageItem {
  url: string;
  caption?: string;
}

interface GalleryProps {
  show?: boolean;
  badge?: string;
  title?: string;
  subtitle?: string;
  images?: ImageItem[];
}

const defaultImages: ImageItem[] = [
  { url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800", caption: "Gudang PGP" },
  { url: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800", caption: "Armada Truk" },
  { url: "https://images.unsplash.com/photo-1494412519320-aa3da3715a41?auto=format&fit=crop&q=80&w=800", caption: "Loading Barang" },
  { url: "https://images.unsplash.com/photo-1551281136-231362e59cd7?auto=format&fit=crop&q=80&w=800", caption: "Kontainer" },
  { url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800", caption: "Pelabuhan" },
  { url: "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&q=80&w=800", caption: "Tim Operasional" }
];

export default function GallerySection({
  show = true,
  badge = "Galeri Operasional",
  title = "Dokumentasi Aktivitas",
  subtitle = "",
  images = defaultImages,
}: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const photos = (images?.length ? images : defaultImages).filter(p => !!p.url);

  const close = useCallback(() => setActiveIndex(null), []);
  const showPrev = useCallback(() => {
    setActiveIndex(i => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);
  const showNext = useCallback(() => {
    setActiveIndex(i => (i === null ? null : (i + 1) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, close, showPrev, showNext]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x > threshold) showPrev();
    else if (info.offset.x < -threshold) showNext();
  };

  if (!show) return null;

  const active = activeIndex !== null ? photos[activeIndex] : null;

  return (
    <motion.section
      className="py-20 lg:py-28 bg-white"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          {badge && <Eyebrow number="06">{badge}</Eyebrow>}
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-[#1A1612] tracking-tight leading-[1.08]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-[#5B5650] text-sm leading-relaxed">{subtitle}</p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="flex flex-col text-left cursor-zoom-in"
            >
              <div className="aspect-square rounded-2xl overflow-hidden shadow-sm group relative">
                <Image
                  src={photo.url}
                  alt={photo.caption || `Gallery ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              {photo.caption && (
                <p className="mt-2 text-xs font-semibold text-gray-500 text-center px-1">{photo.caption}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Tutup"
              className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
            >
              <X size={28} />
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); showPrev(); }}
              aria-label="Sebelumnya"
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); showNext(); }}
              aria-label="Berikutnya"
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
            >
              <ChevronRight size={32} />
            </button>

            <motion.div
              key={activeIndex}
              className="max-w-4xl w-full flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={handleDragEnd}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- lightbox shows the photo at its natural aspect ratio capped by max-h/max-w; fill needs a fixed-size parent and would break the shrink-to-fit sizing */}
              <img
                src={active.url}
                alt={active.caption || "Gallery"}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl select-none"
                draggable={false}
              />
              {active.caption && (
                <p className="mt-4 text-white/80 text-sm font-medium text-center">{active.caption}</p>
              )}
              <p className="mt-1 text-white/40 text-xs">{(activeIndex ?? 0) + 1} / {photos.length}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
