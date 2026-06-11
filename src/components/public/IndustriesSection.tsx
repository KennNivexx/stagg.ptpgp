import { ShoppingCart, Store, Factory, Car, Pickaxe, HardHat, Droplets, Laptop } from "lucide-react";

export default function IndustriesSection() {
  const industries = [
    { icon: <ShoppingCart size={24} />, name: "FMCG" },
    { icon: <Store size={24} />, name: "Retail" },
    { icon: <Factory size={24} />, name: "Manufacturing" },
    { icon: <Car size={24} />, name: "Automotive" },
    { icon: <Pickaxe size={24} />, name: "Mining" },
    { icon: <HardHat size={24} />, name: "Construction" },
    { icon: <Droplets size={24} />, name: "Oil & Gas" },
    { icon: <Laptop size={24} />, name: "E-commerce" }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
            Sektor Industri
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy tracking-tight">
            Industri yang Kami Layani
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {industries.map((ind, index) => (
            <div key={index} className="flex flex-col items-center justify-center p-8 bg-[#FCF9F6] rounded-2xl border border-gray-100 hover:border-pgp-red hover:shadow-sm transition-all group">
              <div className="text-gray-400 group-hover:text-pgp-red mb-4 transition-colors">
                {ind.icon}
              </div>
              <div className="text-sm font-bold text-pgp-navy text-center">
                {ind.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
