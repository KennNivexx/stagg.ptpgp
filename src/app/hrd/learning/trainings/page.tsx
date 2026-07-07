"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Calendar, Users, X, Save, Pencil, Trash2,
  AlertTriangle, CheckCircle2, Clock, Inbox, ThumbsUp, ThumbsDown, Building2,
} from "lucide-react";
import {
  getTrainings, saveTraining, deleteTraining, getTrainingEnrollments, removeEnrollment,
  getTrainingRequests, reviewTrainingRequest, markEnrollmentResult, type TrainingRequest,
} from "@/app/actions/trainings";
import { getSkills } from "@/app/actions/skills";
import EmptyState from "@/components/EmptyState";

type Skill = {
  id: string;
  name: string;
  category: string;
};

type Training = {
  id: string;
  title: string;
  skill_id: string | null;
  description: string;
  date_start: string;
  date_end: string;
  status: string;
  enrollment_count: number;
  department?: string | null;
  source_request_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Enrollment = {
  id: string;
  training_id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  employee_department: string;
  employee_position: string;
  status: string;
  created_at: string;
};

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getStatusColor(status: string) {
  const s = status?.toLowerCase() || "";
  if (s === "completed" || s === "selesai") return "bg-slate-100 text-slate-600";
  if (s === "active" || s === "aktif" || s === "ongoing" || s === "berlangsung") return "bg-emerald-50 text-emerald-700";
  if (s === "planned" || s === "rencana") return "bg-amber-50 text-amber-700";
  return "bg-blue-50 text-blue-600";
}

function getStatusLabel(status: string) {
  const s = status?.toLowerCase() || "";
  if (s === "completed" || s === "selesai") return "Selesai";
  if (s === "active" || s === "aktif" || s === "ongoing" || s === "berlangsung") return "Aktif";
  if (s === "planned" || s === "rencana") return "Planned";
  return status || "-";
}

export default function TrainingsPage() {
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const [modal, setModal] = useState<null | "edit" | "del">(null);
  const [formData, setFormData] = useState({
    id: "", title: "", skill_id: "", description: "", date_start: "", date_end: "", status: "Planned",
  });
  const [formErr, setFormErr] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(true);

  const showToast = (type: "error" | "success", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadRequests = async () => {
    try {
      const r = await getTrainingRequests();
      setRequests(r);
    } catch {
      showToast("error", "Gagal memuat permintaan pelatihan.");
    }
  };

  const doReview = async (id: string, approve: boolean) => {
    setReviewingId(id);
    const r = await reviewTrainingRequest(id, approve);
    setReviewingId(null);
    if (r?.error) { showToast("error", r.error); return; }
    showToast("success", approve ? "Permintaan disetujui — program pelatihan otomatis dibuat." : "Permintaan ditolak.");
    await loadRequests();
    await refreshTrainings();
  };

  const loadData = async () => {
    try {
      const [t, s] = await Promise.all([getTrainings(), getSkills()]);
      loadRequests();
      setTrainings(t as Training[]);
      setSkills(s as Skill[]);
    } catch {
      showToast("error", "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const refreshTrainings = async () => {
    try {
      const t = await getTrainings();
      setTrainings(t as Training[]);
      router.refresh();
    } catch {
      showToast("error", "Gagal memuat ulang data.");
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!expandedId) { setEnrollments([]); return; }
    setLoadingEnrollments(true);
    getTrainingEnrollments(expandedId)
      .then((data) => setEnrollments((data as Enrollment[]) || []))
      .catch(() => showToast("error", "Gagal memuat peserta."))
      .finally(() => setLoadingEnrollments(false));
  }, [expandedId]);

  const stats = useMemo(() => {
    const total = trainings.length;
    const planned = trainings.filter((t) => {
      const s = t.status?.toLowerCase() || "";
      return s === "planned" || s === "rencana";
    }).length;
    const active = trainings.filter((t) => {
      const s = t.status?.toLowerCase() || "";
      return s === "active" || s === "aktif" || s === "ongoing" || s === "berlangsung";
    }).length;
    const completed = trainings.filter((t) => {
      const s = t.status?.toLowerCase() || "";
      return s === "completed" || s === "selesai";
    }).length;
    return { total, planned, active, completed };
  }, [trainings]);

  const skillMap = useMemo(() => {
    const map: Record<string, Skill> = {};
    skills.forEach((s) => { map[s.id] = s; });
    return map;
  }, [skills]);

  const openEdit = (t: Training) => {
    setFormData({
      id: t.id, title: t.title, skill_id: t.skill_id || "",
      description: t.description || "", date_start: t.date_start || "",
      date_end: t.date_end || "", status: t.status || "Planned",
    });
    setFormErr("");
    setModal("edit");
  };

  const openDel = (t: Training) => {
    setFormData({ ...formData, id: t.id, title: t.title });
    setFormErr("");
    setModal("del");
  };

  const closeModal = () => {
    setModal(null);
    setFormData({ id: "", title: "", skill_id: "", description: "", date_start: "", date_end: "", status: "Planned" });
    setFormErr("");
  };

  const doSave = async () => {
    const title = formData.title.trim();
    if (!title) { setFormErr("Judul training wajib diisi."); return; }
    if (!formData.date_start) { setFormErr("Tanggal mulai wajib diisi."); return; }
    if (!formData.date_end) { setFormErr("Tanggal selesai wajib diisi."); return; }
    if (new Date(formData.date_end) < new Date(formData.date_start)) {
      setFormErr("Tanggal selesai harus setelah tanggal mulai."); return;
    }

    setFormLoading(true);
    setFormErr("");
    const fd = new FormData();
    if (formData.id) fd.append("id", formData.id);
    fd.append("title", title);
    fd.append("skill_id", formData.skill_id);
    fd.append("description", formData.description.trim());
    fd.append("date_start", formData.date_start);
    fd.append("date_end", formData.date_end);
    fd.append("status", formData.status);

    const r = await saveTraining(fd);
    setFormLoading(false);
    if (r?.error) { showToast("error", r.error); setFormErr(r.error); return; }
    showToast("success", formData.id ? "Training berhasil diupdate." : "Training berhasil ditambahkan.");
    closeModal();
    await refreshTrainings();
  };

  const doDelete = async () => {
    if (!formData.id) return;
    setFormLoading(true);
    const r = await deleteTraining(formData.id);
    setFormLoading(false);
    if (r?.error) { showToast("error", r.error); return; }
    showToast("success", "Training berhasil dihapus.");
    closeModal();
    await refreshTrainings();
  };

  const doRemoveEnrollment = async (id: string) => {
    setRemovingId(id);
    const r = await removeEnrollment(id);
    setRemovingId(null);
    if (r?.error) { showToast("error", r.error); return; }
    showToast("success", "Peserta berhasil dihapus.");
    setEnrollments((prev) => prev.filter((e) => e.id !== id));
    await refreshTrainings();
  };

  const doMarkResult = async (id: string, passed: boolean) => {
    setRemovingId(id);
    const r = await markEnrollmentResult(id, passed);
    setRemovingId(null);
    if ("error" in r) { showToast("error", r.error); return; }
    showToast("success", passed ? "Peserta ditandai lulus." : "Peserta ditandai perlu mengulang.");
    setEnrollments((prev) => prev.map((e) => (e.id === id ? { ...e, status: passed ? "Completed" : "Perlu Mengulang" } : e)));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-[#1A2530]">Daftar Training</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola pelatihan, jadwal, dan peserta training perusahaan. Program baru hanya dibuat dengan menyetujui
          <span className="font-semibold"> Permintaan Training</span> yang diajukan Kepala Departemen berdasarkan Analisis Kesenjangan Kompetensi.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Training", value: stats.total, icon: <GraduationCap size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Planned", value: stats.planned, icon: <Calendar size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Aktif", value: stats.active, icon: <Clock size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Selesai", value: stats.completed, icon: <CheckCircle2 size={18} />, color: "bg-slate-100 text-slate-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permintaan Training dari Kepala Departemen (berdasarkan Analisis Kesenjangan) */}
      {requests.filter((r) => r.status === "Pending").length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <button onClick={() => setShowRequests((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 bg-amber-50/50 hover:bg-amber-50 transition-colors">
            <div className="flex items-center gap-2">
              <Inbox size={16} className="text-amber-600" />
              <div className="text-left">
                <h3 className="font-extrabold text-slate-800 text-sm">Permintaan Training dari Departemen</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Diajukan Kepala Departemen berdasarkan Analisis Kesenjangan Kompetensi</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold shrink-0">
              {requests.filter((r) => r.status === "Pending").length} menunggu
            </span>
          </button>
          {showRequests && (
            <div className="divide-y divide-slate-50">
              {requests.filter((r) => r.status === "Pending").map((r) => (
                <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
                        <Building2 size={10} /> {r.department}
                      </span>
                      <p className="font-bold text-sm text-slate-800">{r.skill_name}</p>
                      {r.current_level != null && r.required_level != null && (
                        <span className="text-[10px] text-slate-400">Level {r.current_level} &rarr; {r.required_level}</span>
                      )}
                    </div>
                    {r.reason && <p className="text-xs text-slate-500 mt-1.5">{r.reason}</p>}
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Diajukan oleh {r.requested_by_name || r.requested_by} &middot; {new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => doReview(r.id, false)} disabled={reviewingId === r.id}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5">
                      <ThumbsDown size={12} /> Tolak
                    </button>
                    <button onClick={() => doReview(r.id, true)} disabled={reviewingId === r.id}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5">
                      <ThumbsUp size={12} /> {reviewingId === r.id ? "Memproses..." : "Setujui"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
          <p className="text-sm text-slate-400">Memuat data...</p>
        </div>
      ) : trainings.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Belum ada training."
          description="Program training akan muncul di sini setelah ada Permintaan Training dari Kepala Departemen yang disetujui."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Training</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skill</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Peserta</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {trainings.map((t) => {
                  const skill = t.skill_id ? skillMap[t.skill_id] : null;
                  const isExpanded = expandedId === t.id;
                  return (
                    <tr key={t.id}>
                      <td colSpan={isExpanded ? 0 : 1} className="py-3 px-4">
                        <div>
                          <span className="text-xs font-bold text-slate-800">{t.title}</span>
                          {t.department && (
                            <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold align-middle">
                              <Building2 size={9} /> {t.department}
                            </span>
                          )}
                          {t.description && (
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{t.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {skill ? (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold">
                            {skill.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-700">{formatDate(t.date_start)}</p>
                          <p className="text-[9px] text-slate-400">s/d {formatDate(t.date_end)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusColor(t.status)}`}>
                          {getStatusLabel(t.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users size={12} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">{t.enrollment_count}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : t.id)}
                            className="px-2.5 py-1.5 rounded-lg hover:bg-blue-100 text-blue-600 text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                            title="Lihat Peserta"
                          >
                            <Users size={11} /> Peserta
                          </button>
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-sky-100 text-sky-600 transition-colors" title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => openDel(t)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors" title="Hapus">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {expandedId && (
            <div className="border-t border-slate-200 bg-slate-50/30 p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Users size={14} /> Daftar Peserta
                </h4>
                <button onClick={() => setExpandedId(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400">
                  <X size={14} />
                </button>
              </div>

              {loadingEnrollments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#CC0000] mx-auto" />
                </div>
              ) : enrollments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada peserta terdaftar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Nama</th>
                        <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Departemen</th>
                        <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Posisi</th>
                        <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                        <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enrollments.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-100/50 transition-colors">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[8px] shrink-0">
                                {e.employee_name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <span className="text-xs font-bold text-slate-800">{e.employee_name}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] text-slate-500">{e.employee_department || "-"}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] text-slate-500">{e.employee_position || "-"}</span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              e.status === "Completed" ? "bg-emerald-50 text-emerald-700"
                              : e.status === "Perlu Mengulang" ? "bg-amber-50 text-amber-700"
                              : "bg-blue-50 text-blue-600"
                            }`}>
                              {e.status === "Completed" ? "Selesai" : e.status === "Perlu Mengulang" ? "Perlu Mengulang" : "Terdaftar"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {e.status !== "Completed" && (
                                <button
                                  onClick={() => doMarkResult(e.id, true)}
                                  disabled={removingId === e.id}
                                  className="p-1 rounded hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 disabled:opacity-30 transition-colors"
                                  title="Tandai Lulus"
                                >
                                  <ThumbsUp size={12} />
                                </button>
                              )}
                              {e.status !== "Perlu Mengulang" && (
                                <button
                                  onClick={() => doMarkResult(e.id, false)}
                                  disabled={removingId === e.id}
                                  className="p-1 rounded hover:bg-amber-50 text-amber-500 hover:text-amber-700 disabled:opacity-30 transition-colors"
                                  title="Tandai Perlu Mengulang"
                                >
                                  <ThumbsDown size={12} />
                                </button>
                              )}
                              <button
                                onClick={() => doRemoveEnrollment(e.id)}
                                disabled={removingId === e.id}
                                className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                                title="Hapus Peserta"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[8vh]" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className={`px-5 py-4 flex items-center justify-between ${modal === "del" ? "bg-red-500" : "bg-slate-900"}`}>
              <div className="flex items-center gap-2.5">
                {modal === "edit" && <Pencil size={18} className="text-sky-400" />}
                {modal === "del" && <Trash2 size={18} className="text-white" />}
                <h3 className="text-white font-bold text-sm">
                  {modal === "edit" && `Edit: ${formData.title}`}
                  {modal === "del" && "Hapus Training?"}
                </h3>
              </div>
              <button onClick={closeModal} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>

            {modal === "del" ? (
              <div className="p-5">
                <p className="text-slate-600 text-sm mb-1">
                  Anda akan menghapus training <span className="font-black text-slate-900">&ldquo;{formData.title}&rdquo;</span>.
                  Tindakan ini tidak dapat diurungkan dan akan menghapus semua data peserta terkait.
                </p>
                {formErr && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mt-3">
                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    <p className="text-red-600 text-sm">{formErr}</p>
                  </div>
                )}
                <div className="flex gap-3 mt-5">
                  <button onClick={closeModal} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">Batal</button>
                  <button onClick={doDelete} disabled={formLoading}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
                    {formLoading ? "Menghapus..." : "Ya, Hapus"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Judul Training <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Pelatihan Kepemimpinan Dasar"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Skill Terkait
                  </label>
                  <select
                    value={formData.skill_id}
                    onChange={(e) => setFormData({ ...formData, skill_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                  >
                    <option value="">-- Tidak terkait skill --</option>
                    {skills.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi training..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Tanggal Mulai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date_start}
                      onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Tanggal Selesai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date_end}
                      onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                {formErr && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    <p className="text-red-600 text-sm">{formErr}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button onClick={closeModal} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">Batal</button>
                  <button onClick={doSave} disabled={formLoading}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors inline-flex items-center justify-center gap-2">
                    <Save size={14} /> {formLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
