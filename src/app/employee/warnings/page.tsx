import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-guard";
import { AlertTriangle, Shield, Clock } from "lucide-react";

export default async function EmployeeWarnings() {
  const user = await requireAuth();
  const userEmail = user.email;

  const { data: employee } = await supabaseAdmin
    .from("karyawan")
    .select("id")
    .eq("email", userEmail)
    .limit(1)
    .single();

  let warnings: Record<string, unknown>[] = [];
  if (employee?.id) {
    const { data } = await supabaseAdmin
      .from("surat_peringatan")
      .select("*")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false })
      .limit(20);
    warnings = data || [];
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "SP1": return "bg-amber-50 text-amber-700 border-amber-200";
      case "SP2": return "bg-orange-50 text-orange-700 border-orange-200";
      case "SP3": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "SP1": return "Surat Peringatan 1";
      case "SP2": return "Surat Peringatan 2";
      case "SP3": return "Surat Peringatan 3";
      default: return level;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Surat Peringatan</h1>
        <p className="text-sm text-gray-500">Riwayat surat peringatan yang dikeluarkan oleh HRD.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SP 1</p>
              <p className="text-xl font-extrabold text-slate-800">{warnings.filter((w: Record<string, unknown>) => w.sp_level === "SP1").length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SP 2</p>
              <p className="text-xl font-extrabold text-slate-800">{warnings.filter((w: Record<string, unknown>) => w.sp_level === "SP2").length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SP 3</p>
              <p className="text-xl font-extrabold text-slate-800">{warnings.filter((w: Record<string, unknown>) => w.sp_level === "SP3").length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Shield size={16} className="text-[#CC0000]" />
            Riwayat Surat Peringatan
          </h3>
        </div>

        {warnings.length === 0 ? (
          <div className="p-12 text-center">
            <Shield size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Tidak ada surat peringatan.</p>
            <p className="text-xs text-slate-400 mt-1">Anda tidak memiliki catatan pelanggaran.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {warnings.map((w: Record<string, unknown>) => (
              <div key={w.id as string} className="p-6 hover:bg-slate-50/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-lg border text-xs font-bold ${getLevelBadge(w.sp_level as string)}`}>
                        {getLevelLabel(w.sp_level as string)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                        w.status === "Aktif" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-500"
                      }`}>{w.status as string}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-1">{String(w.reason)}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={9} />
                        Dikeluarkan: {w.created_at ? new Date(w.created_at as string).toLocaleDateString("id-ID") : "-"}
                      </span>
                      {(w.valid_until as string) && (
                        <span>Berlaku hingga: {new Date(w.valid_until as string).toLocaleDateString("id-ID")}</span>
                      )}
                      {(w.issued_by as string) && <span>Oleh: {w.issued_by as string}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
