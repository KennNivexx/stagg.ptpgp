"use client";

import { useState, useEffect } from "react";
import { Clock, Users, Search, CheckCircle2, LogIn, LogOut, Camera, MapPin, X, FileSpreadsheet } from "lucide-react";
import { getAllAttendance, clockIn, clockOut, getTodayAttendance, getAttendanceForExport } from "@/app/actions/attendance";

interface AttRecord {
  id: string; employee_id: string; employee_name: string; department: string;
  date: string; check_in: string; check_out: string; status: string; notes: string;
  photo_url?: string; location_name?: string;
}

export default function AttendancePage() {
  const [data, setData] = useState<AttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<AttRecord | null>(null);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [clocking, setClocking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  useEffect(() => {
    getTodayAttendance().then(setToday);
    getAllAttendance({ date: dateFilter }).then(d => { setData(d); setLoading(false); });
  }, [dateFilter]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const doClockIn = async () => {
    setClocking(true);
    const fd = new FormData();
    const r = await clockIn(fd);
    setClocking(false);
    if (r.error) { showToast(r.error); return; }
    showToast("Clock-in berhasil!");
    getTodayAttendance().then(setToday);
    getAllAttendance({ date: dateFilter }).then(setData);
  };

  const doClockOut = async () => {
    setClocking(true);
    const r = await clockOut();
    setClocking(false);
    if (r.error) { showToast(r.error); return; }
    showToast("Clock-out berhasil!");
    getTodayAttendance().then(setToday);
    getAllAttendance({ date: dateFilter }).then(setData);
  };

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const records = await getAttendanceForExport();
      if (!records.length) { showToast("Belum ada data untuk diekspor."); return; }

      const fmtTime = (v: unknown) => v ? new Date(v as string).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—";
      const fmtDate = (v: unknown) => v ? new Date(v as string).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "—";

      const rows = records.map((r) => ({
        "Tanggal": fmtDate(r.date),
        "Nama Karyawan": (r.employee_name as string) || "—",
        "Departemen": (r.department as string) || "—",
        "Jam Masuk": fmtTime(r.check_in),
        "Jam Keluar": fmtTime(r.check_out),
        "Status": (r.status as string) || "—",
        "Lokasi": (r.location_name as string) || "—",
        "Keterangan": (r.notes as string) || "",
      }));

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 20 }, { wch: 28 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 30 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");
      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Rekap-Absensi-${stamp}.xlsx`);
      showToast(`Berhasil ekspor ${rows.length} data absensi.`);
    } catch (e) {
      console.error("[attendance] export error:", e);
      showToast("Gagal mengekspor data. Silakan coba lagi.");
    } finally {
      setExporting(false);
    }
  };

  const filtered = data.filter(d => !search || d.employee_name?.toLowerCase().includes(search.toLowerCase()));

  const hadir = data.filter(d => d.status === "Hadir" && d.check_in).length;
  const belumAbsen = data.length - hadir;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Absensi / Kehadiran</h1>
          <p className="text-sm text-gray-500">Rekap kehadiran karyawan. Clock-in / Clock-out untuk mencatat kehadiran.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
            <FileSpreadsheet size={14} /> {exporting ? "Mengekspor..." : "Export Excel"}
          </button>
          {!today?.check_in ? (
            <button onClick={doClockIn} disabled={clocking} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
              <LogIn size={14} /> {clocking ? "..." : "Clock In"}
            </button>
          ) : !today?.check_out ? (
            <button onClick={doClockOut} disabled={clocking} className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
              <LogOut size={14} /> {clocking ? "..." : "Clock Out"}
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl flex items-center gap-1">
              <CheckCircle2 size={14} /> Hadir Hari Ini
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Record Hari Ini", value: data.length, icon: <Users size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Hadir / Clock-in", value: hadir, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Belum Absen", value: belumAbsen, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p><p className="text-xl font-extrabold text-slate-800">{s.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setLoading(true); }}
          className="w-36 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20" />
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input placeholder="Cari nama..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20" />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000] mx-auto mb-2" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><Clock size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-sm text-slate-500">Belum ada data kehadiran.</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Nama</th>
              <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Dept</th>
              <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Clock In</th>
              <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Clock Out</th>
              <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
              <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Foto</th>
              <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Lokasi</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/30">
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-800">{a.employee_name}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-500">{a.department}</td>
                  <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">{a.check_in ? new Date(a.check_in).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">{a.check_out ? new Date(a.check_out).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="py-2.5 px-4 text-center"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${a.status === "Hadir" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{a.status}</span></td>
                  <td className="py-2.5 px-4 text-center">
                    {a.photo_url ? (
                      <button onClick={() => setExpandedPhoto(a.photo_url!)} className="inline-flex items-center gap-1 text-xs text-[#CC0000] hover:underline font-medium">
                        <Camera size={12} /> Lihat
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">
                    {a.location_name ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={10} className="text-slate-400" />
                        {a.location_name}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expandedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setExpandedPhoto(null)}>
          <div className="relative max-w-2xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setExpandedPhoto(null)} className="absolute -top-3 -right-3 p-2 bg-white rounded-full shadow-lg hover:bg-slate-100 transition-colors z-10">
              <X size={16} className="text-slate-600" />
            </button>
            <img src={expandedPhoto} alt="Foto Absensi" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
