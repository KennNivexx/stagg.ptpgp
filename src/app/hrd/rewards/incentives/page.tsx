import { supabaseAdmin } from "@/lib/supabase";
import { TrendingUp, Plus, Target, DollarSign, Star } from "lucide-react";

export default async function IncentivesPage() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .limit(100);

  const programs = [
    { id: 1, name: "Insentif Target Pengiriman", description: "Bonus per pengiriman tepat waktu di atas target minimum", target: "> 50 pengiriman/bulan", reward: "Rp 50.000/pengiriman", active: true },
    { id: 2, name: "Insentif Kehadiran Sempurna", description: "Reward untuk karyawan dengan kehadiran 100% tanpa terlambat", target: "100% kehadiran", reward: "Rp 300.000/bulan", active: true },
    { id: 3, name: "Insentif Zero Accident", description: "Penghargaan untuk tim dengan nol kecelakaan kerja", target: "0 insiden/bulan", reward: "Rp 500.000/tim", active: true },
    { id: 4, name: "Insentif Efisiensi BBM", description: "Bonus penghematan bahan bakar armada", target: "Penghematan > 10%", reward: "30% dari penghematan", active: false },
    { id: 5, name: "Insentif Customer Satisfaction", description: "Bonus berdasarkan rating kepuasan pelanggan", target: "Rating > 4.5", reward: "Rp 500.000/bulan", active: true },
  ];

  const employeeIncentives = [
    { id: 1, employee: "Budi Santoso", department: "Operasional", program: "Insentif Target Pengiriman", amount: 2500000, period: "Mei 2026", status: "Dibayarkan" },
    { id: 2, employee: "Ahmad Fauzi", department: "Operasional", program: "Insentif Efisiensi BBM", amount: 1800000, period: "Mei 2026", status: "Dibayarkan" },
    { id: 3, employee: "Rudi Hartono", department: "Operasional", program: "Insentif Zero Accident", amount: 500000, period: "Mei 2026", status: "Dibayarkan" },
    { id: 4, employee: "Sari Indah", department: "Keuangan", program: "Insentif Kehadiran Sempurna", amount: 300000, period: "Mei 2026", status: "Pending" },
    { id: 5, employee: "Dian Permata", department: "SDM", program: "Insentif Customer Satisfaction", amount: 500000, period: "Mei 2026", status: "Disetujui" },
  ];

  const totalIncentive = employeeIncentives.reduce((sum, i) => sum + i.amount, 0);
  const activePrograms = programs.filter((p) => p.active).length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Insentif Karyawan</h1>
          <p className="text-sm text-gray-500">Program dan tracking insentif karyawan.</p>
        </div>
        <button className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Tambah Insentif
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Target size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Program Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{activePrograms}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Insentif Dibayar</p>
              <p className="text-xl font-extrabold text-slate-800">Rp {totalIncentive.toLocaleString("id-ID")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Star size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Penerima Bulan Ini</p>
              <p className="text-xl font-extrabold text-slate-800">{employeeIncentives.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Program Insentif</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daftar program insentif yang tersedia</p>
            </div>
            <div className="divide-y divide-slate-50">
              {programs.map((p) => (
                <div key={p.id} className="p-6 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-sm font-bold text-slate-800">{p.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${p.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {p.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{p.description}</p>
                      <div className="flex items-center gap-4 text-[10px]">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Target size={10} /> Target: <span className="font-semibold text-slate-600">{p.target}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <DollarSign size={10} /> Reward: <span className="font-semibold text-emerald-600">{p.reward}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Pencairan Insentif</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Program</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employeeIncentives.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 text-[11px]">{i.employee}</p>
                        <p className="text-[9px] text-slate-400">{i.department}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-600">{i.program}</td>
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-800">Rp {i.amount.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          i.status === "Dibayarkan" ? "bg-emerald-50 text-emerald-700" :
                          i.status === "Disetujui" ? "bg-blue-50 text-blue-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>{i.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Tambah Insentif</h3>
            <p className="text-xs text-slate-400 mt-0.5">Formulir penambahan insentif baru</p>
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
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Program</label>
              <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                <option value="">Pilih Program</option>
                {programs.filter((p) => p.active).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah (Rp)</label>
              <input type="number" placeholder="0" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Periode</label>
              <input type="text" placeholder="Mei 2026" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
            </div>
            <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
              <Plus size={14} /> Simpan Insentif
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
