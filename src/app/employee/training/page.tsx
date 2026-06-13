import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { GraduationCap, Calendar, Award, BookOpen, Clock, MapPin, CheckCircle } from "lucide-react";

export default async function EmployeeTraining() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value || "";

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, department, position")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const employeeId = employee?.id;

  const { data: trainings } = employeeId ? await supabaseAdmin
    .from("trainings")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(50) : { data: [] };

  const completed = (trainings || []).filter((t: Record<string, unknown>) => t.status === "Selesai").length;
  const inProgress = (trainings || []).filter((t: Record<string, unknown>) => t.status === "Sedang Berjalan").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pelatihan Saya</h1>
        <p className="text-sm text-gray-500">Pusat pelatihan dan pengembangan kompetensi Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><BookOpen size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pelatihan</p>
              <p className="text-xl font-extrabold text-slate-800">{(trainings || []).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Selesai</p>
              <p className="text-xl font-extrabold text-slate-800">{completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Award size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Sedang Berjalan</p>
              <p className="text-xl font-extrabold text-slate-800">{inProgress}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Daftar Pelatihan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pelatihan yang ditugaskan atau diikuti</p>
            </div>

            {(trainings || []).length === 0 ? (
              <div className="p-10 text-center">
                <GraduationCap size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm text-slate-500">Belum ada pelatihan yang ditugaskan.</p>
                <p className="text-xs text-slate-400 mt-1">HRD akan menugaskan pelatihan sesuai kebutuhan pengembangan Anda.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {(trainings || []).map((t: Record<string, unknown>) => (
                  <div key={t.id as string} className="p-6 hover:bg-slate-50/30 transition-colors flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-sm font-bold text-slate-800">{t.title as string}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          t.type === "Wajib" ? "bg-red-50 text-red-700" :
                          t.type === "Teknis" ? "bg-blue-50 text-blue-700" :
                          "bg-purple-50 text-purple-700"
                        }`}>{t.type as string}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          t.status === "Selesai" ? "bg-emerald-50 text-emerald-700" :
                          t.status === "Sedang Berjalan" ? "bg-amber-50 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>{t.status as string}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400">
                        {(t.date as string) && <span className="flex items-center gap-1"><Calendar size={9} /> {t.date as string}</span>}
                        {(t.provider as string) && <span className="flex items-center gap-1"><GraduationCap size={9} /> {t.provider as string}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Clock size={16} className="text-[#CC0000]" />
                Informasi
              </h3>
            </div>
            <div className="p-5 text-xs text-slate-500 space-y-2">
              <p>Departemen: <span className="font-bold text-slate-700">{employee?.department as string || "-"}</span></p>
              <p>Jabatan: <span className="font-bold text-slate-700">{employee?.position as string || "-"}</span></p>
              <p className="text-[10px] text-slate-400 mt-3">Pelatihan ditugaskan oleh HRD berdasarkan kebutuhan pengembangan kompetensi.</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <h4 className="text-sm font-bold mb-2">Butuh Pelatihan Tambahan?</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              Ajukan permohonan pelatihan yang Anda butuhkan untuk pengembangan karir.
            </p>
            <button className="w-full px-4 py-2 bg-white text-slate-800 text-[10px] font-bold rounded-xl hover:bg-slate-100 transition-colors">
              Ajukan Pelatihan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
