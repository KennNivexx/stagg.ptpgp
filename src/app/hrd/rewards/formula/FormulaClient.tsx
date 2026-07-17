"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Zap, CheckCircle2 } from "lucide-react";
import { saveRewardRule, deleteRewardRule, evaluateRewardRules } from "@/app/actions/rewards";
import EmptyState from "@/components/EmptyState";

interface Props {
  rules: Array<Record<string, unknown>>;
}

function currentPeriod() {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

export default function FormulaClient({ rules }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [period, setPeriod] = useState(currentPeriod());
  const [evaluating, setEvaluating] = useState(false);

  const showMsg = (type: "success" | "error", text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 5000); };

  const handleSave = async (fd: FormData) => {
    setBusy(true);
    const res = await saveRewardRule(fd);
    setBusy(false);
    if ("error" in res) { showMsg("error", res.error); return; }
    showMsg("success", "Aturan reward berhasil disimpan.");
    setShowForm(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    await deleteRewardRule(id);
    setBusy(false);
    router.refresh();
  };

  const handleEvaluate = async () => {
    if (!period) { showMsg("error", "Periode wajib diisi."); return; }
    setEvaluating(true);
    const res = await evaluateRewardRules(period);
    setEvaluating(false);
    if ("error" in res) { showMsg("error", res.error); return; }
    showMsg("success", `${res.generated} saran reward baru dibuat sebagai draft di halaman Bonus/Insentif — silakan review dan approve manual.`);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-extrabold text-slate-800 text-sm mb-1 flex items-center gap-2"><Zap size={16} className="text-pgp-red" /> Generate Reward Suggestions</h3>
        <p className="text-xs text-slate-400 mb-4">Evaluasi semua karyawan aktif terhadap aturan yang aktif, untuk periode berikut. Hasil masuk sebagai draft (status Pending) di Bonus/Insentif — tidak langsung dibayar.</p>
        <div className="flex items-center gap-2">
          <input value={period} onChange={e => setPeriod(e.target.value)} placeholder="MM/YYYY"
            className="border border-gray-200 p-2.5 rounded-xl text-xs w-32" />
          <button onClick={handleEvaluate} disabled={evaluating}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
            <Zap size={13} /> {evaluating ? "Mengevaluasi..." : "Generate"}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-medium ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Aturan Reward</h3>
            <p className="text-xs text-slate-400 mt-0.5">Syarat kelayakan otomatis</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-pgp-red text-white text-xs font-bold rounded-xl hover:bg-pgp-red-hover flex items-center gap-1.5">
            <Plus size={13} /> {showForm ? "Tutup" : "Tambah Aturan"}
          </button>
        </div>

        {showForm && (
          <form action={handleSave} className="p-6 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="nama" placeholder="Nama Aturan, mis. Bonus Kinerja Unggul" required className="border border-gray-200 p-2.5 rounded-xl text-xs sm:col-span-2" />
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min. Skor KPI</label>
              <input name="min_kpi_score" type="number" min="0" max="100" placeholder="kosongkan = tidak disyaratkan" className="border border-gray-200 p-2.5 rounded-xl text-xs w-full" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min. Kehadiran (%)</label>
              <input name="min_attendance_pct" type="number" min="0" max="100" placeholder="kosongkan = tidak disyaratkan" className="border border-gray-200 p-2.5 rounded-xl text-xs w-full" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min. Penyelesaian Training (%)</label>
              <input name="min_training_completion_pct" type="number" min="0" max="100" placeholder="kosongkan = tidak disyaratkan" className="border border-gray-200 p-2.5 rounded-xl text-xs w-full" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 mt-4">
              <input type="checkbox" name="no_active_warning" className="accent-pgp-red" /> Tidak ada Surat Peringatan aktif
            </label>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jenis Reward</label>
              <select name="reward_type" className="border border-gray-200 p-2.5 rounded-xl text-xs w-full bg-white">
                <option value="bonus">Bonus</option>
                <option value="incentive">Insentif</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Metode Perhitungan</label>
              <select name="calc_method" className="border border-gray-200 p-2.5 rounded-xl text-xs w-full bg-white">
                <option value="percent_basic">Persen dari Basic Salary</option>
                <option value="fixed_amount">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nilai</label>
              <input name="calc_value" type="number" min="0" required placeholder="mis. 20 (untuk 20%) atau 3000000" className="border border-gray-200 p-2.5 rounded-xl text-xs w-full" />
            </div>
            <button type="submit" disabled={busy} className="sm:col-span-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold disabled:opacity-50">
              {busy ? "Menyimpan..." : "Simpan Aturan"}
            </button>
          </form>
        )}

        {rules.length === 0 ? (
          <EmptyState icon={Zap} title="Belum ada aturan reward." description="Tambah aturan untuk mulai men-generate saran reward otomatis." />
        ) : (
          <div className="divide-y divide-slate-50">
            {rules.map((r) => (
              <div key={r.id as string} className="p-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    {r.aktif ? <CheckCircle2 size={13} className="text-emerald-500" /> : null}
                    {r.nama as string}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {r.min_kpi_score != null && `KPI ≥ ${r.min_kpi_score} · `}
                    {r.min_attendance_pct != null && `Kehadiran ≥ ${r.min_attendance_pct}% · `}
                    {r.no_active_warning ? "Tanpa SP aktif · " : ""}
                    {r.min_training_completion_pct != null && `Training ≥ ${r.min_training_completion_pct}% · `}
                    {r.calc_method === "fixed_amount" ? `Rp ${Number(r.calc_value).toLocaleString("id-ID")}` : `${r.calc_value}% dari Basic Salary`}
                    {" "}({r.reward_type as string})
                  </p>
                </div>
                <button onClick={() => handleDelete(r.id as string)} disabled={busy} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
