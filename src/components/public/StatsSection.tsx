"use client";

import { motion } from "framer-motion";

interface StatItem {
  label: string;
  value: string;
  icon?: string;
}

interface StatsProps {
  show?: boolean;
  title?: string;
  stats?: StatItem[];
}

const defaultStats: StatItem[] = [
  { value: "28+", label: "Tahun Pengalaman" },
  { value: "500+", label: "Klien Aktif" },
  { value: "50.000+", label: "Pengiriman" },
  { value: "98%", label: "On-Time Delivery" }
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function StatsSection({
  show = true,
  title = "",
  stats = defaultStats,
}: StatsProps) {
  if (!show) return null;

  const items = stats?.length ? stats : defaultStats;

  return (
    <motion.section
      className="bg-pgp-red py-16"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-10 tracking-tight">
            {title}
          </h2>
        )}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x md:divide-white/20"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {items.map((stat, index) => (
            <motion.div key={index} className="text-center" variants={item}>
              <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-red-200 uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
