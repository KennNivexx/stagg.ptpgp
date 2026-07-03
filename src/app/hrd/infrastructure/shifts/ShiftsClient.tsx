"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, Users, Sun, Moon, Sunset, Plus, X, Save, ChevronLeft, ChevronRight,
  Gift, Calendar as CalendarIcon, List, Settings2, Trash2,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { getShiftSchedules, saveShift, assignShift, deleteShiftSchedule } from "@/app/actions/infrastructure";

type Employee = { id: string; full_name: string; department: string; position: string };
type Shift = {
  id: string; name: string; start_time: string; end_time: string;
  has_bonus: boolean; bonus_amount: number; color: string;
};
type Schedule = {
  id: string; employee_id: string; shift_id: string; shift_date: string;
  has_bonus: boolean; bonus_amount: number; notes?: string | null;
};

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  amber: Sun, orange: Sunset, indigo: Moon,
};
const COLOR_STYLES: Record<string, { badge: string; dot: string; ring: string }> = {
  amber:  { badge: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-500",  ring: "ring-amber-300" },
  orange: { badge: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500", ring: "ring-orange-300" },
  indigo: { badge: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500", ring: "ring-indigo-300" },
  emerald:{ badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", ring: "ring-emerald-300" },
  purple: { badge: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500", ring: "ring-purple-300" },
  rose:   { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", ring: "ring-rose-300" },
};

const MONTH_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAY_NAMES = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function fmtDate(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function formatRupiah(n: number) { return "Rp" + Math.round(n).toLocaleString("id-ID"); }

export default function ShiftsClient({ initialShifts, employees }: { initialShifts: Shift[]; employees: Employee[] }) {
  const router = useRouter();
  const shifts = initialShifts;
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleMonthKey, setScheduleMonthKey] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [shiftForm, setShiftForm] = useState({ name: "", start_time: "08:00", end_time: "16:00", has_bonus: false, bonus_amount: "0", color: "amber" });
  const [assignForm, setAssignForm] = useState({ employee_id: "", shift_id: shifts[0]?.id || "", shift_date: fmtDate(new Date()), has_bonus: false, bonus_amount: "0", notes: "" });

  const monthStart = fmtDate(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  const monthEnd = fmtDate(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
  // While the current month's schedules haven't loaded yet, scheduleMonthKey
  // won't match monthStart — this drives the loading UI without a setState
  // call at the top of the effect body.
  const loading = scheduleMonthKey !== monthStart;

  const loadSchedules = useCallback(async () => {
    const data = await getShiftSchedules(monthStart, monthEnd);
    setSchedules(data as Schedule[]);
    setScheduleMonthKey(monthStart);
  }, [monthStart, monthEnd]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const empMap = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const shiftMap = useMemo(() => Object.fromEntries(shifts.map((s) => [s.id, s])), [shifts]);

  const schedulesByDate = useMemo(() => {
    const m: Record<string, Schedule[]> = {};
    for (const s of schedules) { (m[s.shift_date] ||= []).push(s); }
    return m;
  }, [schedules]);

  // Calendar grid cells (leading/trailing blanks for a clean month grid)
  const calendarCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(fmtDate(new Date(cursor.getFullYear(), cursor.getMonth(), d)));
    return cells;
  }, [cursor]);

  const todayStr = fmtDate(new Date());

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", shiftForm.name);
    fd.append("start_time", shiftForm.start_time);
    fd.append("end_time", shiftForm.end_time);
    fd.append("has_bonus", shiftForm.has_bonus ? "on" : "");
    fd.append("bonus_amount", shiftForm.bonus_amount);
    fd.append("color", shiftForm.color);
    const result = await saveShift(fd);
    if (result?.error) { setSaveMsg({ type: "error", text: result.error }); return; }
    setSaveMsg({ type: "success", text: "Jenis shift berhasil ditambahkan." });
    setShowShiftForm(false);
    setShiftForm({ name: "", start_time: "08:00", end_time: "16:00", has_bonus: false, bonus_amount: "0", color: "amber" });
    setTimeout(() => setSaveMsg(null), 3000);
    router.refresh();
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(assignForm).forEach(([k, v]) => fd.append(k, typeof v === "boolean" ? (v ? "on" : "") : v));
    const result = await assignShift(fd);
    if (result?.error) { setSaveMsg({ type: "error", text: result.error }); return; }
    setSaveMsg({ type: "success", text: "Penugasan shift berhasil disimpan." });
    setShowAssignForm(false);
    loadSchedules();
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleDelete = async (id: string) => {
    await deleteShiftSchedule(id);
    loadSchedules();
  };

  const openAssignForDate = (date: string) => {
    setAssignForm((f) => ({ ...f, shift_date: date, shift_id: shifts[0]?.id || "" }));
    setShowAssignForm(true);
  };

  // Stats
  const totalBonusThisMonth = schedules.filter((s) => s.has_bonus).length;
  const bonusAmountThisMonth = schedules.reduce((sum, s) => sum + (s.has_bonus ? Number(s.bonus_amount) || 0 : 0), 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Manajemen Shift Kerja</h1>
          <p className="text-sm text-gray-500 mt-1">Jadwal shift berbasis tanggal &mdash; jam kerja, tim bertugas, dan bonus per shift.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowShiftForm(true)}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors inline-flex items-center gap-2">
            <Settings2 size={14} /> Jenis Shift
          </button>
          <button onClick={() => openAssignForDate(selectedDate || todayStr)}
            className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
            <Plus size={14} /> Tugaskan Shift
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className={`p-3 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {saveMsg.text}
        </div>
      )}

      {/* Shift type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {shifts.map((shift) => {
          const style = COLOR_STYLES[shift.color] || COLOR_STYLES.amber;
          const Icon = ICONS[shift.color] || Clock;
          const countThisMonth = schedules.filter((s) => s.shift_id === shift.id).length;
          return (
            <div key={shift.id} className={`bg-white rounded-2xl border ${style.badge.split(" ")[2] || "border-slate-100"} shadow-sm p-5`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${style.badge}`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-800 truncate">{shift.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{shift.start_time} - {shift.end_time}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-lg font-extrabold text-slate-800">{countThisMonth}<span className="text-xs font-normal text-slate-500"> tugas/bln</span></p>
                    {shift.has_bonus && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold">
                        <Gift size={9} /> Bonus
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><Gift size={20} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Bonus Bulan Ini</p>
              <p className="text-lg font-extrabold text-slate-800">{formatRupiah(bonusAmountThisMonth)}</p>
              <p className="text-[10px] text-slate-400">{totalBonusThisMonth} penugasan berbonus</p>
            </div>
          </div>
        </div>
      </div>

      {/* View toggle + month nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          <button onClick={() => setView("calendar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${view === "calendar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>
            <CalendarIcon size={13} /> Kalender
          </button>
          <button onClick={() => setView("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${view === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>
            <List size={13} /> Daftar per Tanggal
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <ChevronLeft size={16} />
          </button>
          <p className="text-sm font-bold text-slate-800 w-36 text-center">{MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}</p>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
          <p className="text-sm text-gray-500">Memuat jadwal shift...</p>
        </div>
      ) : view === "calendar" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((date, i) => {
                if (!date) return <div key={`blank-${i}`} className="min-h-[86px]" />;
                const daySchedules = schedulesByDate[date] || [];
                const dayNum = parseInt(date.split("-")[2], 10);
                const isToday = date === todayStr;
                const isSelected = date === selectedDate;
                const byShift = new Map<string, number>();
                daySchedules.forEach((s) => byShift.set(s.shift_id, (byShift.get(s.shift_id) || 0) + 1));
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[86px] rounded-xl border p-1.5 text-left transition-all flex flex-col gap-1 ${
                      isSelected ? "border-[#CC0000] ring-2 ring-red-100 bg-red-50/20" : "border-slate-100 hover:border-slate-300"
                    } ${isToday ? "bg-slate-50" : ""}`}
                  >
                    <span className={`text-[10px] font-bold ${isToday ? "text-[#CC0000]" : "text-slate-500"}`}>{dayNum}</span>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {[...byShift.entries()].slice(0, 3).map(([shiftId, count]) => {
                        const shift = shiftMap[shiftId];
                        if (!shift) return null;
                        const style = COLOR_STYLES[shift.color] || COLOR_STYLES.amber;
                        return (
                          <span key={shiftId} className={`px-1 py-0.5 rounded text-[8px] font-bold truncate ${style.badge}`}>
                            {shift.name} &middot;{count}
                          </span>
                        );
                      })}
                      {byShift.size > 3 && <span className="text-[8px] text-slate-400">+{byShift.size - 3} lagi</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day detail panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            {selectedDate ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                    </h3>
                    <p className="text-[10px] text-slate-400">{(schedulesByDate[selectedDate] || []).length} karyawan bertugas</p>
                  </div>
                  <button onClick={() => openAssignForDate(selectedDate)} className="p-2 bg-[#CC0000]/10 text-[#CC0000] rounded-lg hover:bg-[#CC0000]/20 transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                  {(schedulesByDate[selectedDate] || []).length === 0 ? (
                    <EmptyState icon={Users} title="Belum ada penugasan" className="p-6 border-none" />
                  ) : (
                    (schedulesByDate[selectedDate] || []).map((s) => {
                      const emp = empMap[s.employee_id];
                      const shift = shiftMap[s.shift_id];
                      const style = COLOR_STYLES[shift?.color || "amber"] || COLOR_STYLES.amber;
                      return (
                        <div key={s.id} className="p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {emp?.full_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{emp?.full_name || "Karyawan tidak ditemukan"}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${style.badge}`}>{shift?.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{shift?.start_time}-{shift?.end_time}</span>
                              {s.has_bonus && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold">
                                  <Gift size={8} /> {formatRupiah(s.bonus_amount)}
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <EmptyState icon={CalendarIcon} title="Pilih tanggal" description="Klik tanggal di kalender untuk melihat detail penugasan shift." className="p-6 border-none" />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {Object.keys(schedulesByDate).length === 0 ? (
            <EmptyState icon={Users} title="Belum ada jadwal shift" description="Tambahkan penugasan shift untuk bulan ini." className="p-12 border-none" />
          ) : (
            <div className="divide-y divide-slate-50">
              {Object.keys(schedulesByDate).sort().map((date) => (
                <div key={date} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-extrabold text-slate-700">
                      {new Date(date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <span className="text-[10px] text-slate-400">{schedulesByDate[date].length} karyawan</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {schedulesByDate[date].map((s) => {
                      const emp = empMap[s.employee_id];
                      const shift = shiftMap[s.shift_id];
                      const style = COLOR_STYLES[shift?.color || "amber"] || COLOR_STYLES.amber;
                      return (
                        <div key={s.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${style.dot}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{emp?.full_name || "-"}</p>
                            <p className="text-[9px] text-slate-400">{shift?.name} &middot; {shift?.start_time}-{shift?.end_time}</p>
                          </div>
                          {s.has_bonus && <Gift size={11} className="text-emerald-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shift type form modal */}
      {showShiftForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Jenis Shift</h3>
              <button onClick={() => setShowShiftForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Shift</label>
                <input required value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  placeholder="Contoh: Shift Malam Akhir Pekan"
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input required type="time" value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai</label>
                  <input required type="time" value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warna Label</label>
                <div className="flex gap-2">
                  {Object.keys(COLOR_STYLES).map((c) => (
                    <button type="button" key={c} onClick={() => setShiftForm({ ...shiftForm, color: c })}
                      className={`h-7 w-7 rounded-full ${COLOR_STYLES[c].dot} ${shiftForm.color === c ? "ring-2 ring-offset-2 ring-slate-400" : ""}`} />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer">
                <input type="checkbox" checked={shiftForm.has_bonus} onChange={(e) => setShiftForm({ ...shiftForm, has_bonus: e.target.checked })} className="h-4 w-4" />
                <span className="text-xs font-bold text-slate-700">Shift ini mendapat bonus</span>
              </label>
              {shiftForm.has_bonus && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Bonus Default (Rp)</label>
                  <input type="number" min="0" value={shiftForm.bonus_amount} onChange={(e) => setShiftForm({ ...shiftForm, bonus_amount: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              )}
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Save size={14} /> Simpan Jenis Shift
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign shift modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Tugaskan Shift</h3>
              <button onClick={() => setShowAssignForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                <input required type="date" value={assignForm.shift_date} onChange={(e) => setAssignForm({ ...assignForm, shift_date: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Karyawan</label>
                <select required value={assignForm.employee_id} onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih Karyawan</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name} &mdash; {e.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shift</label>
                <div className="grid grid-cols-3 gap-2">
                  {shifts.map((s) => {
                    const style = COLOR_STYLES[s.color] || COLOR_STYLES.amber;
                    const Icon = ICONS[s.color] || Clock;
                    return (
                      <label key={s.id}
                        className={`p-2.5 rounded-xl border-2 cursor-pointer text-center transition-all ${
                          assignForm.shift_id === s.id ? `${style.badge} border-current` : "border-slate-200 bg-white hover:border-slate-300"
                        }`}>
                        <input type="radio" name="shift_id" value={s.id} checked={assignForm.shift_id === s.id}
                          onChange={(e) => setAssignForm({ ...assignForm, shift_id: e.target.value, has_bonus: s.has_bonus, bonus_amount: String(s.bonus_amount || 0) })}
                          className="sr-only" />
                        <Icon size={14} className="mx-auto mb-1" />
                        <p className="text-[10px] font-bold">{s.name}</p>
                        <p className="text-[8px] text-slate-400 font-mono">{s.start_time}-{s.end_time}</p>
                      </label>
                    );
                  })}
                </div>
              </div>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer">
                <input type="checkbox" checked={assignForm.has_bonus} onChange={(e) => setAssignForm({ ...assignForm, has_bonus: e.target.checked })} className="h-4 w-4" />
                <span className="text-xs font-bold text-slate-700">Berikan bonus untuk penugasan ini</span>
              </label>
              {assignForm.has_bonus && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Bonus (Rp)</label>
                  <input type="number" min="0" value={assignForm.bonus_amount} onChange={(e) => setAssignForm({ ...assignForm, bonus_amount: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan (opsional)</label>
                <input value={assignForm.notes} onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="Contoh: pengganti shift Budi"
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <button type="submit" disabled={shifts.length === 0} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={14} /> Simpan Penugasan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
