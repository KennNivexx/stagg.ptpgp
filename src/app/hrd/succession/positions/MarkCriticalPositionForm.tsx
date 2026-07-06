"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { addCriticalPosition } from "@/app/actions/succession";

interface Employee { id: string; full_name: string; position: string; }

interface MarkedPosition {
  id: string;
  employee: { full_name: string; position?: string } | null;
  risk_level: string;
  vacancy_risk_date: string | null;
}

const RISK_LEVELS = ["Rendah", "Sedang", "Tinggi"];

export default function MarkCriticalPositionForm({
  employees, markedPositions,
}: {
  employees: Employee[];
  markedPositions: MarkedPosition[];
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [vacancyDate, setVacancyDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const handleSubmit = async () => {
    if (!employeeId) { showToast("Pilih karyawan terlebih dahulu."); return; }
    if (!riskLevel) { showToast("Pilih tingkat risiko terlebih dahulu."); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("employee_id", employeeId);
    fd.append("risk_level", riskLevel);
    fd.append("vacancy_risk_date", vacancyDate);
    const result = await addCriticalPosition(fd);
    setSaving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Posisi ditandai sebagai kritis.");
    setEmployeeId(""); setRiskLevel(""); setVacancyDate("");
    router.refresh();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-sm">Tandai Posisi Kritis</h3>
        <p className="text-xs text-slate-400 mt-0.5">Formulir identifikasi posisi kritis baru</p>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pilih Karyawan</label>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
            <option value="">Pilih karyawan...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name} - {e.position}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tingkat Risiko</label>
          <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
            <option value="">Pilih risiko...</option>
            {RISK_LEVELS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Risiko Kekosongan</label>
          <input type="date" value={vacancyDate} onChange={(e) => setVacancyDate(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
        </div>
        <button onClick={handleSubmit} disabled={saving}
          className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
          <ShieldAlert size={14} /> {saving ? "Menyimpan..." : "Tandai sebagai Posisi Kritis"}
        </button>

        {markedPositions.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Posisi Ditandai Manual ({markedPositions.length})</p>
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {markedPositions.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{p.employee?.full_name || "-"}</p>
                    <p className="text-[10px] text-slate-500">{p.employee?.position || "-"}</p>
                    {p.vacancy_risk_date && (
                      <p className="text-[10px] text-slate-400">Risiko kosong: {new Date(p.vacancy_risk_date).toLocaleDateString("id-ID")}</p>
                    )}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.risk_level === "Tinggi" ? "bg-red-50 text-red-700" :
                    p.risk_level === "Sedang" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {p.risk_level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
