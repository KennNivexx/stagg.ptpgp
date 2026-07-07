"use client";

import { useState, useEffect } from "react";
import { Clock, Search, LogIn, LogOut, CheckCircle2, Camera, MapPin, X } from "lucide-react";
import { getAttendanceForDept, clockIn, clockOut, getTodayAttendance } from "@/app/actions/attendance";
import EmptyState from "@/components/EmptyState";

interface AttRecord {
  id: string; employee_id: string; employee_name: string; department: string; employee_kode?: string | null;
  date: string; check_in: string; check_out: string; status: string;
  photo_url?: string; location_name?: string;
}

export default function DeptAttendancePage() {
  const [data, setData] = useState<AttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<AttRecord | null>(null);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [clocking, setClocking] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  useEffect(() => { getTodayAttendance().then(setToday); }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAttendanceForDept({ date: dateFilter }).then((rows) => {
      if (!active) return;
      setData(rows as unknown as AttRecord[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, [dateFilter]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const doClockIn = async () => {
    setClocking(true);
    const r = await clockIn(new FormData());
    setClocking(false);
    if ("error" in r) { showToast(r.error); return; }
    showToast("Clock-in berhasil!");
    getTodayAttendance().then(setToday);
    getAttendanceForDept({ date: dateFilter }).then((rows) => setData(rows as unknown as AttRecord[]));
  };

  const doClockOut = async () => {
    setClocking(true);
    const r = await clockOut();
    setClocking(false);
    if ("error" in r) { showToast(r.error); return; }
    showToast("Clock-out berhasil!");
    getTodayAttendance().then(setToday);
    getAttendanceForDept({ date: dateFilter }).then((rows) => setData(rows as unknown as AttRecord[]));
  };

  const filtered = data.filter((d) => !search || d.employee_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Absensi Departemen</h1>
          <p className="text-sm text-gray-500">Rekap kehadiran karyawan di departemen Anda. Data ini dikelola oleh HRD dan tidak dapat diedit.</p>
        </div>
        {!today?.check_in ? (
          <button onClick={doClockIn} disabled={clocking} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
            <LogIn size={14} /> {clocking ? "..." : "Clock In Saya"}
          </button>
        ) : !today?.check_out ? (
          <button onClick={doClockOut} disabled={clocking} className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
            <LogOut size={14} /> {clocking ? "..." : "Clock Out Saya"}
          </button>
        ) : (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl flex items-center gap-1">
            <CheckCircle2 size={14} /> Hadir Hari Ini
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
          className="w-36 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input placeholder="Cari nama..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-2" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Clock} title="Belum ada data kehadiran." className="bg-white border-slate-100" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Nama</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Kode</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Clock In</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Clock Out</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Foto</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Lokasi</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-4 text-xs font-bold text-slate-800">{a.employee_name}</td>
                    <td className="py-2.5 px-4 text-xs font-mono text-slate-500">{a.employee_kode || "—"}</td>
                    <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">{a.check_in ? new Date(a.check_in).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">{a.check_out ? new Date(a.check_out).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td className="py-2.5 px-4 text-center">
                      {a.photo_url ? (
                        <button onClick={() => setExpandedPhoto(a.photo_url!)} className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline font-medium">
                          <Camera size={12} /> Lihat
                        </button>
                      ) : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">
                      {a.location_name ? (
                        <span className="inline-flex items-center gap-1"><MapPin size={10} className="text-slate-400" /> {a.location_name}</span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {expandedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setExpandedPhoto(null)}>
          <div className="relative max-w-2xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setExpandedPhoto(null)} className="absolute -top-3 -right-3 p-2 bg-white rounded-full shadow-lg hover:bg-slate-100 transition-colors z-10">
              <X size={16} className="text-slate-600" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- variable-aspect photo capped by max-h/max-w + object-contain; fill would require a fixed-size parent and change the shrink-to-fit behavior */}
            <img src={expandedPhoto} alt="Foto Absensi" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
