import { Shield, Search, Calendar, FileText, Filter } from "lucide-react";

export default async function PoliciesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const activeCategory = params.category || "Semua";

  const policyCategories = ["Semua", "Kepegawaian", "Keuangan", "Operasional", "IT", "HSE"];

  const policyData = [
    { id: 1, title: "Kebijakan Jam Kerja & Lembur", category: "Kepegawaian", effectiveDate: "01 Jan 2024", revision: "Rev. 3", description: "Aturan jam kerja, lembur, dan kompensasi waktu karyawan." },
    { id: 2, title: "Kebijakan Cuti & Izin", category: "Kepegawaian", effectiveDate: "01 Jan 2024", revision: "Rev. 2", description: "Ketentuan cuti tahunan, sakit, khusus, dan izin tidak masuk." },
    { id: 3, title: "Kebijakan Penggajian & Tunjangan", category: "Keuangan", effectiveDate: "15 Mar 2024", revision: "Rev. 5", description: "Struktur gaji, komponen tunjangan, dan jadwal pembayaran." },
    { id: 4, title: "Kebijakan Perjalanan Dinas", category: "Keuangan", effectiveDate: "01 Feb 2024", revision: "Rev. 1", description: "Ketentuan perjalanan dinas, akomodasi, dan penggantian biaya." },
    { id: 5, title: "Kebijakan Keselamatan Kerja", category: "HSE", effectiveDate: "01 Jan 2024", revision: "Rev. 4", description: "Prosedur K3, alat pelindung diri, dan pelaporan insiden." },
    { id: 6, title: "Kebijakan Penggunaan Aset IT", category: "IT", effectiveDate: "01 Mar 2024", revision: "Rev. 2", description: "Penggunaan perangkat, email perusahaan, dan keamanan data." },
    { id: 7, title: "Kebijakan Pengadaan Barang", category: "Operasional", effectiveDate: "01 Apr 2024", revision: "Rev. 1", description: "Prosedur pengadaan, vendor selection, dan persetujuan pembelian." },
    { id: 8, title: "Kebijakan Disiplin & Sanksi", category: "Kepegawaian", effectiveDate: "01 Jan 2024", revision: "Rev. 3", description: "Ketentuan disiplin kerja, pelanggaran, dan jenis sanksi." },
    { id: 9, title: "Kebijakan Lingkungan Hidup", category: "HSE", effectiveDate: "15 Jan 2024", revision: "Rev. 1", description: "Komitmen perusahaan terhadap kelestarian lingkungan." },
    { id: 10, title: "Kebijakan Keamanan Data", category: "IT", effectiveDate: "01 Mar 2024", revision: "Rev. 2", description: "Perlindungan data perusahaan, karyawan, dan pelanggan." },
  ];

  const filteredPolicies = activeCategory === "Semua" ? policyData : policyData.filter((p) => p.category === activeCategory);

  const categoryColorMap: Record<string, string> = {
    Kepegawaian: "bg-blue-50 text-blue-700",
    Keuangan: "bg-emerald-50 text-emerald-700",
    Operasional: "bg-amber-50 text-amber-700",
    IT: "bg-purple-50 text-purple-700",
    HSE: "bg-red-50 text-red-700",
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Kebijakan Perusahaan</h1>
        <p className="text-sm text-gray-500">Kebijakan dan aturan resmi PT Pratama Galuh Perkasa.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kebijakan..."
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400" />
          {policyCategories.map((cat) => {
            const href = cat === "Semua" ? "?" : `?category=${encodeURIComponent(cat)}`;
            const active = "px-4 py-2 rounded-xl text-xs font-bold bg-pgp-red text-white shadow-sm";
            const inactive = "px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200";
            return (
              <a
                key={cat}
                href={href}
                className={activeCategory === cat ? active : inactive}
              >
                {cat}
              </a>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPolicies.map((policy) => (
          <div key={policy.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                <FileText size={20} />
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${categoryColorMap[policy.category] || "bg-slate-50 text-slate-600"}`}>
                {policy.category}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-2 group-hover:text-[#CC0000] transition-colors">
              {policy.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">{policy.description}</p>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium pt-4 border-t border-slate-50">
              <span className="flex items-center gap-1"><Calendar size={10} /> Berlaku: {policy.effectiveDate}</span>
              <span className="flex items-center gap-1"><Shield size={10} /> {policy.revision}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
