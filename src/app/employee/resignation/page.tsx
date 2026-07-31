import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-guard";
import { Calendar, CheckCircle, XCircle, Clock, FileText, AlertTriangle } from "lucide-react";
import ResignationForm from "@/components/ResignationForm";

export default async function EmployeeResignation() {
  const user = await requireAuth();
  const userEmail = user.email;
  const userName = user.name || "Karyawan";

  const { data: employee } = await supabaseAdmin
    .from("karyawan")
    .select("id, department, position, join_date")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const { data: resignationRows } = await supabaseAdmin
    .from("pengunduran_diri")
    .select("*")
    .eq("employee_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);
  const resignation: Record<string, unknown> | null = resignationRows?.[0] || null;

  const r = resignation;

  const deleteAtRaw = r?.delete_at as string | null | undefined;
  const deletionScheduled = r?.status === "Disetujui" && !!deleteAtRaw && new Date(deleteAtRaw).getTime() > new Date().getTime();
  const deleteAtLabel = deleteAtRaw
    ? new Date(deleteAtRaw).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })
    : "";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Disetujui": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Ditolak": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Disetujui": return "Disetujui";
      case "Ditolak": return "Ditolak";
      case "Diajukan": return "Menunggu Persetujuan";
      default: return status;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengajuan Resign</h1>
        <p className="text-sm text-gray-500">Ajukan pengunduran diri secara resmi melalui sistem.</p>
      </div>

      {deletionScheduled ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-red-800 mb-1">Pengunduran Diri Berhasil</h3>
            <p className="text-xs text-red-700 leading-relaxed">
              Pengunduran diri Anda telah <span className="font-bold">disetujui HRD</span>. Sesuai kebijakan, akun Anda akan
              <span className="font-bold"> dihapus permanen pada {deleteAtLabel}</span> (24 jam sejak persetujuan).
              Pastikan Anda telah menyimpan data atau dokumen pribadi yang diperlukan sebelum akun dihapus.
            </p>
          </div>
        </div>
      ) : (
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {r ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <FileText size={16} className="text-[#CC0000]" />
                  Status Pengajuan Resign
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-4 rounded-2xl border ${getStatusBadge(r.status as string)}`}>
                    {r.status === "Disetujui" ? <CheckCircle size={24} /> :
                     r.status === "Ditolak" ? <XCircle size={24} /> :
                     <Clock size={24} />}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">
                      Status: {getStatusLabel(r.status as string)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Diajukan: {r.created_at ? new Date(r.created_at as string).toLocaleDateString("id-ID") : "-"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 text-xs border-t border-slate-100 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Alasan</p>
                      <p className="text-slate-700 font-medium">{r.reason as string}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Hari Terakhir</p>
                      <p className="text-slate-700 font-medium flex items-center gap-1"><Calendar size={12} /> {r.last_day as string}</p>
                    </div>
                  </div>
                  {(r.notes as string) && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Catatan</p>
                      <p className="text-slate-600 italic">{r.notes as string}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <ResignationForm />
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
                <span className="font-bold text-slate-800">{employee?.position as string || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Departemen</span>
                <span className="font-bold text-slate-800">{employee?.department as string || "-"}</span>
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
              {[
                "Ajukan resign melalui sistem (min. 30 hari sebelum HKT)",
                "HRD dan atasan akan mereview pengajuan",
                "Exit interview dengan HRD (jika diperlukan)",
                "Serah terima tugas dan pengembalian aset perusahaan",
                "Final settlement gaji dan hak karyawan"
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</span>
                  <p className="text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <h4 className="text-sm font-bold mb-2">Butuh Bantuan?</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              Jika Anda memiliki pertanyaan tentang prosedur resign atau hak-hak Anda, silakan hubungi tim HRD.
            </p>
            <a href="mailto:hrga@ptpgp.co.id" className="w-full px-4 py-2 bg-white text-slate-800 text-[10px] font-bold rounded-xl hover:bg-slate-100 transition-colors text-center block">
              Hubungi HRD
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
