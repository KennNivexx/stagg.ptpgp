"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, RefreshCw, Info } from "lucide-react";
import { getTaxConfig, saveTaxConfig } from "@/app/actions/admin";

const DEFAULT_CONFIG = {
  ptkp_tk0: 54_000_000,
  ptkp_tk1: 58_500_000,
  ptkp_tk2: 63_000_000,
  ptkp_tk3: 67_500_000,
  ptkp_k0: 58_500_000,
  ptkp_k1: 63_000_000,
  ptkp_k2: 67_500_000,
  ptkp_k3: 72_000_000,
  brackets: [
    { min: 0, max: 60_000_000, rate: 5 },
    { min: 60_000_000, max: 250_000_000, rate: 15 },
    { min: 250_000_000, max: 500_000_000, rate: 25 },
    { min: 500_000_000, max: 5_000_000_000, rate: 30 },
    { min: 5_000_000_000, max: null, rate: 35 },
  ],
};

const fmt = (n: number | null) => n !== null ? new Intl.NumberFormat("id-ID").format(n) : "∞";
const rp = (v: string) => parseInt(v.replace(/\D/g, ""), 10) || 0;

export default function TaxConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [cfg, setCfg] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    getTaxConfig().then(data => {
      if (data) setCfg({ ...DEFAULT_CONFIG, ...(data as typeof DEFAULT_CONFIG) });
      setLoading(false);
    });
  }, []);

  const updatePtkp = (key: keyof typeof cfg, val: string) => {
    setCfg({ ...cfg, [key]: rp(val) });
  };

  const updateBracket = (idx: number, field: "min" | "max" | "rate", val: string) => {
    const br = [...cfg.brackets];
    if (field === "max" && val === "") {
      br[idx] = { ...br[idx], max: null };
    } else {
      br[idx] = { ...br[idx], [field]: field === "rate" ? parseFloat(val) || 0 : rp(val) };
    }
    setCfg({ ...cfg, brackets: br });
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveTaxConfig(cfg as unknown as Record<string, unknown>);
    setSaving(false);
    if (res.error) { setMsg({ type: "error", text: res.error }); return; }
    setMsg({ type: "success", text: "Konfigurasi PPh 21 berhasil disimpan. Berlaku untuk payslip berikutnya." });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const reset = () => { if (confirm("Reset ke nilai default 2024?")) setCfg(DEFAULT_CONFIG); };

  if (loading) return <div className="p-8 text-sm text-gray-500 text-center">Memuat...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/hrd/rewards/payroll" className="inline-flex items-center text-xs text-gray-500 hover:text-red-600 mb-3 font-semibold">
          <ArrowLeft size={14} className="mr-1" /> Payroll
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Konfigurasi PPh 21</h1>
            <p className="text-xs text-slate-500 mt-0.5">Atur PTKP dan tarif pajak — dihitung otomatis saat generate payslip</p>
          </div>
          <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 underline">Reset Default 2024</button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700">
          <strong>Cara kerja:</strong> PPh 21 dihitung otomatis saat generate slip gaji.<br />
          Formula: <strong>PKP = (Gaji Pokok + Tunjangan) × 12 − PTKP</strong> → tarif progresif → dibagi 12 = pajak bulanan.<br />
          Status PTKP per karyawan diatur di menu <strong>Komponen Gaji</strong>.
        </div>
      </div>

      {msg.text && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${msg.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="space-y-6">
        {/* PTKP */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-bold text-slate-800">PTKP (Penghasilan Tidak Kena Pajak)</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Dalam Rupiah per tahun</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            {[
              { key: "ptkp_tk0", label: "TK/0 — Tidak kawin, 0 tanggungan" },
              { key: "ptkp_tk1", label: "TK/1 — Tidak kawin, 1 tanggungan" },
              { key: "ptkp_tk2", label: "TK/2 — Tidak kawin, 2 tanggungan" },
              { key: "ptkp_tk3", label: "TK/3 — Tidak kawin, 3 tanggungan" },
              { key: "ptkp_k0", label: "K/0 — Kawin, 0 tanggungan" },
              { key: "ptkp_k1", label: "K/1 — Kawin, 1 tanggungan" },
              { key: "ptkp_k2", label: "K/2 — Kawin, 2 tanggungan" },
              { key: "ptkp_k3", label: "K/3 — Kawin, 3 tanggungan" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1">{label}</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Rp</span>
                  <input type="text" value={new Intl.NumberFormat("id-ID").format(cfg[key as keyof typeof cfg] as number)}
                    onChange={e => updatePtkp(key as keyof typeof cfg, e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-red-400 text-right" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Brackets */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-bold text-slate-800">Tarif Progresif PPh 21</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">PKP tahunan — Rupiah. Kolom Maks kosong = tidak terbatas</p>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                  <th className="pb-2 pr-3">Lapisan</th>
                  <th className="pb-2 pr-3">Min (Rp)</th>
                  <th className="pb-2 pr-3">Maks (Rp)</th>
                  <th className="pb-2">Tarif (%)</th>
                </tr>
              </thead>
              <tbody>
                {cfg.brackets.map((br, idx) => (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="py-2 pr-3 font-semibold text-slate-700">Lapisan {idx + 1}</td>
                    <td className="py-2 pr-3">
                      <input type="text" value={new Intl.NumberFormat("id-ID").format(br.min)}
                        onChange={e => updateBracket(idx, "min", e.target.value)}
                        className="w-32 border border-slate-200 rounded-lg p-1.5 text-right outline-none focus:border-red-400" />
                    </td>
                    <td className="py-2 pr-3">
                      <input type="text" value={br.max !== null ? new Intl.NumberFormat("id-ID").format(br.max) : ""}
                        onChange={e => updateBracket(idx, "max", e.target.value)}
                        className="w-32 border border-slate-200 rounded-lg p-1.5 text-right outline-none focus:border-red-400"
                        placeholder="∞" />
                    </td>
                    <td className="py-2">
                      <input type="number" value={br.rate} onChange={e => updateBracket(idx, "rate", e.target.value)}
                        className="w-16 border border-slate-200 rounded-lg p-1.5 text-center outline-none focus:border-red-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Preview */}
          <div className="px-4 pb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Preview Ringkasan</p>
            <div className="flex flex-wrap gap-2">
              {cfg.brackets.map((br, idx) => (
                <span key={idx} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 font-medium">
                  {fmt(br.min / 1_000_000)}jt – {br.max !== null ? fmt(br.max / 1_000_000) + "jt" : "∞"}: <strong>{br.rate}%</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><RefreshCw size={14} className="animate-spin" /> Menyimpan...</> : <><Save size={14} /> Simpan Konfigurasi PPh 21</>}
        </button>
      </div>
    </div>
  );
}
