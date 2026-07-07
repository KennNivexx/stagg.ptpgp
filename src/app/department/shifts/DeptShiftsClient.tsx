"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Users, Sun, Moon, Sunset, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { getShiftSchedulesForDept } from "@/app/actions/infrastructure";

type Employee = { id: string; full_name: string; department: string; position: string };
type Shift = { id: string; name: string; start_time: string; end_time: string; color: string };
type Schedule = { id: string; employee_id: string; shift_id: string; shift_date: string };

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  amber: Sun, orange: Sunset, indigo: Moon,
};
const COLOR_STYLES: Record<string, { badge: string; dot: string }> = {
  amber:  { badge: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-500" },
  orange: { badge: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  indigo: { badge: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  emerald:{ badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  purple: { badge: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  rose:   { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
};

const MONTH_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAY_NAMES = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function fmtDate(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

export default function DeptShiftsClient({ shifts, employees, department }: { shifts: Shift[]; employees: Employee[]; department: string | null }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleMonthKey, setScheduleMonthKey] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStart = fmtDate(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  const monthEnd = fmtDate(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
  const loading = scheduleMonthKey !== monthStart;

  const loadSchedules = useCallback(async () => {
    const data = await getShiftSchedulesForDept(monthStart, monthEnd);
    setSchedules(data as Schedule[]);
    setScheduleMonthKey(monthStart);
  }, [monthStart, monthEnd]);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  const empMap = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const shiftMap = useMemo(() => Object.fromEntries(shifts.map((s) => [s.id, s])), [shifts]);

  const schedulesByDate = useMemo(() => {
    const m: Record<string, Schedule[]> = {};
    for (const s of schedules) { (m[s.shift_date] ||= []).push(s); }
    return m;
  }, [schedules]);

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

  if (!department) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState icon={Users} title="Departemen tidak ditemukan" description="Akun Anda belum terhubung ke data karyawan departemen manapun." />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Shift Kerja Departemen</h1>
        <p className="text-sm text-gray-500 mt-1">{department} &mdash; tampilan baca saja, dikelola oleh HRD.</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">{employees.length} karyawan di departemen ini</p>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Memuat jadwal shift...</p>
        </div>
      ) : (
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
                      isSelected ? "border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20" : "border-slate-100 hover:border-slate-300"
                    } ${isToday ? "bg-slate-50" : ""}`}
                  >
                    <span className={`text-[10px] font-bold ${isToday ? "text-emerald-600" : "text-slate-500"}`}>{dayNum}</span>
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

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            {selectedDate ? (
              <>
                <div className="mb-4">
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                  </h3>
                  <p className="text-[10px] text-slate-400">{(schedulesByDate[selectedDate] || []).length} karyawan bertugas</p>
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
                            </div>
                          </div>
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
      )}
    </div>
  );
}
