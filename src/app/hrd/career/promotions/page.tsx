import { supabaseAdmin } from "@/lib/supabase";
import { ArrowUp, Plus, Clock, CheckCircle, XCircle, Calendar, User } from "lucide-react";

export default async function PromotionsPage() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .limit(100);

  const promotions = [
    { id: 1, employee: "Budi Santoso", fromDept: "Operasional", fromPosition: "Staff Gudang", toDept: "Operasional", toPosition: "Supervisor Gudang", reason: "Kinerja excellent dan loyalitas 3 tahun", effectiveDate: "01 Jul 2026", status: "Disetujui" },
    { id: 2, employee: "Siti Rahayu", fromDept: "Keuangan", fromPosition: "Staff Accounting", toDept: "Keuangan", toPosition: "Supervisor Accounting", reason: "Berhasil memimpin project implementasi sistem baru", effectiveDate: "15 Jun 2026", status: "Pending" },
    { id: 3, employee: "Ahmad Fauzi", fromDept: "Operasional", fromPosition: "Driver", toDept: "Operasional", toPosition: "Staff Logistik", reason: "Pengalaman 5 tahun dan pelatihan logistik tersertifikasi", effectiveDate: "01 Jun 2026", status: "Disetujui" },
    { id: 4, employee: "Dian Permata", fromDept: "SDM", fromPosition: "HR Officer", toDept: "SDM", toPosition: "HR Supervisor", reason: "Pencapaian target rekrutmen dan pengembangan SDM", effectiveDate: "01 Agu 2026", status: "Pending" },
    { id: 5, employee: "Dewi Lestari", fromDept: "IT", fromPosition: "IT Support", toDept: "IT", toPosition: "System Analyst", reason: "Sertifikasi dan portofolio project system", effectiveDate: "01 Mei 2026", status: "Ditolak" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Promosi Karyawan</h1>
          <p className="text-sm text-gray-500">Kelola pengajuan dan riwayat promosi karyawan.</p>
        </div>
        <button className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Ajukan Promosi
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><ArrowUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pengajuan</p>
              <p className="text-xl font-extrabold text-slate-800">{promotions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Disetujui</p>
              <p className="text-xl font-extrabold text-slate-800">{promotions.filter((p) => p.status === "Disetujui").length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu</p>
              <p className="text-xl font-extrabold text-slate-800">{promotions.filter((p) => p.status === "Pending").length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Pengajuan Promosi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Riwayat dan status pengajuan promosi</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dari Posisi</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ke Posisi</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tgl Efektif</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-xs">{p.employee}</p>
                      <p className="text-[10px] text-slate-400">{p.fromDept}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{p.fromPosition}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <ArrowUp size={10} className="text-emerald-500" />
                        <span className="text-xs font-bold text-slate-800">{p.toPosition}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{p.effectiveDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        p.status === "Disetujui" ? "bg-emerald-50 text-emerald-700" :
                        p.status === "Ditolak" ? "bg-red-50 text-red-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600" title="Setujui"><CheckCircle size={12} /></button>
                        <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Tolak"><XCircle size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Form Pengajuan Promosi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ajukan promosi untuk karyawan</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</label>
              <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                <option value="">Pilih Karyawan</option>
                {employees?.map((e: Record<string, unknown>) => (
                  <option key={e.id as string} value={e.id as string}>{e.full_name as string} - {e.position as string}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dari Posisi</label>
                <input type="text" placeholder="Posisi saat ini" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ke Posisi</label>
                <input type="text" placeholder="Posisi tujuan" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Efektif</label>
              <input type="date" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alasan Promosi</label>
              <textarea rows={3} placeholder="Jelaskan alasan promosi..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
            </div>
            <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
              <Plus size={14} /> Ajukan Promosi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
