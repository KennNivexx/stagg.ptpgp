"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, ArrowUpCircle, ArrowRightLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { getMyDept } from "@/app/actions/department";
import { getDeptEmployees } from "@/app/actions/skills";
import { getPromotions, submitPromotion, getMutations, submitMutation } from "@/app/actions/career-hrd";
import { getDeptCareerAssessments, recomputeDeptCareerAssessments } from "@/app/actions/career-development";
import EmptyState from "@/components/EmptyState";
import EmployeeCombobox from "@/components/EmployeeCombobox";

interface Employee { id: string; full_name: string; position: string; kode_jabatan?: string | null; nik?: string | null; department?: string | null }
type PromotionRow = Record<string, unknown> & { id: string; status: string; from_position: string; to_position: string; created_at: string; karyawan?: { full_name?: string } };
type MutationRow = Record<string, unknown> & { id: string; status: string; from_department: string; to_department: string; created_at: string; karyawan?: { full_name?: string } };
type AssessmentRow = Record<string, unknown> & { id: string; period: string; final_career_score: number | null; karyawan?: { full_name?: string }; career_readiness_rules?: { category_name?: string; color_code?: string } | null };

const STATUS_STYLE: Record<string, string> = {
  Disetujui: "bg-emerald-50 text-emerald-700",
  Ditolak: "bg-red-50 text-red-700",
  Menunggu: "bg-amber-50 text-amber-700",
};

