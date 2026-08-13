"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Store, Factory, Car, Pickaxe, HardHat, Droplets, Laptop, LucideIcon } from "lucide-react";
import LogoLoop from "./LogoLoop";
import { Eyebrow } from "./ui/PublicPrimitives";

const iconMap: Record<string, LucideIcon> = {
  shoppingCart: ShoppingCart,
  store: Store,
  factory: Factory,
  car: Car,
  pickaxe: Pickaxe,
  hardHat: HardHat,
  droplets: Droplets,
  laptop: Laptop,
};

interface IndustryItem {
  name: string;
  icon?: string;
  description?: string;
}

interface IndustriesProps {
  show?: boolean;
  title?: string;
  subtitle?: string;
  industries?: IndustryItem[];
}

const defaultIndustries: IndustryItem[] = [
  { icon: "shoppingCart", name: "FMCG" },
  { icon: "store", name: "Retail" },
  { icon: "factory", name: "Manufacturing" },
  { icon: "car", name: "Automotive" },
  { icon: "pickaxe", name: "Mining" },
  { icon: "hardHat", name: "Construction" },
  { icon: "droplets", name: "Oil & Gas" },
  { icon: "laptop", name: "E-commerce" }
];

export default function IndustriesSection({
  show = true,
  title = "Industri yang Kami Layani",
  subtitle = "Sektor Industri",
  industries = defaultIndustries,
}: IndustriesProps) {
  if (!show) return null;

  const items = industries?.length ? industries : defaultIndustries;

  const loopLogos = items.map((ind) => {
    const Icon = ind.icon ? iconMap[ind.icon] : Factory;
    return {
      node: (
        <div className="flex flex-col items-center gap-3 px-8 py-6 bg-[#FCF9F6] border border-gray-200 rounded-3xl mx-2 hover:border-pgp-red hover:shadow-md transition-all">
          <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm">
            <Icon size={32} className="text-pgp-red" />
          </div>
          <span className="text-base font-bold text-pgp-navy">{ind.name}</span>
        </div>
      ),
      title: ind.name,
    };
  });

  return (
    <motion.section
      className="py-24 bg-white"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
          <Eyebrow number="05">{subtitle}</Eyebrow>
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-[#1A1612] tracking-tight leading-[1.08]">
            {title}
          </h2>
          <p className="text-sm text-[#8A8478] mt-3">
            Berpengalaman melayani berbagai sektor industri di seluruh Indonesia
          </p>
        </div>

        <div className="relative overflow-hidden" style={{ height: 160 }}>
          <LogoLoop
            logos={loopLogos}
            speed={50}
            direction="left"
            logoHeight={130}
            gap={16}
            hoverSpeed={15}
            fadeOut
            fadeOutColor="#ffffff"
            ariaLabel="Industri yang dilayani"
          />
        </div>
      </div>
    </motion.section>
  );
}
