import { supabaseAdmin } from "@/lib/supabase";
import { Gift, Plus, DollarSign, TrendingUp, Star } from "lucide-react";

export default async function BonusesPage() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .limit(100);

  const bonusData = [
    { id: 1, employee: "Budi Santoso", department: "Operasional", type: "Kinerja", amount: 5000000, period: "Q2 2026", status: "Disetujui" },
    { id: 2, employee: "Siti Rahayu", department: "Keuangan", type: "Tahunan", amount: 10000000, period: "2025", status: "Dibayarkan" },
    { id: 3, employee: "Ahmad Fauzi", department: "Operasional", type: "Proyek", amount: 3500000, period: "Proyek Logistik Q1 2026", status: "Disetujui" },
    { id: 4, employee: "Dian Permata", department: "SDM", type: "Khusus", amount: 2500000, period: "Lebaran 2026", status: "Dibayarkan" },
    { id: 5, employee: "Rudi Hartono", department: "Operasional", type: "Kinerja", amount: 8000000, period: "Q1 2026", status: "Disetujui" },
    { id: 6, employee: "Hendra Gunawan", department: "IT", type: "Proyek", amount: 4000000, period: "Migrasi Sistem 2026", status: "Pending" },
    { id: 7, employee: "Dewi Lestari", department: "IT", type: "Tahunan", amount: 6000000, period: "2025", status: "Dibayarkan" },
    { id: 8, employee: "Sari Indah", department: "Keuangan", type: "Khusus", amount: 1500000, period: "Natal 2025", status: "Dibayarkan" },
  ];

  const bonusTypes = ["Semua", "Kinerja", "Proyek", "Tahunan", "Khusus"];
  const totalBonus = bonusData.reduce((sum, b) => sum + b.amount, 0);
  const paidBonus = bonusData.filter((b) => b.status === "Dibayarkan").reduce((sum, b) => sum + b.amount, 0);
  const pendingBonus = bonusData.filter((b) => b.status === "Pending").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Bonus & Insentif</h1>
          <p className="text-sm text-gray-500">Kelola bonus dan insentif khusus karyawan.</p>
        </div>
        <button className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Tambah Bonus
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Bonus</p>
              <p className="text-xl font-extrabold text-slate-800">Rp {totalBonus.toLocaleString("id-ID")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Sudah Dibayarkan</p>
              <p className="text-xl font-extrabold text-slate-800">Rp {paidBonus.toLocaleString("id-ID")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Star size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu Persetujuan</p>
              <p className="text-xl font-extrabold text-slate-800">{pendingBonus}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {bonusTypes.map((type) => (
          <button
            key={type}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              type === "Semua"
                ? "bg-[#CC0000] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-[#CC0000]"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Bonus</h3>
            <p className="text-xs text-slate-400 mt-0.5">Riwayat pemberian bonus karyawan</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipe Bonus</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Periode</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bonusData.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-xs">{b.employee}</p>
                      <p className="text-[10px] text-slate-400">{b.department}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        b.type === "Kinerja" ? "bg-blue-50 text-blue-700" :
                        b.type === "Proyek" ? "bg-purple-50 text-purple-700" :
                        b.type === "Tahunan" ? "bg-emerald-50 text-emerald-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {b.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">Rp {b.amount.toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{b.period}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        b.status === "Dibayarkan" ? "bg-emerald-50 text-emerald-700" :
                        b.status === "Disetujui" ? "bg-blue-50 text-blue-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Tambah Bonus</h3>
            <p className="text-xs text-slate-400 mt-0.5">Formulir pemberian bonus baru</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</label>
              <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                <option value="">Pilih Karyawan</option>
                {employees?.map((e: Record<string, unknown>) => (
                  <option key={e.id as string} value={e.id as string}>{e.full_name as string} - {e.department as string}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipe Bonus</label>
              <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                <option value="">Pilih Tipe</option>
                <option>Kinerja</option><option>Proyek</option><option>Tahunan</option><option>Khusus</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah (Rp)</label>
              <input type="number" placeholder="0" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Periode</label>
              <input type="text" placeholder="Q2 2026" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keterangan</label>
              <textarea rows={2} placeholder="Alasan pemberian bonus..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
            </div>
            <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
              <Plus size={14} /> Simpan Bonus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
