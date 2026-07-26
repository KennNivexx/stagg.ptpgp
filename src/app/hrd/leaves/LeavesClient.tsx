"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, CheckCircle2, Clock, Plus, XCircle, X, User, ChevronRight, CalendarDays } from "lucide-react";
import { getLeaves, submitLeave } from "@/app/actions/leaves";
import EmptyState from "@/components/EmptyState";

interface LeaveRecord {
  id: string; employee_id: string; employee_name: string; department: string;
  type: string; start_date: string; end_date: string; reason: string;
  status: string; created_at: string; updated_at: string;
}

const LEAVE_TYPES = ["Cuti Tahunan", "Cuti Sakit", "Cuti Melahirkan", "Izin", "Cuti Besar", "Lainnya"];

// Jatah cuti tahunan standar sesuai UU Ketenagakerjaan (12 hari kerja/tahun).
// Jenis cuti lain (sakit, melahirkan, dll.) punya aturan tersendiri dan tidak
// memotong jatah ini.
const ANNUAL_LEAVE_QUOTA = 12;

const STATUS_STYLES: Record<string, string> = {
  Disetujui: "bg-emerald-50 text-emerald-600",
  Ditolak: "bg-red-50 text-red-600",
  Pending: "bg-amber-50 text-amber-600",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_STYLES[status] || "bg-slate-50 text-slate-500"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "Disetujui" ? "bg-emerald-500" : status === "Ditolak" ? "bg-red-500" : "bg-amber-500"}`} />
      {status}
    </span>
  );
}

// Jumlah hari cuti (inklusif tanggal mulai dan selesai).
function countDays(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

export default function LeavesClient() {
  const [data, setData] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);

  const [fType, setFType] = useState("Cuti Tahunan");
  const [fStart, setFStart] = useState("");
  const [fEnd, setFEnd] = useState("");
  const [fReason, setFReason] = useState("");
  const [fErr, setFErr] = useState("");
  const [fLoading, setFLoading] = useState(false);

  useEffect(() => { getLeaves({}).then(d => { setData(d); setLoading(false); }); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const doSubmit = async () => {
    if (!fStart || !fEnd) { setFErr("Tanggal wajib diisi."); return; }
    setFLoading(true); setFErr("");
    const fd = new FormData();
    fd.append("type", fType); fd.append("start_date", fStart); fd.append("end_date", fEnd); fd.append("reason", fReason);
    const r = await submitLeave(fd);
    setFLoading(false);
    if ("error" in r) { showToast(r.error); return; }
    showToast("Cuti berhasil diajukan!");
    setShowForm(false);
    getLeaves({}).then(setData);
  };

  const filtered = data.filter(d => !statusFilter || d.status === statusFilter);
  const pending = data.filter(d => d.status === "Pending").length;
  const approved = data.filter(d => d.status === "Disetujui").length;
  const rejected = data.filter(d => d.status === "Ditolak").length;

  // Ringkasan per-karyawan — untuk membuka riwayat cuti lengkap seorang karyawan.
  const employeeSummaries = useMemo(() => {
    const map = new Map<string, { id: string; name: string; department: string; total: number; approvedDays: number }>();
    for (const l of data) {
      const key = l.employee_id || l.employee_name;
      if (!map.has(key)) map.set(key, { id: l.employee_id, name: l.employee_name, department: l.department, total: 0, approvedDays: 0 });
      const entry = map.get(key)!;
      entry.total += 1;
      if (l.status === "Disetujui") entry.approvedDays += countDays(l.start_date, l.end_date);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Cuti & Izin</h1>
          <p className="text-sm text-gray-500">Laporan cuti karyawan &mdash; keputusan disetujui/ditolak oleh Kepala Departemen masing-masing. HRD hanya memantau.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
          <Plus size={14} /> {showForm ? "Tutup" : "Ajukan Cuti"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Pengajuan", value: data.length, icon: <Calendar size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Pending", value: pending, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Disetujui", value: approved, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Ditolak", value: rejected, icon: <XCircle size={18} />, color: "bg-red-50 text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p><p className="text-xl font-extrabold text-slate-800">{s.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm">Form Pengajuan Cuti</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Tipe</label>
              <select value={fType} onChange={e => setFType(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm">
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Mulai</label>
                <input type="date" value={fStart} onChange={e => setFStart(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Selesai</label>
                <input type="date" value={fEnd} onChange={e => setFEnd(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Alasan</label>
            <textarea value={fReason} onChange={e => setFReason(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          {fErr && <p className="text-red-500 text-xs">{fErr}</p>}
          <button onClick={doSubmit} disabled={fLoading} className="px-6 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-50">
            {fLoading ? "Mengirim..." : "Kirim Pengajuan"}
          </button>
        </div>
      )}

      <div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs">
          <option value="">Semua Status</option>
          <option value="Pending">Pending</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Ditolak">Ditolak</option>
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000] mx-auto mb-2" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="Belum ada pengajuan cuti." className="bg-white border-slate-100" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Karyawan</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Tipe</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Periode</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Hari</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase w-32">Keputusan</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-4 text-xs">
                      <button
                        onClick={() => setSelectedEmployee({ id: l.employee_id, name: l.employee_name })}
                        className="font-bold text-slate-800 hover:text-[#CC0000] hover:underline text-left"
                      >
                        {l.employee_name}
                      </button>
                      <br /><span className="text-[10px] text-slate-400">{l.department}</span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{l.type}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{l.start_date} → {l.end_date}</td>
                    <td className="py-2.5 px-4 text-center text-xs font-bold text-slate-600">{countDays(l.start_date, l.end_date)}</td>
                    <td className="py-2.5 px-4 text-center"><StatusBadge status={l.status} /></td>
                    <td className="py-2.5 px-4 text-center">
                      {l.status === "Pending" ? (
                        <span className="text-[10px] text-amber-500 italic">Menunggu keputusan atasan</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">{l.updated_at ? new Date(l.updated_at).toLocaleDateString("id-ID") : ""}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ringkasan per karyawan — untuk kebutuhan perhitungan payroll (potongan cuti tak berbayar) */}
      {!loading && employeeSummaries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800">Riwayat Cuti per Karyawan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Klik karyawan untuk melihat riwayat lengkap pengajuan cuti — berguna untuk perhitungan payroll.</p>
          </div>
          <div className="divide-y divide-slate-50">
            {employeeSummaries.map(e => (
              <button
                key={e.id || e.name}
                onClick={() => setSelectedEmployee({ id: e.id, name: e.name })}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{e.name}</p>
                    <p className="text-[10px] text-slate-400">{e.department || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Total Pengajuan</p>
                    <p className="text-xs font-bold text-slate-700">{e.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Hari Disetujui (Tahun Ini)</p>
                    <p className="text-xs font-bold text-emerald-600">{e.approvedDays} hari</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedEmployee && (
        <EmployeeLeaveHistoryModal
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}

// ── Modal riwayat cuti per-karyawan ──────────────────────────────────
// Visual dibuat mengikuti pola halaman Absensi di Akun Karyawan (kartu putih rounded-2xl,
// ringkasan di atas, daftar riwayat di bawah) sesuai permintaan klien.
function EmployeeLeaveHistoryModal({ employeeId, employeeName, onClose }: { employeeId: string; employeeName: string; onClose: () => void }) {
  const [history, setHistory] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const d = await getLeaves({ employeeId });
      if (active) { setHistory(d as LeaveRecord[]); setLoading(false); }
    })();
    return () => { active = false; };
  }, [employeeId]);

  const thisYear = history.filter(h => new Date(h.start_date).getFullYear() === currentYear);
  const approvedThisYear = thisYear.filter(h => h.status === "Disetujui");
  const approvedDaysThisYear = approvedThisYear.reduce((sum, h) => sum + countDays(h.start_date, h.end_date), 0);
  const pendingCount = history.filter(h => h.status === "Pending").length;
  const rejectedCount = history.filter(h => h.status === "Ditolak").length;

  const annualDaysUsed = approvedThisYear
    .filter(h => h.type === "Cuti Tahunan")
    .reduce((sum, h) => sum + countDays(h.start_date, h.end_date), 0);
  const annualDaysRemaining = Math.max(ANNUAL_LEAVE_QUOTA - annualDaysUsed, 0);

  // Rincian hari terpakai per jenis cuti tahun berjalan, supaya bukan cuma
  // angka total tapi juga terlihat komposisinya (cuti tahunan, sakit, dll).
  const daysByType = LEAVE_TYPES.map(type => ({
    type,
    days: approvedThisYear.filter(h => h.type === type).reduce((sum, h) => sum + countDays(h.start_date, h.end_date), 0),
  })).filter(t => t.days > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <User size={20} className="text-slate-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">{employeeName}</h2>
              <p className="text-xs text-slate-400">Riwayat Cuti & Izin Lengkap</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Ringkasan tahun berjalan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-blue-500 uppercase">Sisa Cuti Tahunan</p>
              <p className="text-xl font-extrabold text-blue-700 mt-1">{annualDaysRemaining}<span className="text-xs font-semibold text-blue-400"> / {ANNUAL_LEAVE_QUOTA}</span></p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-emerald-500 uppercase">Hari Disetujui {currentYear}</p>
              <p className="text-xl font-extrabold text-emerald-700 mt-1">{approvedDaysThisYear}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-amber-500 uppercase">Pending</p>
              <p className="text-xl font-extrabold text-amber-700 mt-1">{pendingCount}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-red-500 uppercase">Ditolak</p>
              <p className="text-xl font-extrabold text-red-700 mt-1">{rejectedCount}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-2">
            <CalendarDays size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Jatah cuti tahunan {ANNUAL_LEAVE_QUOTA} hari/tahun &mdash; terpakai <b>{annualDaysUsed} hari</b>, sisa <b>{annualDaysRemaining} hari</b>. Total seluruh jenis cuti disetujui tahun {currentYear}: <b>{approvedDaysThisYear} hari</b>. Gunakan angka ini sebagai referensi perhitungan potongan cuti tak berbayar pada payroll.
            </p>
          </div>

          {/* Rincian per jenis cuti */}
          {daysByType.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold text-slate-700 uppercase mb-3">Rincian Per Jenis Cuti ({currentYear})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {daysByType.map(t => (
                  <div key={t.type} className="bg-white border border-slate-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{t.type}</p>
                    <p className="text-base font-extrabold text-slate-800">{t.days} <span className="text-[10px] font-semibold text-slate-400">hari</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riwayat lengkap */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-700 uppercase mb-3">Riwayat Lengkap ({history.length})</h3>
            {loading ? (
              <div className="p-8 text-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#CC0000] mx-auto" /></div>
            ) : history.length === 0 ? (
              <EmptyState icon={Calendar} title="Belum ada riwayat cuti." className="bg-white border-slate-100" />
            ) : (
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{h.type}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{h.start_date} → {h.end_date} · {countDays(h.start_date, h.end_date)} hari</p>
                      {h.reason && <p className="text-[11px] text-slate-400 mt-0.5 italic">&ldquo;{h.reason}&rdquo;</p>}
                    </div>
                    <StatusBadge status={h.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
