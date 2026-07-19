"use client";

import { useState, useEffect, useCallback } from "react";
import { Gift, Award, Star, AlertTriangle, Plus, X } from "lucide-react";
import { getMyDept } from "@/app/actions/department";
import { getDeptEmployees } from "@/app/actions/skills";
import { getDeptAwards, nominateAward, getDeptBonuses, addBonus } from "@/app/actions/rewards";
import EmptyState from "@/components/EmptyState";

const AWARD_CATEGORIES = ["Employee of the Month", "Best Performance", "Long Service Award", "Innovation Award"];
const BONUS_PROGRAMS = ["Performance Bonus", "Project Bonus", "Attendance Bonus", "Spot Bonus", "Suggestion Reward"];

interface Employee { id: string; full_name: string }
type AwardRow = Record<string, unknown> & { id: string; employee_name: string; category: string; description: string | null; award_date: string };
type BonusRow = Record<string, unknown> & { id: string; program: string; amount: number; status: string; period: string | null; karyawan?: { full_name?: string } };

const STATUS_STYLE: Record<string, string> = {
  Disetujui: "bg-emerald-50 text-emerald-700",
  Dibayarkan: "bg-emerald-50 text-emerald-700",
  Ditolak: "bg-red-50 text-red-700",
  Pending: "bg-amber-50 text-amber-700",
};

export default function DeptRewardsPage() {
  const [deptName, setDeptName] = useState("");
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [awards, setAwards] = useState<AwardRow[]>([]);
  const [bonuses, setBonuses] = useState<BonusRow[]>([]);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [showBonusForm, setShowBonusForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (dept: string) => {
    setLoading(true);
    try {
      const [emps, awd, bon] = await Promise.all([
        getDeptEmployees(dept),
        getDeptAwards(dept),
        getDeptBonuses(dept),
      ]);
      setEmployees(emps as Employee[]);
      setAwards(awd as AwardRow[]);
      setBonuses(bon as BonusRow[]);
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

  const handleAward = (formData: FormData) => {
    setError(""); setSubmitting(true);
    (async () => {
      const res = await nominateAward(formData);
      setSubmitting(false);
      if ("error" in res) { setError(res.error || "Gagal memproses."); return; }
      setShowAwardForm(false);
      load(deptName);
    })();
  };

  const handleBonus = (formData: FormData) => {
    setError(""); setSubmitting(true);
    (async () => {
      const res = await addBonus(formData);
      setSubmitting(false);
      if ("error" in res) { setError(res.error || "Gagal memproses."); return; }
      setShowBonusForm(false);
      load(deptName);
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
          <Gift className="text-pgp-red" /> Reward & Penghargaan
        </h1>
        <p className="text-sm text-gray-500 mt-1">{deptName || "Departemen tidak ditemukan"} — Nominasikan penghargaan dan ajukan bonus untuk tim Anda.</p>
      </div>

      {/* Penghargaan */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5"><Star size={14} /> Penghargaan</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Nominasikan karyawan berprestasi di tim Anda.</p>
          </div>
          <button onClick={() => setShowAwardForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-pgp-red hover:bg-pgp-red-hover text-white text-xs font-bold rounded-xl">
            {showAwardForm ? <X size={13} /> : <Plus size={13} />} {showAwardForm ? "Tutup" : "Nominasikan"}
          </button>
        </div>

        {showAwardForm && (
          <form action={handleAward} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Karyawan</label>
              <select name="employee_id" required className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                <option value="">Pilih karyawan</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Kategori</label>
              <select name="category" required className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                {AWARD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Tanggal</label>
              <input name="award_date" type="date" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Alasan Nominasi</label>
              <textarea name="description" rows={2} placeholder="Jelaskan prestasi karyawan..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl resize-none" />
            </div>
            {error && <p className="sm:col-span-2 text-xs font-semibold text-pgp-red">{error}</p>}
            <div className="sm:col-span-2">
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-pgp-red hover:bg-pgp-red-hover text-white text-xs font-bold rounded-xl disabled:opacity-50">
                {submitting ? "Mengirim..." : "Nominasikan"}
              </button>
            </div>
          </form>
        )}

        {awards.length === 0 ? (
          <EmptyState icon={Star} title="Belum ada penghargaan untuk tim ini." className="border-none py-10" />
        ) : (
          <div className="divide-y divide-slate-50">
            {awards.map(a => (
              <div key={a.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">{a.employee_name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(a.award_date).toLocaleDateString("id-ID")}{a.description ? ` · ${a.description}` : ""}</p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700">{a.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bonus */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5"><Award size={14} /> Bonus</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Ajukan bonus untuk karyawan tim Anda — perlu persetujuan HRD.</p>
          </div>
          <button onClick={() => setShowBonusForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-pgp-red hover:bg-pgp-red-hover text-white text-xs font-bold rounded-xl">
            {showBonusForm ? <X size={13} /> : <Plus size={13} />} {showBonusForm ? "Tutup" : "Ajukan Bonus"}
          </button>
        </div>

        {showBonusForm && (
          <form action={handleBonus} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Karyawan</label>
              <select name="employee_id" required className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                <option value="">Pilih karyawan</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Program</label>
              <select name="program" required className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white">
                {BONUS_PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Jumlah (Rp)</label>
              <input name="amount" type="number" min={1} required className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Periode</label>
              <input name="period" type="text" placeholder="cth. 2026-07" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl" />
            </div>
            {error && <p className="sm:col-span-2 text-xs font-semibold text-pgp-red">{error}</p>}
            <div className="sm:col-span-2">
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-pgp-red hover:bg-pgp-red-hover text-white text-xs font-bold rounded-xl disabled:opacity-50">
                {submitting ? "Mengirim..." : "Ajukan ke HRD"}
              </button>
            </div>
          </form>
        )}

        {bonuses.length === 0 ? (
          <EmptyState icon={Award} title="Belum ada bonus untuk tim ini." className="border-none py-10" />
        ) : (
          <div className="divide-y divide-slate-50">
            {bonuses.map(b => (
              <div key={b.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">{b.karyawan?.full_name || "-"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{b.program} · Rp{Number(b.amount).toLocaleString("id-ID")}{b.period ? ` · ${b.period}` : ""}</p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLE[b.status] || "bg-slate-100 text-slate-500"}`}>{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700">Pengajuan bonus perlu persetujuan HRD sebelum dibayarkan. Nominasi penghargaan tercatat langsung.</p>
      </div>
    </div>
  );
}
