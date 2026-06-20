import { Target, Eye, Heart, Award, Users, MapPin, Phone, Mail, Globe } from "lucide-react";

const VALUES = [
  { title: "Integritas", desc: "Kami menjunjung tinggi kejujuran dan transparansi dalam setiap tindakan dan keputusan.", icon: Heart },
  { title: "Profesionalisme", desc: "Standar kerja yang tinggi dan dedikasi penuh menjadi landasan setiap pekerjaan kami.", icon: Award },
  { title: "Kerjasama Tim", desc: "Kami percaya bahwa keberhasilan terbaik dicapai melalui kolaborasi yang solid.", icon: Users },
  { title: "Inovasi", desc: "Kami terus beradaptasi dan berinovasi untuk memberikan solusi terbaik bagi klien.", icon: Target },
];

const DEPARTMENTS = [
  "HR & General Affairs",
  "Finance & Accounting",
  "Operational Division",
  "Procurement Division",
  "Project Appraisal",
  "Management Representative",
  "Health, Safety & Environment",
];

export default function CompanyInfoPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Info Perusahaan</h1>
        <p className="text-sm text-gray-500">Kenali PT Pratama Galuh Perkasa lebih dalam.</p>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1A2530] to-slate-700 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-[#CC0000] rounded-2xl flex items-center justify-center font-extrabold text-xl shrink-0">
            PGP
          </div>
          <div>
            <h2 className="text-xl font-extrabold">PT Pratama Galuh Perkasa</h2>
            <p className="text-slate-300 text-sm mt-0.5">Perusahaan Jasa Logistik & Operasional Terpercaya</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          PT Pratama Galuh Perkasa adalah perusahaan yang bergerak di bidang jasa logistik, pengangkutan, dan operasional yang telah berpengalaman melayani berbagai klien di industri energi, pertambangan, dan konstruksi. Kami berkomitmen memberikan layanan berkualitas tinggi dengan mengutamakan keselamatan, efisiensi, dan kepuasan klien.
        </p>
      </div>

      {/* Visi & Misi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#CC0000]/10 rounded-xl">
              <Eye size={18} className="text-[#CC0000]" />
            </div>
            <h3 className="font-extrabold text-slate-800">Visi</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Menjadi perusahaan logistik dan operasional terkemuka di Indonesia yang dipercaya oleh klien dan menjadi pilihan utama para profesional terbaik.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <Target size={18} className="text-blue-600" />
            </div>
            <h3 className="font-extrabold text-slate-800">Misi</h3>
          </div>
          <ul className="text-sm text-slate-600 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2"><span className="text-[#CC0000] font-bold mt-0.5">•</span>Memberikan layanan berkualitas tinggi dengan standar internasional.</li>
            <li className="flex items-start gap-2"><span className="text-[#CC0000] font-bold mt-0.5">•</span>Mengembangkan SDM yang kompeten, berintegritas, dan berdedikasi.</li>
            <li className="flex items-start gap-2"><span className="text-[#CC0000] font-bold mt-0.5">•</span>Menerapkan sistem manajemen K3 yang ketat di setiap operasional.</li>
            <li className="flex items-start gap-2"><span className="text-[#CC0000] font-bold mt-0.5">•</span>Membangun kemitraan jangka panjang yang saling menguntungkan.</li>
          </ul>
        </div>
      </div>

      {/* Nilai Perusahaan */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800">Nilai-Nilai Perusahaan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Fondasi budaya kerja kami sehari-hari</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {VALUES.map(({ title, desc, icon: Icon }) => (
            <div key={title} className="flex gap-4">
              <div className="p-2.5 bg-slate-50 rounded-xl shrink-0 h-fit">
                <Icon size={16} className="text-[#CC0000]" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Departemen */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800">Struktur Departemen</h3>
          <p className="text-xs text-slate-400 mt-0.5">Unit bisnis yang ada di PT Pratama Galuh Perkasa</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEPARTMENTS.map((dept) => (
            <div key={dept} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-[#CC0000] shrink-0" />
              <span className="text-sm font-medium text-slate-700">{dept}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keuntungan bergabung */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800">Mengapa Bergabung Bersama Kami?</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              "Gaji kompetitif sesuai standar industri",
              "BPJS Kesehatan & Ketenagakerjaan",
              "Tunjangan transportasi & makan",
              "Program pelatihan & pengembangan karir",
              "Lingkungan kerja yang suportif",
              "Kesempatan promosi yang jelas",
              "Fasilitas kerja lengkap",
              "Budaya kerja yang positif & profesional",
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span>
                <span className="text-slate-600">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kontak */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800">Kontak Perusahaan</h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: MapPin, label: "Alamat", value: "Jakarta Utara, DKI Jakarta, Indonesia" },
            { icon: Phone, label: "Telepon", value: "(021) XXXX-XXXX" },
            { icon: Mail, label: "Email HRD", value: "hrga@ptpgp.co.id" },
            { icon: Globe, label: "Website", value: "www.ptpgp.co.id" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 rounded-lg shrink-0">
                <Icon size={14} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                <p className="text-sm text-slate-700 font-medium mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
