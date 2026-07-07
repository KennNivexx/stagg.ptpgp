"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, Users, Search, CheckCircle2, LogIn, LogOut, Camera, MapPin, X, FileSpreadsheet, AlarmClockOff, UserX, CalendarClock } from "lucide-react";
import { getAllAttendance, clockIn, clockOut, getTodayAttendance, getAttendanceForExport } from "@/app/actions/attendance";
import { getEmployees } from "@/app/actions/hrd";
import { getLeaves } from "@/app/actions/leaves";
import EmptyState from "@/components/EmptyState";

interface AttRecord {
  id: string; employee_id: string; employee_name: string; department: string;
  date: string; check_in: string; check_out: string; status: string; notes: string;
  photo_url?: string; location_name?: string; employee_kode?: string | null;
}

interface LeaveRecord {
  id: string; employee_id: string; employee_name: string; type: string;
  start_date: string; end_date: string; status: string;
}

// Batas jam masuk normal — check-in setelah jam ini dianggap "Telat".
const LATE_CUTOFF_HOUR = 8;

type DerivedStatus = "Hadir" | "Telat" | "Tidak Hadir" | "Izin";

const STATUS_STYLES: Record<DerivedStatus, { badge: string; dot: string }> = {
  Hadir: { badge: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
  Telat: { badge: "bg-amber-50 text-amber-600", dot: "bg-amber-500" },
  "Tidak Hadir": { badge: "bg-red-50 text-red-600", dot: "bg-red-500" },
  Izin: { badge: "bg-blue-50 text-blue-600", dot: "bg-blue-500" },
};

function StatusBadge({ status }: { status: DerivedStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
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
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [leavesToday, setLeavesToday] = useState<LeaveRecord[]>([]);

  useEffect(() => {
    getTodayAttendance().then(setToday);
    getEmployees().then(list => setTotalEmployees(list?.length || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [att, leaves] = await Promise.all([
        getAllAttendance({ date: dateFilter }),
        getLeaves({ status: "Disetujui" }),
      ]);
      if (!active) return;
      setData(att as unknown as AttRecord[]);
      const onDate = (leaves as LeaveRecord[]).filter(l => l.start_date <= dateFilter && l.end_date >= dateFilter);
      setLeavesToday(onDate);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [dateFilter]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const doClockIn = async () => {
    setClocking(true);
    const fd = new FormData();
    const r = await clockIn(fd);
    setClocking(false);
    if ("error" in r) { showToast(r.error); return; }
    showToast("Clock-in berhasil!");
    getTodayAttendance().then(setToday);
    getAllAttendance({ date: dateFilter }).then((rows) => setData(rows as unknown as AttRecord[]));
  };

  const doClockOut = async () => {
    setClocking(true);
    const r = await clockOut();
    setClocking(false);
    if ("error" in r) { showToast(r.error); return; }
    showToast("Clock-out berhasil!");
    getTodayAttendance().then(setToday);
    getAllAttendance({ date: dateFilter }).then((rows) => setData(rows as unknown as AttRecord[]));
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

  const deriveStatus = (a: AttRecord): DerivedStatus => {
    if (!a.check_in) return "Tidak Hadir";
    const hour = new Date(a.check_in).getHours();
    return hour >= LATE_CUTOFF_HOUR + 1 || (hour === LATE_CUTOFF_HOUR && new Date(a.check_in).getMinutes() > 0) ? "Telat" : "Hadir";
  };

  const filtered = data.filter(d => !search || d.employee_name?.toLowerCase().includes(search.toLowerCase()));

  const { hadirCount, telatCount, izinCount, tidakHadirCount } = useMemo(() => {
    let hadirCount = 0, telatCount = 0;
    for (const d of data) {
      if (deriveStatus(d) === "Telat") telatCount++; else hadirCount++;
    }
    const izinCount = leavesToday.length;
    const hadirEmployeeIds = new Set(data.map(d => d.employee_id));
    const izinEmployeeIds = new Set(leavesToday.map(l => l.employee_id));
    const accounted = new Set([...hadirEmployeeIds, ...izinEmployeeIds]).size;
    const tidakHadirCount = Math.max(totalEmployees - accounted, 0);
    return { hadirCount, telatCount, izinCount, tidakHadirCount };
  }, [data, leavesToday, totalEmployees]);

  const isToday = dateFilter === new Date().toISOString().slice(0, 10);

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

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: isToday ? "Hadir Hari Ini" : "Hadir", value: hadirCount, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Telat", value: telatCount, icon: <AlarmClockOff size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Tidak Hadir", value: tidakHadirCount, icon: <UserX size={18} />, color: "bg-red-50 text-red-600" },
          { label: "Izin / Cuti", value: izinCount, icon: <CalendarClock size={18} />, color: "bg-blue-50 text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p><p className="text-xl font-extrabold text-slate-800">{s.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500">Total karyawan: <b className="text-slate-700">{totalEmployees}</b></span>
        </div>
        <div className="flex-1" />
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
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
        <EmptyState icon={Clock} title="Belum ada data kehadiran." className="bg-white border-slate-100" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Nama</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Kode</th>
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
                    <td className="py-2.5 px-4 text-xs font-mono text-slate-500">{a.employee_kode || "—"}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">{a.department}</td>
                    <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">{a.check_in ? new Date(a.check_in).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">{a.check_out ? new Date(a.check_out).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td className="py-2.5 px-4 text-center"><StatusBadge status={deriveStatus(a)} /></td>
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
        </div>
      )}

      {leavesToday.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800">Karyawan Izin / Cuti pada {new Date(dateFilter).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {leavesToday.map(l => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">{l.employee_name}</p>
                  <p className="text-[11px] text-slate-400">{l.type} · {l.start_date} → {l.end_date}</p>
                </div>
                <StatusBadge status="Izin" />
              </div>
            ))}
          </div>
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
