"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { addSuccessionCandidate } from "@/app/actions/succession";

interface Employee { id: string; full_name: string; position: string; }

interface AddedCandidate {
  id: string;
  employee: { full_name: string; position?: string } | null;
  target_position: { full_name: string; position?: string } | null;
  readiness_override: number | null;
  notes: string | null;
}

export default function AddCandidateForm({
  employees, managers, addedCandidates,
}: {
  employees: Employee[];
  managers: Employee[];
  addedCandidates: AddedCandidate[];
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [readiness, setReadiness] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const handleSubmit = async () => {
    if (!employeeId) { showToast("Pilih karyawan terlebih dahulu."); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("employee_id", employeeId);
    fd.append("target_position_employee_id", targetId);
    fd.append("readiness_override", readiness);
    fd.append("notes", notes);
    const result = await addSuccessionCandidate(fd);
    setSaving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Kandidat ditambahkan ke rencana suksesi.");
    setEmployeeId(""); setTargetId(""); setReadiness(""); setNotes("");
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
        <h3 className="font-extrabold text-slate-800 text-sm">Tambah Kandidat</h3>
        <p className="text-xs text-slate-400 mt-0.5">Tambahkan kandidat ke rencana suksesi</p>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pilih Karyawan</label>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
            <option value="">Pilih karyawan...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Posisi Target Suksesi</label>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
            <option value="">Pilih posisi target...</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.position}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tingkat Kesiapan (%)</label>
          <input type="number" min="0" max="100" placeholder="0-100" value={readiness}
            onChange={(e) => setReadiness(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Catatan</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none resize-none"
            placeholder="Catatan opsional..." />
        </div>
        <button onClick={handleSubmit} disabled={saving}
          className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
          <UserPlus size={14} /> {saving ? "Menyimpan..." : "Tambah ke Rencana Suksesi"}
        </button>

        {addedCandidates.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Kandidat Rencana Suksesi ({addedCandidates.length})</p>
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {addedCandidates.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-800">{c.employee?.full_name || "-"}</p>
                  {c.target_position && (
                    <p className="text-[10px] text-slate-500">Target: {c.target_position.position}</p>
                  )}
                  {c.readiness_override !== null && (
                    <p className="text-[10px] text-slate-500">Kesiapan: {c.readiness_override}%</p>
                  )}
                  {c.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{c.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
