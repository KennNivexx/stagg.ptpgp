import { supabaseAdmin } from "@/lib/supabase";
import { FileText, Clock, CheckCircle2, XCircle, Plus, Users, Calendar, Send } from "lucide-react";

const SEED_REQUESTS = [
  { id: "REQ-001", department: "Produksi", position: "Operator Produksi", quantity: 5, reason: "Peningkatan kapasitas produksi", urgency: "Tinggi", status: "Pending", requestedBy: "Manager Produksi", date: "10 Jun 2026" },
  { id: "REQ-002", department: "Finance", position: "Staff Akuntansi", quantity: 2, reason: "Penggantian karyawan resign", urgency: "Sedang", status: "Disetujui", requestedBy: "Kabag Finance", date: "08 Jun 2026" },
  { id: "REQ-003", department: "IT", position: "Software Developer", quantity: 3, reason: "Proyek digitalisasi", urgency: "Tinggi", status: "Pending", requestedBy: "Manager IT", date: "05 Jun 2026" },
  { id: "REQ-004", department: "Sales", position: "Sales Representative", quantity: 4, reason: "Ekspansi area pemasaran", urgency: "Sedang", status: "Disetujui", requestedBy: "Sales Manager", date: "01 Jun 2026" },
  { id: "REQ-005", department: "HRD", position: "HR Officer", quantity: 1, reason: "Beban kerja meningkat", urgency: "Rendah", status: "Ditolak", requestedBy: "HR Manager", date: "28 Mei 2026" },
  { id: "REQ-006", department: "Logistik", position: "Staff Gudang", quantity: 3, reason: "Pembukaan gudang baru", urgency: "Tinggi", status: "Pending", requestedBy: "Kabag Logistik", date: "25 Mei 2026" },
];

export default async function PermintaanTenagaKerja() {
  const { data: departments } = await supabaseAdmin.from("departments").select("*");
  const { data: employees } = await supabaseAdmin.from("employees").select("position").neq("status", "Inactive");
  const uniquePositions = [...new Set((employees || []).map((e: Record<string, unknown>) => e.position as string).filter(Boolean))];

  const pending = SEED_REQUESTS.filter((r) => r.status === "Pending").length;
  const approved = SEED_REQUESTS.filter((r) => r.status === "Disetujui").length;
  const rejected = SEED_REQUESTS.filter((r) => r.status === "Ditolak").length;

  const getStatusBadge = (status: string) => {
    const m: Record<string, string> = { Pending: "bg-amber-50 text-amber-700", Disetujui: "bg-emerald-50 text-emerald-700", Ditolak: "bg-red-50 text-red-700" };
    return m[status] || "bg-slate-100 text-slate-600";
  };

  const getUrgencyBadge = (u: string) => {
    const m: Record<string, string> = { Tinggi: "bg-red-50 text-red-700 border-red-200", Sedang: "bg-amber-50 text-amber-700 border-amber-200", Rendah: "bg-blue-50 text-blue-700 border-blue-200" };
    return m[u] || "bg-slate-100 text-slate-600";
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Permintaan Tenaga Kerja</h1>
        <p className="text-sm text-gray-500">Ajukan dan pantau permintaan penambahan tenaga kerja per departemen.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Permintaan", value: SEED_REQUESTS.length, icon: <FileText size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Pending", value: pending, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Disetujui", value: approved, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Ditolak", value: rejected, icon: <XCircle size={18} />, color: "bg-red-50 text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-[#CC0000]" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Ajukan Permintaan Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">Form pengajuan tenaga kerja</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Departemen</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30">
                  <option value="">Pilih Departemen</option>
                  {((departments || []) as Record<string, unknown>[]).map((d) => (
                    <option key={d.id as string} value={d.name as string}>{d.name as string}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Posisi</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Nama posisi yang dibutuhkan" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Jumlah Dibutuhkan</label>
                <input type="number" min="1" defaultValue="1" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Urgensi</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30">
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                  <option value="Rendah">Rendah</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Alasan</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" rows={2} placeholder="Jelaskan alasan permintaan..." />
              </div>
              <button type="submit" className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
                <Send size={14} /> Kirim Permintaan
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Daftar Permintaan Tenaga Kerja</h3>
                <p className="text-xs text-slate-400 mt-0.5">Riwayat pengajuan dan status persetujuan</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {SEED_REQUESTS.length === 0 ? (
              <div className="p-12 text-center">
                <Users size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm text-slate-500">Belum ada permintaan tenaga kerja.</p>
                <p className="text-xs text-slate-400 mt-1">Ajukan permintaan baru untuk memulai.</p>
              </div>
            ) : (
              SEED_REQUESTS.map((req) => (
                <div key={req.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">{req.id}</span>
                        <span className="text-sm font-bold text-slate-800">{req.position}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getUrgencyBadge(req.urgency)}`}>{req.urgency}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Users size={10} /> {req.department}</span>
                        <span>Jumlah: {req.quantity} orang</span>
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusBadge(req.status)}`}>{req.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-0 mt-2">{req.reason}</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><Users size={10} /> {req.requestedBy}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> {req.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
