import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-guard";
import { MessageCircle, Clock, CheckCircle, AlertCircle } from "lucide-react";
import ComplaintForm from "@/components/ComplaintForm";

export default async function EmployeeComplaints() {
  const user = await requireAuth();
  const userEmail = user.email;

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, department")
    .eq("email", userEmail)
    .limit(1)
    .single();

  let complaints: Record<string, unknown>[] = [];
  if (employee?.id) {
    const { data } = await supabaseAdmin
      .from("complaints")
      .select("*")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false })
      .limit(50);
    complaints = data || [];
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Selesai": return "bg-emerald-50 text-emerald-700";
      case "Diproses": return "bg-blue-50 text-blue-700";
      case "Diterima": return "bg-amber-50 text-amber-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getCategoryClass = (category: string) => {
    switch (category) {
      case "Keluhan": return "bg-red-50 text-red-700";
      case "Saran": return "bg-blue-50 text-blue-700";
      case "Pelanggaran": return "bg-orange-50 text-orange-700";
      default: return "bg-purple-50 text-purple-700";
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
          <ComplaintForm />

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Laporan Saya</h3>
              <p className="text-xs text-slate-400 mt-0.5">Semua keluhan dan saran yang pernah Anda ajukan</p>
            </div>

            {complaints.length === 0 ? (
              <div className="p-10 text-center">
                <MessageCircle size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm text-slate-500">Belum ada laporan.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {complaints.map((c: Record<string, unknown>) => (
                  <div key={c.id as string} className="p-6 hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${getCategoryClass(c.category as string)}`}>
                            {c.category as string}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${getStatusBadge(c.status as string)}`}>
                            {c.status as string}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">{c.subject as string}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{c.description as string}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock size={9} />
                            {c.created_at ? new Date(c.created_at as string).toLocaleDateString("id-ID") : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <p className="text-slate-600">Pilih kategori sesuai jenis laporan</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-slate-600">Identitas pelapor dirahasiakan oleh HRD</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Statistik</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Laporan</span>
                <span className="font-bold text-slate-800">{complaints.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Selesai</span>
                <span className="font-bold text-emerald-600">{complaints.filter((c: Record<string, unknown>) => c.status === "Selesai").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Diproses</span>
                <span className="font-bold text-blue-600">{complaints.filter((c: Record<string, unknown>) => c.status === "Diproses" || c.status === "Diterima" || c.status === "Diajukan").length}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400" />
              Laporan Darurat
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              Untuk situasi darurat atau urgensi tinggi, segera hubungi HRD langsung.
            </p>
            <a href="mailto:hrga@ptpgp.co.id" className="w-full px-4 py-2 bg-red-600 text-white text-[10px] font-bold rounded-xl hover:bg-red-700 transition-colors text-center block">
              Kontak Darurat HRD
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
