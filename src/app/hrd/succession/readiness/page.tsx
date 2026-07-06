import { supabaseAdmin } from "@/lib/supabase";
import { BarChart3, ClipboardCheck, Star, TrendingUp, Award } from "lucide-react";
import ReadinessForm from "./ReadinessForm";
import { getReadinessAssessments } from "@/app/actions/succession";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function PenilaianKesiapan() {
  const { data: candidates } = await supabaseAdmin
    .from("employees")
    .select("*")
    .neq("status", "Resigned")
    .order("full_name");

  const assessments = await getReadinessAssessments();

  const distinctAssessed = new Set(assessments.map((a) => a.employee_id as string)).size;
  const avgReadiness = assessments.length > 0
    ? Math.round(assessments.reduce((s, a) => s + (Number(a.total_score) || 0), 0) / assessments.length)
    : 0;
  const readyNow = assessments.filter((a) => (Number(a.total_score) || 0) >= 80).length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Penilaian Kesiapan</h1>
        <p className="text-sm text-gray-500">Nilai kesiapan kandidat suksesi berdasarkan kriteria kompetensi dan kinerja.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><ClipboardCheck size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Kandidat Dinilai</p>
              <p className="text-xl font-extrabold text-slate-800">{distinctAssessed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Kesiapan</p>
              <p className="text-xl font-extrabold text-slate-800">{avgReadiness}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Star size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Siap Segera</p>
              <p className="text-xl font-extrabold text-slate-800">{readyNow}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Award size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Penilaian</p>
              <p className="text-xl font-extrabold text-slate-800">{assessments.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Formulir Penilaian Kesiapan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Nilai setiap kriteria kesiapan suksesor</p>
          </div>
          <div className="p-6 space-y-6">
            <ReadinessForm
              candidates={(candidates || []).map((c: Record<string, unknown>) => ({
                id: c.id as string,
                full_name: c.full_name as string,
                position: (c.position as string) || "-",
              }))}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Penilaian</h3>
              <p className="text-xs text-slate-400 mt-0.5">Penilaian kesiapan terbaru</p>
            </div>
            {assessments.length > 0 ? (
              <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                {assessments.slice(0, 8).map((a) => {
                  const emp = a.employees as Record<string, string> | null;
                  const score = Number(a.total_score) || 0;
                  return (
                    <div key={a.id as string} className="px-6 py-4 hover:bg-slate-50/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {emp?.full_name || `ID: ${a.employee_id}`}
                        </p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          score >= 80 ? "bg-emerald-50 text-emerald-700" :
                          score >= 60 ? "bg-amber-50 text-amber-700" :
                          "bg-red-50 text-red-700"
                        }`}>
                          {score}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Tahun {a.year as number} · {a.updated_at ? new Date(a.updated_at as string).toLocaleDateString("id-ID", {
                          day: "numeric", month: "long", year: "numeric"
                        }) : "-"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Belum ada riwayat penilaian."
                className="py-8"
              />
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Kriteria Penilaian</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bobot tiap kriteria</p>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: "Kepemimpinan", weight: 25, desc: "Kemampuan memimpin tim dan mengambil keputusan" },
                { label: "Keahlian Teknis", weight: 25, desc: "Kompetensi teknis sesuai bidang pekerjaan" },
                { label: "Pengalaman", weight: 20, desc: "Pengalaman kerja relevan dan pencapaian" },
                { label: "Kinerja", weight: 20, desc: "Hasil evaluasi KPI dan target kerja" },
                { label: "Potensi", weight: 10, desc: "Potensi pengembangan dan pembelajaran" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                  <span className="text-xs font-extrabold text-[#CC0000]">{item.weight}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
