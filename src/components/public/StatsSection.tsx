export default function StatsSection() {
  const stats = [
    { value: "28+", label: "Tahun Pengalaman" },
    { value: "500+", label: "Klien Aktif" },
    { value: "50.000+", label: "Pengiriman" },
    { value: "98%", label: "On-Time Delivery" }
  ];

  return (
    <section className="bg-pgp-red py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-red-200 uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
