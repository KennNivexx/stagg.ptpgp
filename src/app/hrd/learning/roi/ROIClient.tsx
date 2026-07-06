"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Info, Pencil, X, Save,
  AlertTriangle, CheckCircle2, Building2,
} from "lucide-react";
import { saveTrainingROI, type TrainingROIRow } from "@/app/actions/trainings";
import EmptyState from "@/components/EmptyState";

function formatRupiah(n: number) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

export default function ROIClient({ initialRows }: { initialRows: TrainingROIRow[] }) {
  const router = useRouter();
  const rows = initialRows;
  const [editing, setEditing] = useState<TrainingROIRow | null>(null);
  const [form, setForm] = useState({ cost: "0", benefit: "0", notes: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const showToast = (type: "error" | "success", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const openEdit = (row: TrainingROIRow) => {
    setEditing(row);
    setForm({ cost: String(row.cost), benefit: String(row.benefit), notes: row.notes });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("training_id", editing.id);
    fd.append("cost", form.cost);
    fd.append("benefit", form.benefit);
    fd.append("notes", form.notes);
    const r = await saveTrainingROI(fd);
    setSaving(false);
    if (r?.error) { showToast("error", r.error); return; }
    showToast("success", "Data ROTI berhasil disimpan.");
    setEditing(null);
    router.refresh();
  };

  const summary = useMemo(() => {
    const withData = rows.filter((r) => r.cost > 0);
    const totalCost = rows.reduce((s, r) => s + r.cost, 0);
    const totalBenefit = rows.reduce((s, r) => s + r.benefit, 0);
    const avgRoti = withData.length > 0
      ? Math.round(withData.reduce((s, r) => s + (r.roti || 0), 0) / withData.length)
      : null;
    const best = withData.length > 0 ? withData.reduce((a, b) => ((b.roti || -Infinity) > (a.roti || -Infinity) ? b : a)) : null;
    return { totalCost, totalBenefit, avgRoti, best, evaluatedCount: withData.length };
  }, [rows]);

  const rotiColor = (roti: number | null) => {
    if (roti === null) return "text-slate-400";
    if (roti >= 50) return "text-emerald-600";
    if (roti >= 0) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-[#1A2530]">Analisis Dampak ROTI</h1>
        <p className="text-sm text-gray-500 mt-1">Return On Training Investment — mengukur nilai balik dari setiap program pelatihan.</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-3">
        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 leading-relaxed">
          <p className="font-bold mb-1">Apa itu ROTI?</p>
          <p>
            ROTI (<i>Return On Training Investment</i>) mengukur seberapa besar manfaat/nilai yang didapat perusahaan dibandingkan biaya yang dikeluarkan untuk sebuah program pelatihan.
            Rumusnya: <b>ROTI% = ((Manfaat − Biaya) / Biaya) × 100%</b>. Contoh: pelatihan seharga Rp10 juta yang menghasilkan manfaat (produktivitas, efisiensi, penurunan kesalahan, dsb.) senilai Rp15 juta punya ROTI +50% — artinya investasi pelatihan itu terbukti menguntungkan.
            Isi <b>Biaya</b> (total pengeluaran: instruktur, materi, waktu peserta) dan estimasi <b>Manfaat</b> (dalam Rupiah) untuk setiap program agar ROTI-nya terhitung otomatis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><Wallet size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Investasi</p>
              <p className="text-lg font-extrabold text-slate-800">{formatRupiah(summary.totalCost)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><PiggyBank size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Manfaat</p>
              <p className="text-lg font-extrabold text-slate-800">{formatRupiah(summary.totalBenefit)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${(summary.avgRoti || 0) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
              {(summary.avgRoti || 0) >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">ROTI Rata-rata</p>
              <p className={`text-lg font-extrabold ${rotiColor(summary.avgRoti)}`}>{summary.avgRoti === null ? "-" : `${summary.avgRoti > 0 ? "+" : ""}${summary.avgRoti}%`}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Program Dievaluasi</p>
              <p className="text-lg font-extrabold text-slate-800">{summary.evaluatedCount} / {rows.length}</p>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Input ROTI: {editing.title}</h3>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Biaya Pelatihan (Rp)</label>
                <input type="number" min={0} required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Manfaat (Rp)</label>
                <input type="number" min={0} value={form.benefit} onChange={(e) => setForm({ ...form, benefit: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Bagaimana manfaat ini dihitung/diobservasi..." className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50">
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={TrendingUp} title="Belum ada program pelatihan." description="Data ROTI akan muncul setelah ada program training." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Program</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase">Biaya</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase">Manfaat</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">ROTI</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-xs text-slate-800">{r.title}</p>
                      {r.department && (
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><Building2 size={9} /> {r.department}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">{r.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-700 font-semibold">{r.cost > 0 ? formatRupiah(r.cost) : "-"}</td>
                    <td className="px-6 py-4 text-right text-xs text-slate-700 font-semibold">{r.benefit > 0 ? formatRupiah(r.benefit) : "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-extrabold text-xs ${rotiColor(r.roti)}`}>
                        {r.roti === null ? "Belum dihitung" : `${r.roti > 0 ? "+" : ""}${r.roti}%`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-sky-100 text-sky-600 transition-colors inline-flex items-center gap-1">
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
