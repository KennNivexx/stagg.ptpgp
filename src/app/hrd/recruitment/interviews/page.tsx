"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, MapPin, Video, User, Users, Plus, X, Save, Phone, Mail, FileText } from "lucide-react";
import Link from "next/link";

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
  location?: string;
  online_link?: string;
  notes?: string;
};

export default function JadwalInterview() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    interview_date: "",
    interview_time: "09:00",
    interviewer: "",
    location: "",
    online_link: "",
    notes: "",
  });

  useEffect(() => {
    supabase
      .from("applications")
      .select("*, jobs!inner(title)")
      .eq("status", "Interview")
      .order("applied_at", { ascending: false })
      .then(({ data }) => {
        const mapped = ((data || []) as Record<string, unknown>[]).map((app) => ({
          id: app.id as string,
          full_name: app.full_name as string,
          email: app.email as string,
          phone: (app.phone as string) || "",
          job_title: (app.jobs as Record<string, string>)?.title || "-",
          applied_at: app.applied_at as string,
          job_id: app.job_id as string,
          interview_date: (app.interview_date as string) || "",
          interview_time: (app.interview_time as string) || "",
          interviewer: (app.interviewer as string) || "",
          location: (app.location as string) || "",
          online_link: (app.online_link as string) || "",
          notes: (app.notes as string) || "",
        }));
        setInterviews(mapped);
        setLoading(false);
      });
  }, []);

  const handleSchedule = (interview?: Interview) => {
    if (interview) {
      setEditingId(interview.id);
      setFormData({
        interview_date: interview.interview_date || "",
        interview_time: interview.interview_time || "09:00",
        interviewer: interview.interviewer || "",
        location: interview.location || "",
        online_link: interview.online_link || "",
        notes: interview.notes || "",
      });
    } else {
      setEditingId(null);
      setFormData({ interview_date: "", interview_time: "09:00", interviewer: "", location: "", online_link: "", notes: "" });
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setInterviews((prev) =>
        prev.map((iv) => (iv.id === editingId ? { ...iv, ...formData } : iv))
      );
    }
    setShowForm(false);
  };

  const upcomingInterviews = interviews
    .filter((iv) => iv.interview_date && new Date(iv.interview_date) >= new Date())
    .sort((a, b) => new Date(a.interview_date || "").getTime() - new Date(b.interview_date || "").getTime());

  const pastInterviews = interviews
    .filter((iv) => iv.interview_date && new Date(iv.interview_date) < new Date());

  const unscheduled = interviews.filter((iv) => !iv.interview_date);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Jadwal Interview</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola jadwal interview dan sesi wawancara dengan kandidat.</p>
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
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Alamat atau ruangan" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link Online</label>
                <input type="text" value={formData.online_link} onChange={(e) => setFormData({ ...formData, online_link: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Zoom / Google Meet / Teams" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" rows={2} placeholder="Catatan tambahan..." />
              </div>
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Save size={14} /> Simpan Jadwal
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Belum ada kandidat interview</h3>
          <p className="text-sm text-slate-500">Belum ada kandidat yang memasuki tahap interview.</p>
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
                            {iv.location && <span className="flex items-center gap-1 text-slate-500"><MapPin size={10} /> {iv.location}</span>}
                            {iv.online_link && <span className="flex items-center gap-1 text-blue-600"><Video size={10} /> {iv.online_link}</span>}
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
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nama</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Posisi</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Kontak</th>
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
