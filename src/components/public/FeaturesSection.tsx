"use client";

import { motion } from "framer-motion";
import { Truck, MapPin, Clock, ShieldCheck, Globe, Headset, LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  truck: Truck,
  mapPin: MapPin,
  clock: Clock,
  shieldCheck: ShieldCheck,
  globe: Globe,
  headset: Headset,
};

interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
}

interface FeaturesProps {
  show?: boolean;
  title?: string;
  subtitle?: string;
  features?: FeatureItem[];
}

const defaultFeatures: FeatureItem[] = [
  {
    icon: "truck",
    title: "Armada Lengkap",
    description: "Beragam jenis truk dan kendaraan angkut modern yang siap menyesuaikan dengan kapasitas dan jenis kargo Anda."
  },
  {
    icon: "mapPin",
    title: "Tracking Pengiriman",
    description: "Sistem pemantauan real-time yang memungkinkan Anda melacak status perjalanan kargo kapan saja."
  },
  {
    icon: "clock",
    title: "Tepat Waktu",
    description: "Komitmen kami untuk memberikan jaminan estimasi waktu pengiriman (SLA) yang akurat dan dapat diandalkan."
  },
  {
    icon: "shieldCheck",
    title: "Asuransi Cargo",
    description: "Perlindungan asuransi komprehensif untuk memastikan barang Anda aman dari risiko selama dalam perjalanan."
  },
  {
    icon: "globe",
    title: "Jaringan Nasional",
    description: "Cakupan operasional luas yang menghubungkan berbagai kota besar, pelabuhan, dan kawasan industri di Indonesia."
  },
  {
    icon: "headset",
    title: "Customer Support Responsif",
    description: "Tim layanan pelanggan kami siap membantu Anda 24/7 untuk memastikan kelancaran proses logistik."
  }
];

export default function FeaturesSection({
  show = true,
  title = "Keunggulan Layanan PGP",
  subtitle = "Mengapa Memilih Kami",
  features = defaultFeatures,
}: FeaturesProps) {
  if (!show) return null;

  const items = features?.length ? features : defaultFeatures;

  return (
    <motion.section
      className="py-24 bg-[#FCF9F6]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
            {subtitle}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy tracking-tight">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((feature, index) => {
            const IconComponent = feature.icon ? iconMap[feature.icon] : null;
            const col = index % 3;
            const fromX = col === 0 ? -40 : col === 2 ? 40 : 0;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: fromX }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2, delay: 0 } }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow group"
              >
                <div className="w-14 h-14 bg-red-50 text-pgp-red rounded-xl flex items-center justify-center mb-6 group-hover:bg-pgp-red group-hover:text-white transition-colors">
                  {IconComponent ? <IconComponent size={24} /> : <Truck size={24} />}
                </div>
                <h3 className="text-xl font-bold text-pgp-navy mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
