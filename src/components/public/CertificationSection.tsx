import { Shield, Award, FileText, CheckCircle } from "lucide-react";

export default function CertificationSection() {
  const certifications = [
    { name: "NIB", icon: <FileText size={32} /> },
    { name: "NPWP", icon: <FileText size={32} /> },
    { name: "ISO 9001", icon: <Shield size={32} /> },
    { name: "ISO 45001", icon: <CheckCircle size={32} /> },
    { name: "ISO 14001", icon: <Award size={32} /> },
    { name: "Sertifikasi Logistik", icon: <Award size={32} /> }
  ];

  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
            Kepercayaan Anda Prioritas Kami
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy tracking-tight">
            Sertifikasi & Legalitas
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          {certifications.map((cert, index) => (
            <div key={index} className="flex flex-col items-center gap-4 group cursor-default">
              <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center border border-gray-100 group-hover:bg-pgp-red group-hover:text-white group-hover:border-pgp-red group-hover:shadow-lg transition-all duration-300">
                {cert.icon}
              </div>
              <div className="text-sm font-bold text-gray-500 group-hover:text-pgp-navy transition-colors">
                {cert.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
