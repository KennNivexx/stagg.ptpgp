"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Users, Plus, X, Save, User } from "lucide-react";
import { getTrainings, saveTraining } from "@/app/actions/trainings";

type Schedule = {
  id: string;
  title: string;
  date_start: string;
  date_end: string;
  lokasi: string | null;
  instruktur: string | null;
  status: string;
  enrollment_count: number;
};

const emptyForm = { title: "", date_start: "", date_end: "", lokasi: "", instruktur: "" };

export default function JadwalPelatihan() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("Terjadwal");
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getTrainings().then((data) => {
      setSchedules(data as unknown as Schedule[]);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  // "Jadwal Pelatihan" is a date-centric view of the same pelatihan rows
  // /hrd/learning/programs and /hrd/learning/trainings manage — there's no
  // separate "session" table backing this, so Terjadwal/Selesai maps
  // directly onto Planned+Ongoing / Completed status.
  const upcoming = schedules.filter((s) => s.status === "Planned" || s.status === "Ongoing");
  const completed = schedules.filter((s) => s.status === "Completed");
  const display = [...(activeTab === "Terjadwal" ? upcoming : completed)]
    .sort((a, b) => (a.date_start || "").localeCompare(b.date_start || ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData();
    fd.set("title", formData.title);
    fd.set("date_start", formData.date_start);
    fd.set("date_end", formData.date_end || formData.date_start);
    fd.set("lokasi", formData.lokasi);
    fd.set("instruktur", formData.instruktur);
    fd.set("status", "Planned");
    const res = await saveTraining(fd);
    setSaving(false);
    if ("error" in res) { setError(res.error || "Gagal menyimpan jadwal."); return; }
    setShowForm(false);
    setFormData(emptyForm);
    load();
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr === today;
  };

  const isThisWeek = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return d >= weekStart && d <= weekEnd;
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Jadwal Pelatihan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola jadwal pelatihan, sesi kelas, dan absensi peserta.</p>
        </div>
        <button
          onClick={() => { setFormData(emptyForm); setError(""); setShowForm(true); }}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Plus size={14} /> Tambah Jadwal
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("Terjadwal")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "Terjadwal" ? "bg-white shadow-sm text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
        >
          Terjadwal ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab("Selesai")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "Selesai" ? "bg-white shadow-sm text-slate-700" : "text-slate-500 hover:text-slate-700"}`}
        >
          Selesai ({completed.length})
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Jadwal Pelatihan</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pelatihan</label>
                <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Nama program pelatihan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input type="date" required value={formData.date_start} onChange={(e) => setFormData({ ...formData, date_start: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input type="date" value={formData.date_end} onChange={(e) => setFormData({ ...formData, date_end: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Sama dengan tanggal mulai jika kosong" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi</label>
                <input value={formData.lokasi} onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Ruang Training Lt. 3" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instruktur</label>
                <input value={formData.instruktur} onChange={(e) => setFormData({ ...formData, instruktur: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Nama instruktur" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan Jadwal"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
            <p className="text-sm text-slate-500">Memuat data...</p>
          </div>
        ) : display.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Tidak ada jadwal {activeTab.toLowerCase()}.</p>
          </div>
        ) : (
          display.map((sched) => (
            <div
              key={sched.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all ${
                activeTab === "Selesai" ? "border-slate-100 opacity-75" :
                isToday(sched.date_start) ? "border-[#CC0000] ring-1 ring-[#CC0000]/20" :
                isThisWeek(sched.date_start) ? "border-blue-200" : "border-slate-100"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 min-w-[180px]">
                  <div className={`p-3 rounded-xl ${
                    activeTab === "Selesai" ? "bg-slate-100 text-slate-500" :
                    isToday(sched.date_start) ? "bg-red-50 text-[#CC0000]" :
                    isThisWeek(sched.date_start) ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-600"
                  }`}>
                    <Calendar size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase text-slate-500">
                      {sched.date_start ? new Date(sched.date_start).toLocaleDateString("id-ID", { month: "short" }) : "-"}
                    </p>
                    <p className="text-2xl font-extrabold text-slate-800">{sched.date_start ? new Date(sched.date_start).getDate() : "-"}</p>
                    {isToday(sched.date_start) && <span className="text-[9px] font-bold text-[#CC0000]">Hari ini</span>}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-sm text-slate-800 mb-1">{sched.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={10} /> {sched.date_start === sched.date_end ? sched.date_start : `${sched.date_start} – ${sched.date_end}`}</span>
                    {sched.lokasi && <span className="flex items-center gap-1"><MapPin size={10} /> {sched.lokasi}</span>}
                    <span className="flex items-center gap-1"><User size={10} /> {sched.instruktur || "Belum ditentukan"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-slate-400" />
                      <span className="text-xs font-extrabold text-slate-800">{sched.enrollment_count}</span>
                      <span className="text-[10px] text-slate-400">peserta</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                    sched.status === "Completed" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {sched.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
