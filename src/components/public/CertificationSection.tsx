import { Shield, Award, FileText, CheckCircle, LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  shield: Shield,
  award: Award,
  fileText: FileText,
  checkCircle: CheckCircle,
};

interface CertItem {
  name: string;
  issuer?: string;
  logo?: string;
  icon?: string;
}

interface CertificationProps {
  show?: boolean;
  title?: string;
  subtitle?: string;
  certifications?: CertItem[];
}

const defaultCertifications: CertItem[] = [
  { name: "ISO 9001", icon: "shield" },
  { name: "ISO 45001", icon: "checkCircle" },
  { name: "ISO 14001", icon: "award" },
  { name: "Sertifikasi Logistik", icon: "award" },
];

const legalItems: CertItem[] = [
  { name: "NIB", icon: "fileText" },
  { name: "NPWP", icon: "fileText" },
];

export default function CertificationSection({
  show = true,
  title = "Sertifikasi & Legalitas",
  subtitle = "Kepercayaan Anda Prioritas Kami",
  certifications = defaultCertifications,
}: CertificationProps) {
  if (!show) return null;

  const items = certifications?.length ? certifications : defaultCertifications;

  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-pgp-red font-bold text-xs tracking-widest uppercase mb-4 block">
            {subtitle}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-pgp-navy tracking-tight">
            {title}
          </h2>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sertifikasi</h3>
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-16">
          {items.map((cert, index) => {
            const IconComponent = cert.icon ? iconMap[cert.icon] : null;
            return (
              <div key={index} className="flex flex-col items-center gap-4 group cursor-default">
                {cert.logo ? (
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 group-hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <img src={cert.logo || undefined} alt={cert.name} className="w-12 h-12 object-contain" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center border border-gray-100 group-hover:bg-pgp-red group-hover:text-white group-hover:border-pgp-red group-hover:shadow-lg transition-all duration-300">
                    {IconComponent ? <IconComponent size={32} /> : <Award size={32} />}
                  </div>
                )}
                <div className="text-sm font-bold text-gray-500 group-hover:text-pgp-navy transition-colors text-center">
                  {cert.name}
                  {cert.issuer && (
                    <span className="block text-xs font-normal text-gray-400 mt-1">{cert.issuer}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-100 pt-10">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legalitas Perusahaan</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {legalItems.map((cert, index) => {
              const IconComponent = cert.icon ? iconMap[cert.icon] : null;
              return (
                <div key={index} className="flex flex-col items-center gap-4 group cursor-default">
                  <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center border border-gray-100 group-hover:bg-pgp-navy group-hover:text-white group-hover:border-pgp-navy group-hover:shadow-lg transition-all duration-300">
                    {IconComponent ? <IconComponent size={32} /> : <Award size={32} />}
                  </div>
                  <div className="text-sm font-bold text-gray-500 group-hover:text-pgp-navy transition-colors text-center">
                    {cert.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
