import { supabaseAdmin } from "@/lib/supabase";
import { TrendingUp, Target, ArrowUp, Briefcase, GraduationCap, Calendar, CheckCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { ApplyButton, ConsultationButton } from "./CareerActionButtons";

export default async function EmployeeCareer() {
  let userEmail: string;
  let userName: string;
  try {
    const auth = await requireAuth();
    userEmail = auth.email;
    userName = auth.name || "Karyawan";
  } catch {
    redirect("/login");
  }

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, department, position, join_date")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const CAREER_LEVELS = ["Staff", "Senior Staff", "Supervisor", "Manager", "Senior Manager"];

  // Determine current career level based on position keyword
  const positionStr = (employee?.position || "").toLowerCase();
  const currentLevelIdx = positionStr.includes("senior manager") ? 4
    : positionStr.includes("manager") ? 3
    : positionStr.includes("supervisor") || positionStr.includes("spv") ? 2
    : positionStr.includes("senior") ? 1
    : 0;

  // Fetch open job postings in same department for promotion opportunities
  const { data: openJobs } = await supabaseAdmin
    .from("job_postings")
    .select("id, position, department, requirements, education, experience")
    .eq("status", "Open")
    .eq("department", employee?.department || "")
    .limit(3);

  const availablePromotions = (openJobs || []).map((j: Record<string, unknown>, idx: number) => ({
    id: idx + 1,
    position: j.position as string,
    department: j.department as string,
    requirements: [j.education, j.experience].filter(Boolean).join(", ") || "Lihat detail lowongan",
    status: "Tersedia",
    jobDept: j.department as string,
  }));

  if (availablePromotions.length === 0) {
    const nextLevel = CAREER_LEVELS[Math.min(currentLevelIdx + 1, CAREER_LEVELS.length - 1)];
    availablePromotions.push({
      id: 1,
      position: `${nextLevel} — ${employee?.department || "Departemen Anda"}`,
      department: employee?.department || "",
      requirements: "Belum ada lowongan terbuka saat ini",
      status: "Terkunci",
      jobDept: employee?.department || "",
    });
  }

  // Fetch active trainings for development plan
  const { data: activeTrainings } = await supabaseAdmin
    .from("trainings")
    .select("id, title, date_start, date_end")
    .in("status", ["Planned", "Ongoing"])
    .order("date_start", { ascending: true })
    .limit(5);

  // Calculate tenure in months for progress
  const joinDate = employee?.join_date ? new Date(employee.join_date as string) : null;
  const tenureMonths = joinDate ? Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
  const progressPct = Math.min(Math.round((tenureMonths / 24) * 100), 100);

  const myDevelopmentPlan = {
    goals: currentLevelIdx < CAREER_LEVELS.length - 1
      ? `Mencapai posisi ${CAREER_LEVELS[currentLevelIdx + 1]} dalam departemen ${employee?.department || ""}`
      : "Mempertahankan dan mengembangkan keahlian di posisi saat ini",
    trainings: (activeTrainings || []).map((t: Record<string, unknown>) => t.title as string),
    timeline: joinDate
      ? `${joinDate.toLocaleDateString("id-ID", { month: "short", year: "numeric" })} — ${new Date(joinDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`
      : "-",
    progress: progressPct,
  };

  const myCareerPath = CAREER_LEVELS;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengembangan Karir</h1>
        <p className="text-sm text-gray-500">Visualisasi jalur karir dan peluang pengembangan Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#CC0000]" />
              Jalur Karir Saya - {employee?.department || "Departemen"}
            </h3>

            <div className="flex items-start gap-3 overflow-x-auto pb-2">
              {myCareerPath.map((level, idx) => {
                const isCurrent = idx === currentLevelIdx;
                const isPast = idx < currentLevelIdx;
                return (
                  <div key={level} className="flex items-start gap-3 min-w-fit">
                    <div className={`rounded-2xl border-2 p-5 min-w-[140px] text-center ${
                      isCurrent ? "border-[#CC0000] bg-red-50/30" :
                      isPast ? "border-emerald-300 bg-emerald-50/20" :
                      "border-slate-200 bg-slate-50/30"
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        isCurrent ? "bg-[#CC0000] text-white" :
                        isPast ? "bg-emerald-500 text-white" :
                        "bg-slate-200 text-slate-500"
                      }`}>
                        {isPast ? <CheckCircle size={18} /> : <Target size={18} />}
                      </div>
                      <p className={`text-xs font-extrabold ${isCurrent ? "text-[#CC0000]" : "text-slate-700"}`}>{level}</p>
                      {isCurrent && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-[#CC0000] text-white rounded-full text-[8px] font-bold">
                          ANDA DISINI
                        </span>
                      )}
                    </div>
                    {idx < myCareerPath.length - 1 && (
                      <div className="flex items-center py-10">
                        <ArrowUp size={16} className="text-slate-300 shrink-0" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Rencana Pengembangan Saya</h3>
              <p className="text-xs text-slate-400 mt-0.5">Progress pengembangan karir Anda</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Progress Saat Ini</p>
                  <p className="text-2xl font-extrabold text-[#CC0000]">{myDevelopmentPlan.progress}%</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6 overflow-hidden">
                <div className="bg-[#CC0000] h-2.5 rounded-full" style={{ width: `${myDevelopmentPlan.progress}%` }}></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px]">
                <div>
                  <p className="font-bold text-slate-500 uppercase mb-1">Tujuan</p>
                  <p className="text-slate-700 font-medium">{myDevelopmentPlan.goals}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 uppercase mb-1">Timeline</p>
                  <p className="text-slate-700 font-medium">{myDevelopmentPlan.timeline}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-bold text-slate-500 uppercase mb-1">Pelatihan yang Dibutuhkan</p>
                  <div className="flex flex-wrap gap-1">
                    {myDevelopmentPlan.trainings.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-semibold">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Profil Saya</h3>
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

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Briefcase size={16} className="text-[#CC0000]" />
                Peluang Promosi
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Posisi yang tersedia untuk Anda</p>
            </div>
            <div className="divide-y divide-slate-50">
              {availablePromotions.map((promo) => (
                <div key={promo.id} className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-800">{promo.position}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                      promo.status === "Tersedia" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>{promo.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">{promo.requirements}</p>
                  {promo.status === "Tersedia" ? (
                    <ApplyButton jobTitle={promo.position} jobDept={promo.jobDept} />
                  ) : (
                    <button className="px-3 py-1 text-[9px] font-bold bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed" disabled>
                      Terkunci
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
              <GraduationCap size={16} />
              Konsultasi Karir
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              Diskusikan rencana karir Anda dengan HRD atau mentor untuk arahan pengembangan yang lebih terstruktur.
            </p>
            <ConsultationButton />
          </div>
        </div>
      </div>
    </div>
  );
}

