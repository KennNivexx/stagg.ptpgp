"use client";

import { useState } from "react";
import { MessageCircle, Clock, Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { submitComplaint, updateComplaintStatus } from "@/app/actions/relations";
import EmptyState from "@/components/EmptyState";

const CATEGORIES = ["Tempat Kerja", "Pelecehan", "Diskriminasi", "Keselamatan", "Lainnya"];
const STATUSES = ["Diajukan", "Diselidiki", "Selesai"];

interface Employee { id: string; full_name: string; department: string; }
interface Complaint { id: string; employee_id: string; employee_name: string; subject: string; category: string; description: string; status: string; notes?: string; resolved_by?: string; created_at: string; }

export default function ComplaintsClient({
  employees,
  initialComplaints,
}: {
  employees: Employee[];
  initialComplaints: Complaint[];
}) {
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [empId, setEmpId] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Tempat Kerja");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [resolveId, setResolveId] = useState("");
  const [resolveStatus, setResolveStatus] = useState("Selesai");
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const counts = {
    diajukan: complaints.filter(c => c.status === "Diajukan").length,
    diselidiki: complaints.filter(c => c.status === "Diselidiki").length,
    selesai: complaints.filter(c => c.status === "Selesai").length,
  };

  const handleSubmit = async () => {
    if (!empId || !subject || !description) { showToast("Pelapor, subjek, dan deskripsi wajib diisi."); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("employee_id", empId);
    fd.append("subject", subject);
    fd.append("category", category);
    fd.append("description", description);
    const result = await submitComplaint(fd);
    setSaving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Keluhan berhasil dicatat.");
    const emp = employees.find(e => e.id === empId);
    const newC: Complaint = {
      id: "local-" + Date.now(),
      employee_id: empId,
      employee_name: emp?.full_name || "Karyawan",
      subject, category, description, status: "Diajukan",
      created_at: new Date().toISOString(),
    };
    setComplaints(prev => [newC, ...prev]);
    setEmpId(""); setSubject(""); setCategory("Tempat Kerja"); setDescription("");
  };

  const handleResolve = async () => {
    if (!resolveId) { showToast("Pilih keluhan yang akan diselesaikan."); return; }
    setResolving(true);
    const result = await updateComplaintStatus(resolveId, resolveStatus, resolveNotes);
    setResolving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Status keluhan diperbarui.");
    setComplaints(prev => prev.map(c => c.id === resolveId ? { ...c, status: resolveStatus, notes: resolveNotes } : c));
    setResolveId(""); setResolveNotes("");
  };

  const statusBadge = (status: string) => {
    if (status === "Selesai") return "bg-emerald-50 text-emerald-700";
    if (status === "Diselidiki") return "bg-blue-50 text-blue-700";
    return "bg-amber-50 text-amber-700";
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Diajukan", count: counts.diajukan, icon: <Clock size={18} />, color: "amber" },
          { label: "Diselidiki", count: counts.diselidiki, icon: <Search size={18} />, color: "blue" },
          { label: "Selesai", count: counts.selesai, icon: <CheckCircle2 size={18} />, color: "emerald" },
          { label: "Total", count: complaints.length, icon: <AlertTriangle size={18} />, color: "red" },
        ].map(({ label, count, icon, color }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 bg-${color}-50 text-${color}-600 rounded-xl`}>{icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                <p className="text-xl font-extrabold text-slate-800">{count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Keluhan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Semua pengaduan karyawan</p>
          </div>
          {complaints.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="Belum ada keluhan tercatat."
              className="border-none"
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {complaints.map(c => (
                <div key={c.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-slate-800">{c.employee_name}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{c.category}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge(c.status)}`}>{c.status}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700">{c.subject}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{c.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(c.created_at).toLocaleDateString("id-ID")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Catat Keluhan Baru</h3>
            <p className="text-xs text-slate-400 mt-0.5">Formulir pencatatan keluhan</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pelapor</label>
              <select value={empId} onChange={e => setEmpId(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none">
                <option value="">Pilih karyawan...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Subjek</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none"
                placeholder="Ringkasan keluhan..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kategori</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Deskripsi Keluhan</label>
              <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none resize-none"
                placeholder="Jelaskan detail keluhan..." />
            </div>
            <button onClick={handleSubmit} disabled={saving}
              className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Keluhan"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Resolusi Keluhan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Catat tindakan dan hasil investigasi</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pilih Keluhan</label>
              <select value={resolveId} onChange={e => setResolveId(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none">
                <option value="">Pilih keluhan...</option>
                {complaints.filter(c => c.status !== "Selesai").map(c => (
                  <option key={c.id} value={c.id}>{c.employee_name} — {c.subject}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Status Akhir</label>
              <select value={resolveStatus} onChange={e => setResolveStatus(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Catatan Tindakan</label>
              <textarea rows={2} value={resolveNotes} onChange={e => setResolveNotes(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none resize-none"
                placeholder="Tindakan yang telah diambil..." />
            </div>
            <div>
              <button onClick={handleResolve} disabled={resolving}
                className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {resolving ? "Menyimpan..." : "Perbarui Status"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
