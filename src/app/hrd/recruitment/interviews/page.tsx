"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { scheduleInterview } from "@/app/actions/recruitment";
import {
  Calendar, Clock, MapPin, Video, User, Users, X, Save, Phone, Mail,
  FileText, CalendarDays, List, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function fmtDate(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

type Interview = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  applied_at: string;
  job_id: string;
  interview_date?: string;
  interview_time?: string;
  interviewer?: string;
  interview_location?: string;
  interview_online_link?: string;
  interview_notes?: string;
  test_tulis_result?: { score?: number; passed?: boolean } | null;
  test_psikotes_result?: { overall?: number } | null;
};

function TestResultBadges({ iv }: { iv: Interview }) {
  const tulis = iv.test_tulis_result;
  const psikotes = iv.test_psikotes_result;
  if (!tulis && !psikotes) return <span className="text-slate-300 text-[10px]">-</span>;
  return (
    <div className="flex flex-col gap-1">
      {tulis && (
        <span className={`inline-flex w-fit items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${tulis.passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          Tulis: {tulis.score}% {tulis.passed ? "(Lulus)" : "(Tidak Lulus)"}
        </span>
      )}
      {psikotes && (
        <span className="inline-flex w-fit items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700">
          Psikotes: {psikotes.overall}%
        </span>
      )}
    </div>
  );
}

export default function JadwalInterview() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    interview_date: "",
    interview_time: "09:00",
    interviewer: "",
    interview_location: "",
    interview_online_link: "",
    interview_notes: "",
  });

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const load = () => {
    setLoading(true);
    supabase
      .from("pelamar")
      .select("*")
      .eq("status", "Interview")
      .order("applied_at", { ascending: false })
      .then(async ({ data }) => {
        const apps = (data || []) as Record<string, unknown>[];
        const jobIds = [...new Set(apps.map((a) => a.job_id as string).filter(Boolean))];
        const jobMap = new Map<string, string>();
        if (jobIds.length > 0) {
          const { data: jobs } = await supabase.from("lowongan_kerja").select("id, position").in("id", jobIds);
          (jobs || []).forEach((j: Record<string, unknown>) => jobMap.set(j.id as string, j.position as string));
        }
        const mapped = apps.map((app) => ({
          id: app.id as string,
          full_name: app.full_name as string,
          email: app.email as string,
          phone: (app.phone as string) || "",
          job_title: jobMap.get(app.job_id as string) || "-",
          applied_at: app.applied_at as string,
          job_id: app.job_id as string,
          interview_date: (app.interview_date as string) || "",
          interview_time: (app.interview_time as string) || "",
          interviewer: (app.interviewer as string) || "",
          interview_location: (app.interview_location as string) || "",
          interview_online_link: (app.interview_online_link as string) || "",
          interview_notes: (app.interview_notes as string) || "",
          test_tulis_result: (app.test_tulis_result as Interview["test_tulis_result"]) || null,
          test_psikotes_result: (app.test_psikotes_result as Interview["test_psikotes_result"]) || null,
        }));
        setInterviews(mapped);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const handleSchedule = (interview?: Interview) => {
    setError("");
    if (interview) {
      setEditingId(interview.id);
      setFormData({
        interview_date: interview.interview_date || "",
        interview_time: interview.interview_time || "09:00",
        interviewer: interview.interviewer || "",
        interview_location: interview.interview_location || "",
        interview_online_link: interview.interview_online_link || "",
        interview_notes: interview.interview_notes || "",
      });
    } else {
      setEditingId(null);
      setFormData({ interview_date: "", interview_time: "09:00", interviewer: "", interview_location: "", interview_online_link: "", interview_notes: "" });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError("");
    const res = await scheduleInterview(editingId, formData);
    setSaving(false);
    if ("error" in res && res.error) { setError(res.error); return; }
    setInterviews((prev) => prev.map((iv) => (iv.id === editingId ? { ...iv, ...formData } : iv)));
    setShowForm(false);
    showToast("ok", "Jadwal interview berhasil disimpan.");
  };

  const upcomingInterviews = useMemo(() => interviews
    .filter((iv) => iv.interview_date && new Date(iv.interview_date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.interview_date || "").getTime() - new Date(b.interview_date || "").getTime()), [interviews]);

  const pastInterviews = useMemo(() => interviews
    .filter((iv) => iv.interview_date && new Date(iv.interview_date) < new Date(new Date().toDateString())), [interviews]);

  const unscheduled = useMemo(() => interviews.filter((iv) => !iv.interview_date), [interviews]);

  // All scheduled interviews grouped by date — includes past AND future dates,
  // so a candidate scheduled for a date that has since passed doesn't silently
  // vanish from the calendar (the bug: it used to only ever look at "upcoming").
  const interviewsByDate = useMemo(() => {
    const groups = new Map<string, Interview[]>();
    for (const iv of interviews) {
      if (!iv.interview_date) continue;
      const key = iv.interview_date as string;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(iv);
    }
    return groups;
  }, [interviews]);

  const todayStr = fmtDate(new Date());

  // Month-grid cells for the calendar view (leading blanks for a clean grid)
  const calendarCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(fmtDate(new Date(cursor.getFullYear(), cursor.getMonth(), d)));
    return cells;
  }, [cursor]);

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold ${toast.type === "err" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "err" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Jadwal Interview</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola jadwal interview dan sesi wawancara dengan kandidat — nama pelamar &amp; tanggal ditampilkan jelas di setiap kartu.</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${view === "list" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
          >
            <List size={13} /> Daftar
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${view === "calendar" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
          >
            <CalendarDays size={13} /> Tanggal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Kandidat</p>
              <p className="text-xl font-extrabold text-slate-800">{interviews.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Calendar size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Terjadwal</p>
              <p className="text-xl font-extrabold text-slate-800">{interviews.filter((iv) => iv.interview_date).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Belum Dijadwalkan</p>
              <p className="text-xl font-extrabold text-slate-800">{unscheduled.length}</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Jadwalkan Interview</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input type="date" required value={formData.interview_date} onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Waktu</label>
                  <input type="time" required value={formData.interview_time} onChange={(e) => setFormData({ ...formData, interview_time: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pewawancara</label>
                <input type="text" required value={formData.interviewer} onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Nama pewawancara" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi</label>
                <input type="text" value={formData.interview_location} onChange={(e) => setFormData({ ...formData, interview_location: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Alamat atau ruangan" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link Online</label>
                <input type="text" value={formData.interview_online_link} onChange={(e) => setFormData({ ...formData, interview_online_link: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Zoom / Google Meet / Teams" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <textarea value={formData.interview_notes} onChange={(e) => setFormData({ ...formData, interview_notes: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" rows={2} placeholder="Catatan tambahan..." />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan Jadwal"}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
          <p className="text-sm text-gray-500">Memuat data interview...</p>
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Belum ada kandidat interview"
          description="Belum ada kandidat yang memasuki tahap interview."
        />
      ) : view === "calendar" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-800 text-sm">
                  {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
                </h3>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }} className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                    Hari Ini
                  </button>
                  <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((date, i) => {
                  if (!date) return <div key={`blank-${i}`} className="min-h-[70px]" />;
                  const dayIvs = interviewsByDate.get(date) || [];
                  const dayNum = parseInt(date.split("-")[2], 10);
                  const isToday = date === todayStr;
                  const isSelected = date === selectedDate;
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`min-h-[70px] rounded-xl border p-1.5 text-left transition-all flex flex-col gap-1 ${
                        isSelected ? "border-[#CC0000] ring-2 ring-red-100 bg-red-50/20" : "border-slate-100 hover:border-slate-300"
                      } ${isToday && !isSelected ? "bg-slate-50" : ""}`}
                    >
                      <span className={`text-[10px] font-bold ${isToday ? "text-[#CC0000]" : "text-slate-500"}`}>{dayNum}</span>
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        {dayIvs.slice(0, 2).map((iv) => (
                          <span key={iv.id} className="px-1 py-0.5 rounded text-[8px] font-bold truncate bg-blue-50 text-blue-700">
                            {iv.full_name}
                          </span>
                        ))}
                        {dayIvs.length > 2 && <span className="text-[8px] text-slate-400">+{dayIvs.length - 2} lagi</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              {selectedDate ? (
                <>
                  <div className="mb-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                    </h3>
                    <p className="text-[10px] text-slate-400">{(interviewsByDate.get(selectedDate) || []).length} kandidat dijadwalkan</p>
                  </div>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {(interviewsByDate.get(selectedDate) || []).length === 0 ? (
                      <EmptyState icon={Users} title="Belum ada interview di tanggal ini" className="p-6 border-none" />
                    ) : (
                      (interviewsByDate.get(selectedDate) || [])
                        .sort((a, b) => (a.interview_time || "").localeCompare(b.interview_time || ""))
                        .map((iv) => (
                          <div key={iv.id} className="p-3 rounded-xl border border-slate-100">
                            <div className="flex items-start gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {iv.full_name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-xs text-slate-800">{iv.full_name}</h4>
                                <p className="text-[10px] text-slate-500">{iv.job_title}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px]">
                                  <span className="flex items-center gap-1 font-bold text-blue-700"><Clock size={10} /> {iv.interview_time || "-"}</span>
                                  <span className="flex items-center gap-1 text-slate-600"><User size={10} /> {iv.interviewer || "Belum ditentukan"}</span>
                                </div>
                                {(iv.interview_location || iv.interview_online_link) && (
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px]">
                                    {iv.interview_location && <span className="flex items-center gap-1 text-slate-500"><MapPin size={10} /> {iv.interview_location}</span>}
                                    {iv.interview_online_link && <span className="flex items-center gap-1 text-blue-600"><Video size={10} /> {iv.interview_online_link}</span>}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <button onClick={() => handleSchedule(iv)} className="px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Ubah Jadwal</button>
                                  {!!iv.job_id && (
                                    <Link href={`/hrd/recruitment/${iv.job_id}/applicants/${iv.id}`} className="px-2.5 py-1 text-[10px] font-bold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-lg transition-colors">Detail</Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </>
              ) : (
                <EmptyState icon={CalendarDays} title="Klik tanggal di kalender" description="Pilih tanggal untuk melihat kandidat yang dijadwalkan interview." className="border-none py-10" />
              )}
            </div>
          </div>

          {unscheduled.length > 0 && (
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <Clock size={14} className="text-amber-500" /> Belum Dijadwalkan
              </h3>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nama Pelamar</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Posisi</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Kontak</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Hasil Tes</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {unscheduled.map((iv) => (
                      <tr key={iv.id} className="hover:bg-slate-50/30">
                        <td className="px-4 py-3">
                          <p className="font-bold text-xs text-slate-800">{iv.full_name}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{iv.job_title}</td>
                        <td className="px-4 py-3">
                          <div className="text-[10px] text-slate-500 space-y-0.5">
                            <span className="flex items-center gap-1"><Mail size={9} /> {iv.email}</span>
                            {iv.phone && <span className="flex items-center gap-1"><Phone size={9} /> {iv.phone}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <TestResultBadges iv={iv} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleSchedule(iv)} className="px-3 py-1.5 bg-[#CC0000] text-white text-[10px] font-bold rounded-lg hover:bg-[#aa0000] transition-colors inline-flex items-center gap-1">
                            <Calendar size={10} /> Jadwalkan
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
      ) : (
        <div className="space-y-6">
          {upcomingInterviews.length > 0 && (
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <Calendar size={14} className="text-emerald-500" /> Wawancara Mendatang
              </h3>
              <div className="space-y-3">
                {upcomingInterviews.map((iv) => (
                  <div key={iv.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {iv.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-800">{iv.full_name}</h4>
                          <p className="text-[11px] text-slate-500">{iv.job_title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px]">
                            <span className="flex items-center gap-1 text-slate-600"><Calendar size={10} /> {iv.interview_date ? new Date(iv.interview_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "-"}</span>
                            <span className="flex items-center gap-1 text-slate-600"><Clock size={10} /> {iv.interview_time || "-"}</span>
                            <span className="flex items-center gap-1 text-slate-600"><User size={10} /> {iv.interviewer || "Belum ditentukan"}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px]">
                            {iv.interview_location && <span className="flex items-center gap-1 text-slate-500"><MapPin size={10} /> {iv.interview_location}</span>}
                            {iv.interview_online_link && <span className="flex items-center gap-1 text-blue-600"><Video size={10} /> {iv.interview_online_link}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleSchedule(iv)} className="px-3 py-1.5 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Ubah Jadwal</button>
                        {!!iv.job_id && (
                          <Link href={`/hrd/recruitment/${iv.job_id}/applicants/${iv.id}`} className="px-3 py-1.5 text-[10px] font-bold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-lg transition-colors">Detail</Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unscheduled.length > 0 && (
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <Clock size={14} className="text-amber-500" /> Belum Dijadwalkan
              </h3>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nama Pelamar</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Posisi</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Kontak</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Hasil Tes</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {unscheduled.map((iv) => (
                      <tr key={iv.id} className="hover:bg-slate-50/30">
                        <td className="px-4 py-3">
                          <p className="font-bold text-xs text-slate-800">{iv.full_name}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{iv.job_title}</td>
                        <td className="px-4 py-3">
                          <div className="text-[10px] text-slate-500 space-y-0.5">
                            <span className="flex items-center gap-1"><Mail size={9} /> {iv.email}</span>
                            {iv.phone && <span className="flex items-center gap-1"><Phone size={9} /> {iv.phone}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <TestResultBadges iv={iv} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleSchedule(iv)} className="px-3 py-1.5 bg-[#CC0000] text-white text-[10px] font-bold rounded-lg hover:bg-[#aa0000] transition-colors inline-flex items-center gap-1">
                            <Calendar size={10} /> Jadwalkan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pastInterviews.length > 0 && (
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <FileText size={14} className="text-slate-500" /> Wawancara Selesai
              </h3>
              <div className="space-y-2">
                {pastInterviews.slice(0, 5).map((iv) => (
                  <div key={iv.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3 hover:bg-slate-50/30 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-[9px] shrink-0">
                      {iv.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{iv.full_name}</p>
                      <p className="text-[10px] text-slate-400">
                        {iv.interview_date ? new Date(iv.interview_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""}
                        {iv.interview_time ? ` - ${iv.interview_time}` : ""}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[9px] font-bold">Selesai</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
