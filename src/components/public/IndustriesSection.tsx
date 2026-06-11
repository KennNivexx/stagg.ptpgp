import { ShoppingCart, Store, Factory, Car, Pickaxe, HardHat, Droplets, Laptop, LucideIcon } from "lucide-react";

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

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
            {subtitle}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy tracking-tight">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((ind, index) => {
            const IconComponent = ind.icon ? iconMap[ind.icon] : null;
            return (
              <div key={index} className="flex flex-col items-center justify-center p-8 bg-[#FCF9F6] rounded-2xl border border-gray-100 hover:border-pgp-red hover:shadow-sm transition-all group">
                <div className="text-gray-400 group-hover:text-pgp-red mb-4 transition-colors">
                  {IconComponent ? <IconComponent size={24} /> : <Factory size={24} />}
                </div>
                <div className="text-sm font-bold text-pgp-navy text-center">
                  {ind.name}
                </div>
                {ind.description && (
                  <p className="text-xs text-gray-400 text-center mt-2">{ind.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
