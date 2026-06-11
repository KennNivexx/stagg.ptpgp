import { PackageCheck, Truck, Ship, Plane, Warehouse, HardHat } from "lucide-react";

export default function ServicesGridSection() {
  const services = [
    {
      icon: <PackageCheck size={28} />,
      title: "Freight Forwarding",
      description: "Pengurusan pengiriman ekspor dan impor dengan layanan end-to-end yang efisien."
    },
    {
      icon: <Truck size={28} />,
      title: "Transportasi Darat",
      description: "Layanan trucking komprehensif termasuk FTL (Full Truckload) dan LTL (Less Than Truckload)."
    },
    {
      icon: <Ship size={28} />,
      title: "Pengiriman Laut",
      description: "Opsi angkutan laut mulai dari FCL (Full Container), LCL (Less Container), hingga Break Bulk."
    },
    {
      icon: <Plane size={28} />,
      title: "Pengiriman Udara",
      description: "Pengiriman kargo via udara untuk rute domestik dan internasional yang membutuhkan kecepatan."
    },
    {
      icon: <Warehouse size={28} />,
      title: "Warehousing",
      description: "Fasilitas penyimpanan (gudang) yang aman dengan sistem manajemen distribusi barang modern."
    },
    {
      icon: <HardHat size={28} />,
      title: "Project Cargo",
      description: "Penanganan khusus untuk barang oversized, kargo berat (heavy equipment), dan logistik proyek."
    }
  ];

  return (
    <section id="services" className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div className="max-w-2xl">
            <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
              Layanan Kami
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy tracking-tight">
              Solusi Logistik Terpadu
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div key={index} className="group bg-[#FCFBF9] border border-zinc-200/40 rounded-3xl p-8 hover:border-pgp-red/40 hover:shadow-md hover:bg-orange-50/20 transition-all duration-300">
              <div className="w-16 h-16 bg-white border border-zinc-200/50 shadow-sm text-pgp-red rounded-2xl flex items-center justify-center mb-8 group-hover:bg-pgp-red group-hover:text-white transition-all duration-300">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-pgp-navy mb-4 transition-colors duration-300">
                {service.title}
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed transition-colors duration-300">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
