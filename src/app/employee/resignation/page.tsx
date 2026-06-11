import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { LogOut, Send, Clock, CheckCircle, XCircle, FileText, Calendar, AlertTriangle } from "lucide-react";

export default async function EmployeeResignation() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value || "";
  const userName = cookieStore.get("user_name")?.value || "Karyawan";

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, department, position, join_date")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const myResignation = {
    id: 1,
    reason: "Mendapatkan kesempatan karir yang lebih baik",
    lastWorkingDate: "30 Jun 2026",
    notes: "Saya mengucapkan terima kasih atas kesempatan yang diberikan selama bekerja di PT Pratama Galuh Perkasa.",
    status: "Pending",
    submittedDate: "05 Jun 2026",
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return dateStr; }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Disetujui": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Ditolak": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const hasResignation = myResignation.status !== null;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengajuan Resign</h1>
        <p className="text-sm text-gray-500">Ajukan pengunduran diri secara resmi melalui sistem.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-amber-800 mb-1">Perhatian!</h3>
          <p className="text-xs text-amber-700 leading-relaxed">
            Pengajuan resign bersifat serius dan akan diproses sesuai ketentuan perusahaan. Pastikan Anda telah mempertimbangkan keputusan ini dengan matang. Sesuai kebijakan, masa notice period adalah 30 hari sejak pengajuan disetujui.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {hasResignation ? (
            <>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <FileText size={16} className="text-[#CC0000]" />
                    Status Pengajuan Resign
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Pantau status pengajuan pengunduran diri Anda</p>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-2xl border ${getStatusBadge(myResignation.status)}`}>
                      {myResignation.status === "Disetujui" ? <CheckCircle size={24} /> :
                       myResignation.status === "Ditolak" ? <XCircle size={24} /> :
                       <Clock size={24} />}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">
                        Status: {myResignation.status === "Pending" ? "Menunggu Persetujuan" : myResignation.status}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Diajukan pada: {myResignation.submittedDate}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs border-t border-slate-100 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Alasan Pengunduran Diri</p>
                        <p className="text-slate-700 font-medium">{myResignation.reason}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Hari Kerja Terakhir</p>
                        <p className="text-slate-700 font-medium flex items-center gap-1"><Calendar size={12} /> {myResignation.lastWorkingDate}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Catatan</p>
                      <p className="text-slate-600 italic">&ldquo;{myResignation.notes}&rdquo;</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <LogOut size={16} className="text-[#CC0000]" />
                  Formulir Pengajuan Resign
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Isi formulir berikut untuk mengajukan pengunduran diri</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alasan Pengunduran Diri</label>
                  <select className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                    <option value="">Pilih Alasan</option>
                    <option>Kesempatan karir yang lebih baik</option>
                    <option>Alasan pribadi/keluarga</option>
                    <option>Melanjutkan pendidikan</option>
                    <option>Masalah kesehatan</option>
                    <option>Pindah domisili</option>
                    <option>Lainnya</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hari Kerja Terakhir</label>
                  <input type="date" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
                  <p className="text-[9px] text-amber-600 mt-1">Minimal 30 hari dari tanggal pengajuan (notice period)</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Tambahan</label>
                  <textarea rows={4} placeholder="Sampaikan pesan atau catatan tambahan untuk HRD..." className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300 text-[#CC0000] focus:ring-[#CC0000]" />
                    <span className="text-xs text-slate-600">Saya memahami bahwa pengajuan ini bersifat final dan akan diproses sesuai kebijakan perusahaan</span>
                  </label>
                </div>
                <button className="px-6 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
                  <Send size={14} /> Ajukan Resign
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Informasi Karyawan</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama</span>
                <span className="font-bold text-slate-800">{userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jabatan</span>
                <span className="font-bold text-slate-800">{employee?.position || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Departemen</span>
                <span className="font-bold text-slate-800">{employee?.department || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Masuk</span>
                <span className="font-bold text-slate-800">
                  {employee?.join_date ? new Date(employee.join_date as string).toLocaleDateString("id-ID") : "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Prosedur Resign</h3>
            <div className="space-y-3 text-[11px]">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold shrink-0">1</span>
                <p className="text-slate-600">Ajukan resign melalui sistem (min. 30 hari sebelum HKT)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold shrink-0">2</span>
                <p className="text-slate-600">HRD dan atasan akan mereview pengajuan</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold shrink-0">3</span>
                <p className="text-slate-600">Exit interview dengan HRD (jika diperlukan)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold shrink-0">4</span>
                <p className="text-slate-600">Serah terima tugas dan pengembalian aset perusahaan</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold shrink-0">5</span>
                <p className="text-slate-600">Final settlement gaji dan hak karyawan</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <h4 className="text-sm font-bold mb-2">Butuh Bantuan?</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              Jika Anda memiliki pertanyaan tentang prosedur resign atau hak-hak Anda, silakan hubungi tim HRD.
            </p>
            <button className="w-full px-4 py-2 bg-white text-slate-800 text-[10px] font-bold rounded-xl hover:bg-slate-100 transition-colors">
              Hubungi HRD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