export default function DeptCareerPage() {
  const [deptName, setDeptName] = useState("");
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [mutations, setMutations] = useState<MutationRow[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [tab, setTab] = useState<"promosi" | "mutasi">("promosi");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [recomputing, setRecomputing] = useState(false);

  const load = useCallback(async (dept: string) => {
    setLoading(true);
    try {
      const [emps, promos, muts, assess] = await Promise.all([
        getDeptEmployees(dept),
        getPromotions(),
        getMutations(),
        getDeptCareerAssessments(dept),
      ]);
      setEmployees(emps as Employee[]);
      setPromotions(promos as PromotionRow[]);
      setMutations(muts as MutationRow[]);
      setAssessments(assess as AssessmentRow[]);
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

  const handlePromotion = (formData: FormData) => {
    setError(""); setSubmitting(true);
    (async () => {
      const res = await submitPromotion(formData);
      setSubmitting(false);
      if ("error" in res) { setError(res.error || "Gagal memproses."); return; }
      load(deptName);
    })();
  };

  const handleMutation = (formData: FormData) => {
    setError(""); setSubmitting(true);
    (async () => {
      formData.set("from_department", deptName);
      const res = await submitMutation(formData);
      setSubmitting(false);
      if ("error" in res) { setError(res.error || "Gagal memproses."); return; }
      load(deptName);
    })();
  };

  const handleRecompute = () => {
    setRecomputing(true);
    (async () => {
      const period = new Date().toISOString().slice(0, 7);
      const res = await recomputeDeptCareerAssessments(deptName, period);
      setRecomputing(false);
      if (!("error" in res)) load(deptName);
    })();
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-72" />
          <div className="h-40 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-pgp-navy flex items-center gap-2">
          <TrendingUp className="text-pgp-red" /> Karier & Suksesi
        </h1>
        <p className="text-sm text-gray-500 mt-1">{deptName || "Departemen tidak ditemukan"} — Career score, promosi, dan mutasi tim Anda.</p>
      </div>

      {/* Career Score tim */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Career Score Tim</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Dihitung dari performa, kompetensi, pembelajaran, kehadiran, dan masa kerja — data yang sama dilihat HRD.</p>
          </div>
          <button onClick={handleRecompute} disabled={recomputing}
            className="flex items-center gap-1.5 px-3 py-2 bg-pgp-red hover:bg-pgp-red-hover text-white text-xs font-bold rounded-xl disabled:opacity-50">
            <RefreshCw size={13} className={recomputing ? "animate-spin" : ""} /> {recomputing ? "Menghitung..." : "Hitung Ulang"}
          </button>
        </div>
        {assessments.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Belum ada career score untuk tim ini." description="Klik 'Hitung Ulang' untuk menghitung dari data terbaru." className="border-none py-10" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Karyawan</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Periode</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Career Score</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Kesiapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assessments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{a.karyawan?.full_name || "-"}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{a.period}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-slate-800">{a.final_career_score ?? "-"}</td>
                    <td className="px-4 py-2.5">
                      {a.career_readiness_rules ? (
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className="h-2 w-2 rounded-full" style={{ background: a.career_readiness_rules.color_code || "#94a3b8" }} />
                          {a.career_readiness_rules.category_name}
                        </span>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ajukan Promosi / Mutasi */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex border-b border-slate-100">
          <button onClick={() => setTab("promosi")} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${tab === "promosi" ? "text-pgp-red border-b-2 border-pgp-red" : "text-slate-400"}`}>
            <ArrowUpCircle size={14} /> Ajukan Promosi
          </button>
          <button onClick={() => setTab("mutasi")} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${tab === "mutasi" ? "text-pgp-red border-b-2 border-pgp-red" : "text-slate-400"}`}>
            <ArrowRightLeft size={14} /> Ajukan Mutasi
          </button>
        </div>

        {tab === "promosi" ? (
          <form action={handlePromotion} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Karyawan</label>
              <EmployeeCombobox name="employee_id" employees={employees} required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Posisi Tujuan</label>
              <input name="to_position" type="text" required placeholder="cth. Supervisor Finance" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Tanggal Efektif</label>
              <input name="effective_date" type="date" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Alasan</label>
              <textarea name="reason" rows={3} placeholder="Jelaskan alasan promosi..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl resize-none" />
            </div>
            {error && <p className="sm:col-span-2 text-xs font-semibold text-pgp-red">{error}</p>}
            <div className="sm:col-span-2">
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-pgp-red hover:bg-pgp-red-hover text-white text-xs font-bold rounded-xl disabled:opacity-50">
                {submitting ? "Mengirim..." : "Ajukan ke HRD"}
              </button>
            </div>
          </form>
        ) : (
          <form action={handleMutation} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Karyawan</label>
              <EmployeeCombobox name="employee_id" employees={employees} required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Departemen Tujuan</label>
              <input name="to_department" type="text" required placeholder="cth. Operasional" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Tanggal Efektif</label>
              <input name="effective_date" type="date" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Alasan</label>
              <textarea name="reason" rows={3} placeholder="Jelaskan alasan mutasi..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl resize-none" />
            </div>
            {error && <p className="sm:col-span-2 text-xs font-semibold text-pgp-red">{error}</p>}
            <div className="sm:col-span-2">
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-pgp-red hover:bg-pgp-red-hover text-white text-xs font-bold rounded-xl disabled:opacity-50">
                {submitting ? "Mengirim..." : "Ajukan ke HRD"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Riwayat */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Riwayat {tab === "promosi" ? "Promosi" : "Mutasi"}</h3>
        </div>
        {tab === "promosi" ? (
          promotions.length === 0 ? (
            <EmptyState icon={ArrowUpCircle} title="Belum ada pengajuan promosi." className="border-none py-10" />
          ) : (
            <div className="divide-y divide-slate-50">
              {promotions.map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">{p.karyawan?.full_name || "-"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{p.from_position || "-"} → {p.to_position}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLE[p.status] || "bg-slate-100 text-slate-500"}`}>{p.status}</span>
                </div>
              ))}
            </div>
          )
        ) : (
          mutations.length === 0 ? (
            <EmptyState icon={ArrowRightLeft} title="Belum ada pengajuan mutasi." className="border-none py-10" />
          ) : (
            <div className="divide-y divide-slate-50">
              {mutations.map(m => (
                <div key={m.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">{m.karyawan?.full_name || "-"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{m.from_department} → {m.to_department}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLE[m.status] || "bg-slate-100 text-slate-500"}`}>{m.status}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700">Pengajuan promosi dan mutasi akan direview dan disetujui oleh HRD sebelum berlaku.</p>
      </div>
    </div>
  );
}
