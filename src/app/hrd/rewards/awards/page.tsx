import { supabaseAdmin } from "@/lib/supabase";
import { Trophy, Plus, Star, Award, Medal, Clock, CheckCircle } from "lucide-react";

export default async function AwardsPage() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .limit(100);

  const awardCategories = [
    { id: 1, name: "Employee of the Month", icon: Star, description: "Karyawan terbaik setiap bulannya", color: "bg-amber-50 text-amber-600", borderColor: "border-amber-200" },
    { id: 2, name: "Best Performance", icon: Award, description: "Pencapaian kinerja tertinggi", color: "bg-emerald-50 text-emerald-600", borderColor: "border-emerald-200" },
    { id: 3, name: "Long Service Award", icon: Clock, description: "Pengabdian 5+ tahun", color: "bg-blue-50 text-blue-600", borderColor: "border-blue-200" },
    { id: 4, name: "Innovation Award", icon: Medal, description: "Inovasi & ide kreatif", color: "bg-purple-50 text-purple-600", borderColor: "border-purple-200" },
  ];

  const awardsHistory = [
    { id: 1, employee: "Budi Santoso", department: "Operasional", category: "Employee of the Month", date: "Mei 2026", description: "Pencapaian target pengiriman 100% tepat waktu" },
    { id: 2, employee: "Siti Rahayu", department: "Keuangan", category: "Best Performance", date: "Q1 2026", description: "Menyelesaikan audit keuangan dengan hasil excellent" },
    { id: 3, employee: "Rudi Hartono", department: "Operasional", category: "Long Service Award", date: "Jan 2026", description: "10 tahun pengabdian di PT Pratama Galuh Perkasa" },
    { id: 4, employee: "Dewi Lestari", department: "IT", category: "Innovation Award", date: "Apr 2026", description: "Mengembangkan sistem tracking armada digital" },
    { id: 5, employee: "Ahmad Fauzi", department: "Operasional", category: "Employee of the Month", date: "April 2026", description: "Zero accident selama 12 bulan berturut-turut" },
    { id: 6, employee: "Dian Permata", department: "SDM", category: "Best Performance", date: "Q4 2025", description: "Berhasil merekrut 50 karyawan dalam 3 bulan" },
    { id: 7, employee: "Sari Indah", department: "Keuangan", category: "Long Service Award", date: "Des 2025", description: "5 tahun pengabdian di divisi keuangan" },
    { id: 8, employee: "Hendra Gunawan", department: "IT", category: "Innovation Award", date: "Mar 2026", description: "Implementasi sistem paperless office" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Penghargaan Karyawan</h1>
          <p className="text-sm text-gray-500">Kelola penghargaan dan apresiasi untuk karyawan berprestasi.</p>
        </div>
        <button className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Nominasi Karyawan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {awardCategories.map((cat) => (
          <div key={cat.id} className={`bg-white p-5 rounded-2xl border ${cat.borderColor} shadow-sm hover:shadow-md transition-all cursor-pointer`}>
            <div className="flex items-start justify-between">
              <div className={`p-2.5 ${cat.color} rounded-xl`}>
                <cat.icon size={20} />
              </div>
              <span className="text-[9px] font-bold text-slate-400">{awardsHistory.filter((a) => a.category === cat.name).length} penerima</span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 mt-3">{cat.name}</h3>
            <p className="text-[10px] text-slate-500 mt-1">{cat.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" />
                Riwayat Penghargaan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Daftar karyawan yang telah menerima penghargaan</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {awardsHistory.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {a.employee.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{a.employee}</p>
                          <p className="text-[10px] text-slate-400">{a.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        a.category === "Employee of the Month" ? "bg-amber-50 text-amber-700" :
                        a.category === "Best Performance" ? "bg-emerald-50 text-emerald-700" :
                        a.category === "Long Service Award" ? "bg-blue-50 text-blue-700" :
                        "bg-purple-50 text-purple-700"
                      }`}>
                        {a.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{a.date}</td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">{a.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Form Nominasi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ajukan nominasi penghargaan</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</label>
              <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                <option value="">Pilih Karyawan</option>
                {employees?.map((e: Record<string, unknown>) => (
                  <option key={e.id as string} value={e.id as string}>{e.full_name as string}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori Penghargaan</label>
              <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                <option value="">Pilih Kategori</option>
                {awardCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alasan Nominasi</label>
              <textarea rows={3} placeholder="Jelaskan alasan nominasi..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
            </div>
            <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
              <CheckCircle size={14} /> Ajukan Nominasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
