import { MapPin } from "lucide-react";

export default function CoverageSection() {
  const domestik = ["Jakarta", "Surabaya", "Medan", "Makassar", "Balikpapan", "Batam"];
  const internasional = ["Singapura", "Malaysia", "China", "Thailand", "Vietnam", "Timur Tengah"];

  return (
    <section id="coverage" className="py-24 bg-zinc-50 text-pgp-navy overflow-hidden relative border-y border-zinc-200/40">
      {/* Abstract Map Background Placeholder */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-pgp-red font-extrabold text-xs tracking-widest uppercase mb-4 block">
            Cakupan Pengiriman
          </span>
          <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight text-zinc-955">
            Area Layanan
          </h2>
          <p className="text-zinc-900 font-normal">
            Menghubungkan rantai pasok Anda ke seluruh pelosok nusantara hingga pusat bisnis global.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/2 bg-white border border-orange-100/50 rounded-3xl p-10 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-extrabold mb-8 flex items-center gap-3 text-zinc-950">
              <span className="w-9 h-9 rounded-xl bg-orange-50 text-pgp-red flex items-center justify-center border border-orange-100/50"><MapPin size={18}/></span>
              Domestik (Indonesia)
            </h3>
            <ul className="grid grid-cols-2 gap-y-6 gap-x-4">
              {domestik.map((city, idx) => (
                <li key={idx} className="flex items-center gap-3 text-zinc-950 text-sm font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-pgp-red"></div> {city}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:w-1/2 bg-white border border-blue-100/50 rounded-3xl p-10 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-extrabold mb-8 flex items-center gap-3 text-zinc-950">
              <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50"><Globe size={18}/></span>
              Internasional
            </h3>
            <ul className="grid grid-cols-2 gap-y-6 gap-x-4">
              {internasional.map((country, idx) => (
                <li key={idx} className="flex items-center gap-3 text-zinc-950 text-sm font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> {country}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Globe({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
}
