"use client";

import { useState } from "react";
import { Trophy, Plus, Star, Award, Medal, Clock, X } from "lucide-react";
import { nominateAward } from "@/app/actions/rewards";
import EmptyState from "@/components/EmptyState";

const CATEGORIES = ["Employee of the Month", "Best Performance", "Long Service Award", "Innovation Award"];

const CAT_META: Record<string, { icon: typeof Star; color: string; border: string; desc: string }> = {
  "Employee of the Month": { icon: Star, color: "bg-amber-50 text-amber-600", border: "border-amber-200", desc: "Karyawan terbaik setiap bulannya" },
  "Best Performance": { icon: Award, color: "bg-emerald-50 text-emerald-600", border: "border-emerald-200", desc: "Pencapaian kinerja tertinggi" },
  "Long Service Award": { icon: Clock, color: "bg-blue-50 text-blue-600", border: "border-blue-200", desc: "Pengabdian 5+ tahun" },
  "Innovation Award": { icon: Medal, color: "bg-purple-50 text-purple-600", border: "border-purple-200", desc: "Inovasi & ide kreatif" },
};

interface Employee { id: string; full_name: string; department: string; }
interface AwardEntry { id: string; employee_id: string; employee_name: string; department: string; category: string; description: string; award_date: string; given_by?: string; }

export default function AwardsClient({
  employees,
  initialAwards,
}: {
  employees: Employee[];
  initialAwards: AwardEntry[];
}) {
  const [awards, setAwards] = useState<AwardEntry[]>(initialAwards);
  const [showModal, setShowModal] = useState(false);
  const [empId, setEmpId] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [awardDate, setAwardDate] = useState(new Date().toISOString().slice(0, 7));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const handleSave = async () => {
    if (!empId) { showToast("Pilih karyawan."); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("employee_id", empId);
    fd.append("category", category);
    fd.append("description", description);
    fd.append("award_date", awardDate);
    const result = await nominateAward(fd);
    setSaving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Nominasi berhasil disimpan!");
    const emp = employees.find(e => e.id === empId);
    setAwards(prev => [{
      id: "local-" + Date.now(), employee_id: empId,
      employee_name: emp?.full_name || "Karyawan",
      department: emp?.department || "", category, description, award_date: awardDate,
    }, ...prev]);
    setEmpId(""); setCategory(CATEGORIES[0]); setDescription(""); setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800">Nominasi Penghargaan</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
                <select value={empId} onChange={e => setEmpId(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none">
                  <option value="">Pilih karyawan...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} - {e.department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kategori</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Periode</label>
                <input type="month" value={awardDate} onChange={e => setAwardDate(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Deskripsi / Alasan</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Alasan pemberian penghargaan..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none resize-none" />
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan Nominasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Penghargaan Karyawan</h1>
          <p className="text-sm text-gray-500">Kelola penghargaan dan apresiasi untuk karyawan berprestasi.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Nominasi Karyawan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.map(cat => {
          const meta = CAT_META[cat];
          const Icon = meta.icon;
          return (
            <div key={cat} className={`bg-white p-5 rounded-2xl border ${meta.border} shadow-sm hover:shadow-md transition-all`}>
              <div className="flex items-start justify-between">
                <div className={`p-2.5 ${meta.color} rounded-xl`}><Icon size={20} /></div>
                <span className="text-[9px] font-bold text-slate-400">{awards.filter(a => a.category === cat).length} penerima</span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 mt-3">{cat}</h3>
              <p className="text-[10px] text-slate-500 mt-1">{meta.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            Riwayat Penghargaan
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Daftar karyawan yang telah menerima penghargaan</p>
        </div>
        {awards.length === 0 ? (
          <EmptyState icon={Trophy} title="Belum ada penghargaan yang diberikan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Karyawan", "Kategori", "Periode", "Deskripsi"].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {awards.map(a => {
                  const meta = CAT_META[a.category] || CAT_META["Best Performance"];
                  const Icon = meta.icon;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {a.employee_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{a.employee_name}</p>
                            <p className="text-[10px] text-slate-400">{a.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 ${meta.color} rounded-lg text-[10px] font-bold flex items-center gap-1 w-fit`}>
                          <Icon size={10} /> {a.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{a.award_date}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{a.description || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
