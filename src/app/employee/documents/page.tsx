import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { BookOpen, FileText, Download, Search, Shield, File, Clipboard } from "lucide-react";

export default async function EmployeeDocuments() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value || "";
  const userName = cookieStore.get("user_name")?.value || "Karyawan";

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, department, position")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const categories = [
    { id: "kontrak", name: "Kontrak & Perjanjian", icon: Clipboard, count: 2 },
    { id: "kebijakan", name: "Kebijakan Perusahaan", icon: Shield, count: 5 },
    { id: "formulir", name: "Formulir", icon: File, count: 8 },
    { id: "sop", name: "SOP", icon: BookOpen, count: 12 },
  ];

  const documents: Record<string, { id: number; title: string; type: string; size: string; date: string }[]> = {
    kontrak: [
      { id: 1, title: "Kontrak Kerja - Sdr/Sdri " + userName, type: "PDF", size: "245 KB", date: "01 Jan 2024" },
      { id: 2, title: "Perjanjian Kerja Bersama (PKB) 2024-2026", type: "PDF", size: "1.2 MB", date: "01 Jan 2024" },
    ],
    kebijakan: [
      { id: 3, title: "Kebijakan Jam Kerja & Lembur", type: "PDF", size: "180 KB", date: "01 Jan 2024" },
      { id: 4, title: "Kebijakan Cuti & Izin", type: "PDF", size: "156 KB", date: "01 Jan 2024" },
      { id: 5, title: "Kebijakan Penggajian & Tunjangan", type: "PDF", size: "210 KB", date: "15 Mar 2024" },
      { id: 6, title: "Kebijakan K3 & Keselamatan Kerja", type: "PDF", size: "340 KB", date: "01 Jan 2024" },
      { id: 7, title: "Kebijakan Penggunaan Aset IT", type: "PDF", size: "125 KB", date: "01 Mar 2024" },
    ],
    formulir: [
      { id: 8, title: "Formulir Pengajuan Cuti", type: "DOCX", size: "85 KB", date: "01 Jan 2024" },
      { id: 9, title: "Formulir Lembur", type: "XLSX", size: "45 KB", date: "01 Jan 2024" },
      { id: 10, title: "Formulir Klaim Biaya Perjalanan Dinas", type: "XLSX", size: "62 KB", date: "01 Feb 2024" },
      { id: 11, title: "Formulir Permohonan Pelatihan", type: "DOCX", size: "78 KB", date: "01 Mar 2024" },
      { id: 12, title: "Formulir Izin Tidak Masuk", type: "DOCX", size: "55 KB", date: "01 Jan 2024" },
      { id: 13, title: "Formulir Data Diri Karyawan", type: "PDF", size: "95 KB", date: "01 Jan 2024" },
      { id: 14, title: "Formulir Evaluasi Kinerja Mandiri", type: "DOCX", size: "88 KB", date: "01 Apr 2024" },
      { id: 15, title: "Formulir Permintaan ATK", type: "XLSX", size: "42 KB", date: "01 Jan 2024" },
    ],
    sop: [
      { id: 16, title: "SOP Penerimaan Barang di Gudang", type: "PDF", size: "320 KB", date: "10 Jun 2026" },
      { id: 17, title: "SOP Pengiriman & Ekspedisi", type: "PDF", size: "280 KB", date: "05 Jun 2026" },
      { id: 18, title: "SOP Keselamatan Kerja Lapangan", type: "PDF", size: "450 KB", date: "01 Jun 2026" },
      { id: 19, title: "SOP Penggunaan APAR", type: "PDF", size: "195 KB", date: "10 Mei 2026" },
      { id: 20, title: "SOP Absensi & Check-in Digital", type: "PDF", size: "150 KB", date: "20 Mei 2026" },
      { id: 21, title: "SOP Pengoperasian Forklift", type: "PDF", size: "510 KB", date: "05 Mei 2026" },
      { id: 22, title: "SOP Bongkar Muat Kontainer", type: "PDF", size: "380 KB", date: "01 Mei 2026" },
      { id: 23, title: "SOP Prosedur Evakuasi Darurat", type: "PDF", size: "275 KB", date: "15 Apr 2026" },
      { id: 24, title: "SOP Pemeliharaan Kendaraan Operasional", type: "PDF", size: "230 KB", date: "10 Apr 2026" },
      { id: 25, title: "SOP Administrasi Kepegawaian", type: "PDF", size: "180 KB", date: "01 Apr 2026" },
      { id: 26, title: "SOP Pengadaan Barang & Jasa", type: "PDF", size: "350 KB", date: "28 Mar 2026" },
      { id: 27, title: "SOP Manajemen Inventori", type: "PDF", size: "290 KB", date: "15 Mar 2026" },
    ],
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">SOP & Dokumen</h1>
        <p className="text-sm text-gray-500">Akses dokumen resmi, SOP, dan formulir perusahaan.</p>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari dokumen..."
          className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-[#CC0000] rounded-xl group-hover:scale-110 transition-transform">
                <cat.icon size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{cat.name}</p>
                <p className="text-[10px] text-slate-400">{cat.count} dokumen</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {Object.entries(documents).map(([key, docs]) => (
          <div key={key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">
                {categories.find((c) => c.id === key)?.name || key}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{docs.length} dokumen tersedia</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Dokumen</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipe</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ukuran</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                    <th className="text-right px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unduh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {docs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-red-50 text-red-600 rounded-md">
                            <FileText size={14} />
                          </div>
                          <span className="text-xs font-semibold text-slate-800">{doc.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          doc.type === "PDF" ? "bg-red-50 text-red-700" :
                          doc.type === "DOCX" ? "bg-blue-50 text-blue-700" :
                          "bg-emerald-50 text-emerald-700"
                        }`}>{doc.type}</span>
                      </td>
                      <td className="px-6 py-3 text-[10px] text-slate-500">{doc.size}</td>
                      <td className="px-6 py-3 text-[10px] text-slate-500">{doc.date}</td>
                      <td className="px-6 py-3 text-right">
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors" title="Unduh Dokumen">
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
