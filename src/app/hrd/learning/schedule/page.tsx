"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, Users, Plus, X, Save, User } from "lucide-react";

type Schedule = {
  id: string;
  programName: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  participants: number;
  maxParticipants: number;
  status: string;
};

const INITIAL_SCHEDULES: Schedule[] = [
  { id: "1", programName: "Pelatihan Kepemimpinan Dasar", date: "2026-06-15", time: "08:00 - 16:00", location: "Ruang Training Lt. 3", instructor: "Dr. Ahmad Fauzi", participants: 28, maxParticipants: 30, status: "Terjadwal" },
  { id: "2", programName: "Workshop Keselamatan Kerja", date: "2026-06-20", time: "09:00 - 15:00", location: "Aula Utama", instructor: "Budi Hartono, S.K3", participants: 45, maxParticipants: 50, status: "Terjadwal" },
  { id: "3", programName: "Microsoft Excel Advanced", date: "2026-06-22", time: "08:30 - 16:30", location: "Lab Komputer", instructor: "Rina Kusuma", participants: 15, maxParticipants: 20, status: "Terjadwal" },
  { id: "4", programName: "Service Excellence", date: "2026-07-01", time: "09:00 - 16:00", location: "Ruang Meeting Eksekutif", instructor: "Maya Indriani", participants: 32, maxParticipants: 40, status: "Terjadwal" },
  { id: "5", programName: "Manajemen Proyek Profesional", date: "2026-07-10", time: "08:00 - 17:00", location: "Ruang Training Lt. 2", instructor: "Irwan Setiawan, PMP", participants: 10, maxParticipants: 25, status: "Terjadwal" },
  { id: "6", programName: "Pelatihan Kepemimpinan Dasar - Batch 2", date: "2026-07-15", time: "08:00 - 16:00", location: "Ruang Training Lt. 3", instructor: "Dr. Ahmad Fauzi", participants: 20, maxParticipants: 30, status: "Terjadwal" },
  { id: "7", programName: "Digital Marketing Basic", date: "2026-07-20", time: "09:30 - 15:30", location: "Ruang Meeting A", instructor: "Dian Purnama", participants: 18, maxParticipants: 30, status: "Terjadwal" },
  { id: "8", programName: "Pelatihan ISO 9001", date: "2026-06-01", time: "08:00 - 17:00", location: "Ruang Training Lt. 3", instructor: "Tim Konsultan", participants: 15, maxParticipants: 15, status: "Selesai" },
  { id: "9", programName: "Effective Communication", date: "2026-05-25", time: "09:00 - 16:00", location: "Aula Utama", instructor: "Sarah Amalia", participants: 35, maxParticipants: 35, status: "Selesai" },
];

const PROGRAM_OPTIONS = [
  "Pelatihan Kepemimpinan Dasar", "Workshop Keselamatan Kerja", "Microsoft Excel Advanced",
  "Service Excellence", "Manajemen Proyek Profesional", "Digital Marketing Basic",
  "Pelatihan ISO 9001", "Effective Communication",
];

export default function JadwalPelatihan() {
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("Terjadwal");
  const [formData, setFormData] = useState({ programName: "", date: "", time: "08:00 - 16:00", location: "", instructor: "", maxParticipants: 30 });

  const upcoming = schedules.filter((s) => s.status === "Terjadwal");
  const completed = schedules.filter((s) => s.status === "Selesai");

  const display = activeTab === "Terjadwal" ? upcoming : completed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSched: Schedule = { id: Date.now().toString(), ...formData, participants: 0, status: "Terjadwal" };
    setSchedules([newSched, ...schedules]);
    setShowForm(false);
    setFormData({ programName: "", date: "", time: "08:00 - 16:00", location: "", instructor: "", maxParticipants: 30 });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr === today;
  };

  const isThisWeek = (dateStr: string) => {
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
          onClick={() => setShowForm(true)}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Program</label>
                <select required value={formData.programName} onChange={(e) => setFormData({ ...formData, programName: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih Program</option>
                  {PROGRAM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Waktu</label>
                  <input type="text" required value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="08:00 - 16:00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi</label>
                <input required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Ruang Training Lt. 3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instruktur</label>
                  <input required value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Nama instruktur" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Peserta</label>
                  <input type="number" required value={formData.maxParticipants} onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" min={1} />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Save size={14} /> Simpan Jadwal
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {display.length === 0 ? (
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
                isToday(sched.date) ? "border-[#CC0000] ring-1 ring-[#CC0000]/20" :
                isThisWeek(sched.date) ? "border-blue-200" : "border-slate-100"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 min-w-[180px]">
                  <div className={`p-3 rounded-xl ${
                    activeTab === "Selesai" ? "bg-slate-100 text-slate-500" :
                    isToday(sched.date) ? "bg-red-50 text-[#CC0000]" :
                    isThisWeek(sched.date) ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-600"
                  }`}>
                    <Calendar size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase text-slate-500">
                      {new Date(sched.date).toLocaleDateString("id-ID", { month: "short" })}
                    </p>
                    <p className="text-2xl font-extrabold text-slate-800">{new Date(sched.date).getDate()}</p>
                    {isToday(sched.date) && <span className="text-[9px] font-bold text-[#CC0000]">Hari ini</span>}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-sm text-slate-800 mb-1">{sched.programName}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={10} /> {sched.time}</span>
                    <span className="flex items-center gap-1"><MapPin size={10} /> {sched.location}</span>
                    <span className="flex items-center gap-1"><User size={10} /> {sched.instructor}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-slate-400" />
                      <span className="text-xs font-extrabold text-slate-800">{sched.participants}</span>
                      <span className="text-[10px] text-slate-400">/ {sched.maxParticipants}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1 w-full overflow-hidden">
                      <div className="h-full bg-[#CC0000] rounded-full" style={{ width: `${(sched.participants / sched.maxParticipants) * 100}%` }} />
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                    sched.status === "Selesai" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"
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
