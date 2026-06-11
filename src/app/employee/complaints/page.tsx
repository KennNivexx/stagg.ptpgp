import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { MessageCircle, Plus, Send, Clock, CheckCircle, AlertCircle, User, Tag } from "lucide-react";

export default async function EmployeeComplaints() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value || "";
  const userName = cookieStore.get("user_name")?.value || "Karyawan";

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, department")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const complaintTypes = ["Keluhan", "Saran", "Masukan", "Pelanggaran"];
  const priorityLevels = ["Rendah", "Sedang", "Tinggi", "Kritis"];

  const myComplaints = [
    { id: 1, type: "Keluhan", subject: "AC di ruang gudang tidak berfungsi", priority: "Sedang", date: "05 Jun 2026", status: "Diproses" },
    { id: 2, type: "Saran", subject: "Usulan penambahan kantin karyawan", priority: "Rendah", date: "01 Jun 2026", status: "Diterima" },
    { id: 3, type: "Masukan", subject: "Sistem absensi perlu perbaikan UI", priority: "Sedang", date: "28 Mei 2026", status: "Selesai" },
    { id: 4, type: "Keluhan", subject: "Keterlambatan pembayaran uang makan", priority: "Tinggi", date: "20 Mei 2026", status: "Selesai" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Selesai": return "bg-emerald-50 text-emerald-700";
      case "Diproses": return "bg-blue-50 text-blue-700";
      case "Diterima": return "bg-amber-50 text-amber-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Kritis": return "bg-red-50 text-red-700";
      case "Tinggi": return "bg-orange-50 text-orange-700";
      case "Sedang": return "bg-amber-50 text-amber-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Keluhan & Saran</h1>
        <p className="text-sm text-gray-500">Sampaikan keluhan, saran, atau masukan Anda kepada manajemen.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <MessageCircle size={16} className="text-[#CC0000]" />
                Ajukan Keluhan atau Saran
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Isi formulir di bawah untuk menyampaikan laporan Anda</p>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipe Laporan</label>
                <select className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Tipe</option>
                  {complaintTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prioritas</label>
                <select className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Prioritas</option>
                  {priorityLevels.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subjek</label>
                <input type="text" placeholder="Judul singkat laporan Anda" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi</label>
                <textarea rows={4} placeholder="Jelaskan keluhan atau saran Anda secara detail..." className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
              </div>
              <div className="md:col-span-2">
                <button className="px-6 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
                  <Send size={14} /> Kirim Laporan
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Laporan Saya</h3>
              <p className="text-xs text-slate-400 mt-0.5">Semua keluhan dan saran yang pernah Anda ajukan</p>
            </div>

            <div className="divide-y divide-slate-50">
              {myComplaints.map((c) => (
                <div key={c.id} className="p-6 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                          c.type === "Keluhan" ? "bg-red-50 text-red-700" :
                          c.type === "Saran" ? "bg-blue-50 text-blue-700" :
                          "bg-purple-50 text-purple-700"
                        }`}>{c.type}</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${getPriorityBadge(c.priority)}`}>
                          {c.priority}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${getStatusBadge(c.status)}`}>
                          {c.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">{c.subject}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={9} /> {c.date}</span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors shrink-0">
                      Lihat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Panduan Melapor</h3>
            <div className="space-y-3 text-[11px]">
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-slate-600">Sampaikan laporan dengan jelas dan objektif</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-slate-600">Sertakan bukti pendukung jika diperlukan</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-slate-600">Pilih prioritas sesuai tingkat urgensi</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-slate-600">Identitas pelapor dirahasiakan oleh HRD</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Statistik Laporan Saya</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Laporan</span>
                <span className="font-bold text-slate-800">{myComplaints.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Selesai</span>
                <span className="font-bold text-emerald-600">{myComplaints.filter((c) => c.status === "Selesai").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dalam Proses</span>
                <span className="font-bold text-blue-600">{myComplaints.filter((c) => c.status === "Diproses" || c.status === "Diterima").length}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400" />
              Laporan Darurat
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              Untuk situasi darurat atau urgensi tinggi, segera hubungi HRD langsung atau gunakan kontak darurat perusahaan.
            </p>
            <button className="w-full px-4 py-2 bg-red-600 text-white text-[10px] font-bold rounded-xl hover:bg-red-700 transition-colors">
              Kontak Darurat HRD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
