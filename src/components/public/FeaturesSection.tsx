import { Truck, MapPin, Clock, ShieldCheck, Globe, Headset } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: <Truck size={24} />,
      title: "Armada Lengkap",
      description: "Beragam jenis truk dan kendaraan angkut modern yang siap menyesuaikan dengan kapasitas dan jenis kargo Anda."
    },
    {
      icon: <MapPin size={24} />,
      title: "Tracking Pengiriman",
      description: "Sistem pemantauan real-time yang memungkinkan Anda melacak status perjalanan kargo kapan saja."
    },
    {
      icon: <Clock size={24} />,
      title: "Tepat Waktu",
      description: "Komitmen kami untuk memberikan jaminan estimasi waktu pengiriman (SLA) yang akurat dan dapat diandalkan."
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Asuransi Cargo",
      description: "Perlindungan asuransi komprehensif untuk memastikan barang Anda aman dari risiko selama dalam perjalanan."
    },
    {
      icon: <Globe size={24} />,
      title: "Jaringan Nasional",
      description: "Cakupan operasional luas yang menghubungkan berbagai kota besar, pelabuhan, dan kawasan industri di Indonesia."
    },
    {
      icon: <Headset size={24} />,
      title: "Customer Support Responsif",
      description: "Tim layanan pelanggan kami siap membantu Anda 24/7 untuk memastikan kelancaran proses logistik."
    }
  ];

  return (
    <section className="py-24 bg-[#FCF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
            Mengapa Memilih Kami
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy tracking-tight">
            Keunggulan Layanan PGP
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 bg-red-50 text-pgp-red rounded-xl flex items-center justify-center mb-6 group-hover:bg-pgp-red group-hover:text-white transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-pgp-navy mb-3">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
