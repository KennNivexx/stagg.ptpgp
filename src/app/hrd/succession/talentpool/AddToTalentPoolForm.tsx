"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { addToTalentPool } from "@/app/actions/succession";

interface Employee { id: string; full_name: string; }

interface PoolEntry {
  id: string;
  employee: { full_name: string; position?: string } | null;
  potential_rating: string;
  notes: string | null;
}

const RATINGS = [
  { value: "Bintang", label: "Bintang - Potensi Tinggi" },
  { value: "Potensial Tinggi", label: "Potensial Tinggi" },
  { value: "Solid", label: "Solid" },
  { value: "Perlu Pengembangan", label: "Perlu Pengembangan" },
];

const ratingColor = (rating: string) => {
  if (rating === "Bintang") return "bg-emerald-50 text-emerald-700";
  if (rating === "Potensial Tinggi") return "bg-blue-50 text-blue-700";
  if (rating === "Solid") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
};

export default function AddToTalentPoolForm({
  employees, poolEntries,
}: {
  employees: Employee[];
  poolEntries: PoolEntry[];
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const handleSubmit = async () => {
    if (!employeeId) { showToast("Pilih karyawan terlebih dahulu."); return; }
    if (!rating) { showToast("Pilih rating potensi terlebih dahulu."); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("employee_id", employeeId);
    fd.append("potential_rating", rating);
    fd.append("notes", notes);
    const result = await addToTalentPool(fd);
    setSaving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Karyawan ditambahkan ke talent pool.");
    setEmployeeId(""); setRating(""); setNotes("");
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
        <h3 className="font-extrabold text-slate-800 text-sm">Tambah ke Talent Pool</h3>
        <p className="text-xs text-slate-400 mt-0.5">Masukkan karyawan ke talent pool</p>
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
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Rating Potensi</label>
          <select value={rating} onChange={(e) => setRating(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
            <option value="">Pilih rating...</option>
            {RATINGS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Catatan</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none resize-none"
            placeholder="Alasan masuk talent pool..." />
        </div>
        <button onClick={handleSubmit} disabled={saving}
          className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
          <Star size={14} /> {saving ? "Menyimpan..." : "Tambah ke Talent Pool"}
        </button>

        {poolEntries.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ditambahkan Manual ({poolEntries.length})</p>
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {poolEntries.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{p.employee?.full_name || "-"}</p>
                    {p.notes && <p className="text-[10px] text-slate-400 italic truncate">{p.notes}</p>}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${ratingColor(p.potential_rating)}`}>
                    {p.potential_rating}
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
