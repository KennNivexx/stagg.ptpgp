import { supabaseAdmin } from "@/lib/supabase";
import { GraduationCap, Calendar, Award, BookOpen, Clock, CheckCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import TrainingRequestButton from "./TrainingRequestButton";
import EmptyState from "@/components/EmptyState";

export default async function EmployeeTraining() {
  let userEmail: string;
  try {
    const auth = await requireAuth();
    userEmail = auth.email;
  } catch {
    redirect("/login");
  }

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, department, position")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const employeeId = employee?.id;

  // Correct: query through training_enrollments, not trainings directly
  const { data: enrollments } = employeeId ? await supabaseAdmin
    .from("training_enrollments")
    .select("*, trainings!inner(id, title, description, date_start, date_end, status, skill_id)")
    .eq("employee_id", employeeId)
    .order("enrolled_at", { ascending: false })
    .limit(50) : { data: [] };

  const trainings = (enrollments || []).map((e: Record<string, unknown>) => {
    const t = e.trainings as Record<string, unknown>;
    return {
      id: e.id as string,
      training_id: t.id as string,
      title: t.title as string,
      description: t.description as string,
      date_start: t.date_start as string,
      date_end: t.date_end as string,
      status: e.status as string,
      training_status: t.status as string,
      enrolled_at: e.enrolled_at as string,
    };
  });

  const completed = trainings.filter((t) => t.status === "Completed").length;
  const inProgress = trainings.filter((t) => t.status === "Enrolled").length;

  // Available trainings not yet enrolled
  const enrolledIds = trainings.map(t => t.training_id);
  const { data: availableTrainings } = await supabaseAdmin
    .from("trainings")
    .select("id, title, date_start, date_end, status")
    .in("status", ["Planned", "Ongoing"])
    .order("date_start", { ascending: true })
    .limit(10);

  const notEnrolled = (availableTrainings || []).filter(
    (t: Record<string, unknown>) => !enrolledIds.includes(t.id as string)
  );

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
              <p className="text-xl font-extrabold text-slate-800">{trainings.length}</p>
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
              <p className="text-[10px] font-bold text-slate-400 uppercase">Terdaftar</p>
              <p className="text-xl font-extrabold text-slate-800">{inProgress}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Pelatihan Saya</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pelatihan yang ditugaskan atau diikuti</p>
            </div>

            {trainings.length === 0 ? (
              <div className="p-10">
                <EmptyState
                  icon={GraduationCap}
                  title="Belum ada pelatihan yang ditugaskan."
                  description="HRD akan menugaskan pelatihan sesuai kebutuhan pengembangan Anda."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {trainings.map((t) => (
                  <div key={t.id} className="p-6 hover:bg-slate-50/30 transition-colors flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-800">{t.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          t.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                          t.status === "Enrolled" ? "bg-amber-50 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {t.status === "Completed" ? "Selesai" : t.status === "Enrolled" ? "Terdaftar" : t.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                        {t.date_start && (
                          <span className="flex items-center gap-1">
                            <Calendar size={9} />
                            {new Date(t.date_start).toLocaleDateString("id-ID")}
                            {t.date_end && ` — ${new Date(t.date_end).toLocaleDateString("id-ID")}`}
                          </span>
                        )}
                        {t.description && <span className="text-slate-400">{t.description.slice(0, 60)}{t.description.length > 60 ? "..." : ""}</span>}
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
              Pilih pelatihan yang tersedia dan ajukan permohonan pendaftaran.
            </p>
            <TrainingRequestButton
              employeeId={employeeId || ""}
              availableTrainings={notEnrolled as { id: string; title: string; date_start: string; date_end: string; status: string }[]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
