"use client";

import { useState } from "react";
import { MessageCircle, Star, Send, User, Clock } from "lucide-react";
import { saveFeedback } from "@/app/actions/performance-hrd";
import EmptyState from "@/components/EmptyState";

interface Employee { id: string; full_name: string; kode?: string; department: string; }
interface FeedbackEntry { id: string; employee_id: string; reviewer_name: string; category: string; rating: number; comment: string; created_at: string; employees?: { full_name: string; kode?: string; department: string; position?: string; }; }

const CATEGORIES = ["Kinerja", "Kerjasama Tim", "Kepemimpinan", "Komunikasi", "Kehadiran", "Inisiatif", "Teknis"];

export default function FeedbackClient({
  employees,
  initialHistory,
}: {
  employees: Employee[];
  initialHistory: FeedbackEntry[];
}) {
  const [empId, setEmpId] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [history, setHistory] = useState<FeedbackEntry[]>(initialHistory);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSubmit = async () => {
    if (!empId) { showToast("Pilih karyawan yang dinilai."); return; }
    if (!category) { showToast("Pilih kategori feedback."); return; }
    if (!rating) { showToast("Pilih rating bintang."); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("employee_id", empId);
    fd.append("reviewer_name", reviewerName.trim());
    fd.append("category", category);
    fd.append("rating", rating.toString());
    fd.append("comment", comment);
    const result = await saveFeedback(fd);
    setSaving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Umpan balik berhasil dikirim!");
    const emp = employees.find(e => e.id === empId);
    const newEntry: FeedbackEntry = {
      id: "fb-local-" + Date.now(),
      employee_id: empId,
      reviewer_name: reviewerName.trim() || "Saya",
      category, rating, comment,
      created_at: new Date().toISOString(),
      employees: emp ? { full_name: emp.full_name, kode: emp.kode, department: emp.department } : undefined,
    };
    setHistory(prev => [newEntry, ...prev]);
    setEmpId(""); setReviewerName(""); setCategory(""); setRating(0); setComment("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <MessageCircle size={16} className="text-[#CC0000]" />
              Formulir Umpan Balik
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Isi form untuk memberikan umpan balik</p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan yang Dinilai</label>
              <select value={empId} onChange={e => setEmpId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                <option value="">Pilih Karyawan</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.full_name}{e.kode ? ` (${e.kode})` : ""} - {e.department}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Pemberi Umpan Balik</label>
              <input type="text" value={reviewerName} onChange={e => setReviewerName(e.target.value)}
                placeholder="Ketik nama Anda (opsional)"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                <option value="">Pilih Kategori</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rating</label>
              <div className="flex items-center gap-1 py-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-colors"
                  >
                    <Star
                      size={24}
                      className={star <= (hoverRating || rating) ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                    />
                  </button>
                ))}
                {rating > 0 && <span className="text-xs text-slate-500 ml-1">{rating}/5</span>}
              </div>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Komentar</label>
              <textarea
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Tulis komentar atau masukan Anda..."
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={14} /> {saving ? "Mengirim..." : "Kirim Umpan Balik"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Umpan Balik</h3>
            <p className="text-xs text-slate-400 mt-0.5">Semua umpan balik yang telah diberikan</p>
          </div>
          {history.length === 0 ? (
            <EmptyState icon={MessageCircle} title="Belum ada riwayat umpan balik." />
          ) : (
            <div className="divide-y divide-slate-50">
              {history.map(fb => {
                const emp = fb.employees;
                return (
                  <div key={fb.id} className="p-6 hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800">
                            {emp?.full_name || "Karyawan"}{emp?.kode ? ` (${emp.kode})` : ""}
                          </h4>
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">{fb.category}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={10} className={star <= fb.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                            ))}
                          </div>
                        </div>
                        {(emp?.department || emp?.position) && (
                          <p className="text-[10px] text-slate-400 mb-1.5">{[emp?.position, emp?.department].filter(Boolean).join(" — ")}</p>
                        )}
                        {fb.comment && <p className="text-xs text-slate-600 leading-relaxed">{fb.comment}</p>}
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><User size={9} /> {fb.reviewer_name || "Anonim"}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={9} /> {new Date(fb.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4">Ringkasan Kategori</h3>
          <div className="space-y-3">
            {CATEGORIES.slice(0, 5).map(cat => {
              const catFeedback = history.filter(fb => fb.category === cat);
              const avg = catFeedback.length > 0
                ? (catFeedback.reduce((sum, fb) => sum + (Number(fb.rating) || 0), 0) / catFeedback.length)
                : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{cat}</span>
                    <span className="text-slate-400">{catFeedback.length > 0 ? avg.toFixed(1) : "—"}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-[#CC0000]" style={{ width: `${(avg / 5) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
