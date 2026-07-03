"use client";

import { motion } from "framer-motion";
import { PackageCheck, Truck, Ship, Plane, Warehouse, HardHat, LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  packageCheck: PackageCheck,
  truck: Truck,
  ship: Ship,
  plane: Plane,
  warehouse: Warehouse,
  hardHat: HardHat,
};

interface ServiceItem {
  icon?: string;
  title: string;
  description: string;
  image_url?: string;
}

interface ServicesGridProps {
  show?: boolean;
  title?: string;
  subtitle?: string;
  services?: ServiceItem[];
}

const defaultServices: ServiceItem[] = [
  {
    icon: "packageCheck",
    title: "Freight Forwarding",
    description: "Pengurusan pengiriman ekspor dan impor dengan layanan end-to-end yang efisien."
  },
  {
    icon: "truck",
    title: "Transportasi Darat",
    description: "Layanan trucking komprehensif termasuk FTL (Full Truckload) dan LTL (Less Than Truckload)."
  },
  {
    icon: "ship",
    title: "Pengiriman Laut",
    description: "Opsi angkutan laut mulai dari FCL (Full Container), LCL (Less Container), hingga Break Bulk."
  },
  {
    icon: "plane",
    title: "Pengiriman Udara",
    description: "Pengiriman kargo via udara untuk rute domestik dan internasional yang membutuhkan kecepatan."
  },
  {
    icon: "warehouse",
    title: "Warehousing",
    description: "Fasilitas penyimpanan (gudang) yang aman dengan sistem manajemen distribusi barang modern."
  },
  {
    icon: "hardHat",
    title: "Project Cargo",
    description: "Penanganan khusus untuk barang oversized, kargo berat (heavy equipment), dan logistik proyek."
  }
];

export default function ServicesGridSection({
  show = true,
  title = "Solusi Logistik Terpadu",
  subtitle = "Layanan Kami",
  services = defaultServices,
}: ServicesGridProps) {
  if (!show) return null;

  const items = services?.length ? services : defaultServices;
  const hasImages = items.some(s => s.image_url);

  return (
    <motion.section
      id="services"
      className="py-24 bg-white border-t border-gray-100 scroll-mt-[72px]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div className="max-w-2xl">
            <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
              {subtitle}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy tracking-tight">
              {title}
            </h2>
          </div>
        </div>

        {hasImages ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((service, index) => (
              <div key={index} className="group bg-white border border-zinc-200/40 rounded-3xl overflow-hidden hover:border-pgp-red/40 hover:shadow-md transition-all duration-300">
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={service.image_url || undefined}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-8">
                  <div className="w-12 h-12 bg-white border border-zinc-200/50 shadow-sm text-pgp-red rounded-2xl flex items-center justify-center mb-4">
                    {service.icon && iconMap[service.icon] ? iconMap[service.icon]({ size: 24 }) : <PackageCheck size={24} />}
                  </div>
                  <h3 className="text-xl font-bold text-pgp-navy mb-3">{service.title}</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((service, index) => {
              const IconComponent = service.icon ? iconMap[service.icon] : null;
              return (
                <div key={index} className="group bg-[#FCFBF9] border border-zinc-200/40 rounded-3xl p-8 hover:border-pgp-red/40 hover:shadow-md hover:bg-orange-50/20 transition-all duration-300">
                  <div className="w-16 h-16 bg-white border border-zinc-200/50 shadow-sm text-pgp-red rounded-2xl flex items-center justify-center mb-8 group-hover:bg-pgp-red group-hover:text-white transition-all duration-300">
                    {IconComponent ? <IconComponent size={28} /> : <PackageCheck size={28} />}
                  </div>
                  <h3 className="text-xl font-bold text-pgp-navy mb-4 transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-zinc-600 text-sm leading-relaxed transition-colors duration-300">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.section>
  );
}
