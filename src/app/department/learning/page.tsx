"use client";

import { useState, useEffect, useCallback } from "react";
import { GraduationCap, Clock, CheckCircle2, AlertTriangle, Award, BookOpen } from "lucide-react";
import { getMyDept } from "@/app/actions/department";
import { getTrainings, getDeptTrainingStatus, getMyDeptTrainingRequests, type TrainingRequest, type DeptTrainingStatusRow } from "@/app/actions/trainings";
import EmptyState from "@/components/EmptyState";

interface Training {
  id: string; title: string; description: string | null; date_start: string | null;
  date_end: string | null; status: string; department: string | null; enrollment_count: number;
}

const STATUS_STYLE: Record<string, string> = {
  Completed: "bg-emerald-50 text-emerald-700",
  Enrolled: "bg-blue-50 text-blue-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Cancelled: "bg-slate-100 text-slate-500",
  Dropped: "bg-red-50 text-red-700",
};

export default function DeptLearningPage() {
  const [deptName, setDeptName] = useState("");
  const [loading, setLoading] = useState(true);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [teamStatus, setTeamStatus] = useState<DeptTrainingStatusRow[]>([]);
  const [requests, setRequests] = useState<TrainingRequest[]>([]);

  const load = useCallback(async (dept: string) => {
    setLoading(true);
    try {
      const [tr, ts, rq] = await Promise.all([
        getTrainings(),
        getDeptTrainingStatus(dept),
        getMyDeptTrainingRequests(dept),
      ]);
      setTrainings(tr as Training[]);
      setTeamStatus(ts);
      setRequests(rq);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getMyDept().then(({ dept }) => {
      if (dept) { setDeptName(dept); load(dept); }
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, [load]);

  const completedCount = teamStatus.filter(r => r.status === "Completed").length;
  const enrolledCount = teamStatus.filter(r => r.status !== "Completed").length;
  const upcomingTrainings = trainings.filter(t => t.status === "Aktif" || t.status === "Scheduled" || t.status === "Berjalan");

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-72" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-pgp-navy flex items-center gap-2">
          <GraduationCap className="text-pgp-red" /> Pelatihan Tim
        </h1>
        <p className="text-sm text-gray-500 mt-1">{deptName || "Departemen tidak ditemukan"} — Pantau pelatihan dan sertifikasi tim Anda.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Selesai", value: completedCount, icon: <CheckCircle2 size={16} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Sedang Berjalan", value: enrolledCount, icon: <Clock size={16} />, color: "bg-amber-50 text-amber-600" },
          { label: "Pengajuan Training", value: requests.length, icon: <Award size={16} />, color: "bg-blue-50 text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status pelatihan tim */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Status Pelatihan Tim</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Riwayat keikutsertaan pelatihan seluruh anggota tim Anda.</p>
        </div>
        {teamStatus.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Belum ada tim yang terdaftar di pelatihan apapun." className="border-none py-10" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Karyawan</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Pelatihan</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Periode</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teamStatus.map((r, i) => (
                  <tr key={`${r.employee_id}-${r.training_id}-${i}`} className="hover:bg-slate-50/40">
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{r.employee_name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.training_title}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">
                      {r.date_start ? new Date(r.date_start).toLocaleDateString("id-ID") : "-"}
                      {r.date_end ? ` – ${new Date(r.date_end).toLocaleDateString("id-ID")}` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${STATUS_STYLE[r.status] || "bg-slate-100 text-slate-500"}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Katalog pelatihan tersedia */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5"><BookOpen size={14} /> Katalog Pelatihan Tersedia</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Program pelatihan yang tersedia — hubungi HRD untuk mendaftarkan anggota tim.</p>
        </div>
        {upcomingTrainings.length === 0 ? (
          <EmptyState icon={BookOpen} title="Belum ada pelatihan aktif." className="border-none py-10" />
        ) : (
          <div className="divide-y divide-slate-50">
            {upcomingTrainings.slice(0, 10).map(t => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">{t.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t.date_start ? new Date(t.date_start).toLocaleDateString("id-ID") : "-"}
                    {t.department ? ` · ${t.department}` : " · Semua departemen"}
                  </p>
                </div>
                <span className="shrink-0 px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-600">{t.enrollment_count} peserta</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Riwayat pengajuan training (dari kesenjangan kompetensi) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Pengajuan Training</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Diajukan dari kesenjangan kompetensi di halaman Kompetensi.</p>
          </div>
        </div>
        {requests.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Belum ada pengajuan training." description="Ajukan dari halaman Kompetensi saat ada kesenjangan (gap) kompetensi." className="border-none py-10" />
        ) : (
          <div className="divide-y divide-slate-50">
            {requests.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">{r.skill_name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    {r.current_level != null && r.required_level != null && ` · Level ${r.current_level} → ${r.required_level}`}
                  </p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  r.status === "Disetujui" ? "bg-emerald-50 text-emerald-700"
                  : r.status === "Ditolak" ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
