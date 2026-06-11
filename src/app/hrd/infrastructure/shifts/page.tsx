"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, Users, Sun, Moon, Sunset, Plus, X, Save } from "lucide-react";

type Employee = {
  id: string;
  full_name: string;
  department: string;
  position: string;
};

type ShiftAssignment = {
  employeeId: string;
  employeeName: string;
  department: string;
  shift: string;
};

const SHIFT_DEFS = [
  { id: "pagi", name: "Pagi", time: "06:00 - 14:00", icon: Sun, color: "bg-amber-50 text-amber-700 border-amber-200", gradient: "from-amber-400 to-orange-500" },
  { id: "siang", name: "Siang", time: "14:00 - 22:00", icon: Sunset, color: "bg-orange-50 text-orange-700 border-orange-200", gradient: "from-orange-400 to-red-500" },
  { id: "malam", name: "Malam", time: "22:00 - 06:00", icon: Moon, color: "bg-indigo-50 text-indigo-700 border-indigo-200", gradient: "from-indigo-500 to-purple-600" },
];

const INITIAL_ASSIGNMENTS: ShiftAssignment[] = [];

export default function ManajemenShiftKerja() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>(INITIAL_ASSIGNMENTS);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ employeeId: "", shift: "pagi" });

  useEffect(() => {
    supabase
      .from("employees")
      .select("id, full_name, department, position")
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        const emps = (data as Employee[]) || [];
        setEmployees(emps);
        if (assignments.length === 0 && emps.length > 0) {
          const initial: ShiftAssignment[] = emps.map((e, i) => ({
            employeeId: e.id,
            employeeName: e.full_name,
            department: e.department,
            shift: SHIFT_DEFS[i % 3].id,
          }));
          setAssignments(initial);
        }
        setLoading(false);
      });
  }, []);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((em) => em.id === formData.employeeId);
    if (!emp) return;
    const existing = assignments.findIndex((a) => a.employeeId === formData.employeeId);
    const newAssign: ShiftAssignment = {
      employeeId: emp.id,
      employeeName: emp.full_name,
      department: emp.department,
      shift: formData.shift,
    };
    if (existing >= 0) {
      const updated = [...assignments];
      updated[existing] = newAssign;
      setAssignments(updated);
    } else {
      setAssignments([...assignments, newAssign]);
    }
    setShowForm(false);
    setFormData({ employeeId: "", shift: "pagi" });
  };

  const getShiftDef = (shiftId: string) => SHIFT_DEFS.find((s) => s.id === shiftId) || SHIFT_DEFS[0];

  const assignedIds = assignments.map((a) => a.employeeId);
  const unassigned = employees.filter((e) => !assignedIds.includes(e.id));

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Manajemen Shift Kerja</h1>
          <p className="text-sm text-gray-500 mt-1">Atur pembagian shift kerja karyawan: Pagi, Siang, dan Malam.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Plus size={14} /> Tambah Karyawan ke Shift
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {SHIFT_DEFS.map((shift) => {
          const count = assignments.filter((a) => a.shift === shift.id).length;
          return (
            <div key={shift.id} className={`bg-white rounded-2xl border ${shift.color.split(" ")[2]} shadow-sm p-5`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${shift.gradient} text-white`}>
                  <shift.icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">{shift.name}</p>
                  <p className="text-[10px] text-slate-500">{shift.time}</p>
                  <p className="text-lg font-extrabold text-slate-800 mt-1">{count} <span className="text-xs font-normal text-slate-500">karyawan</span></p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Karyawan ke Shift</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Karyawan</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                >
                  <option value="">Pilih Karyawan</option>
                  {unassigned.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name} - {e.department}</option>
                  ))}
                  {unassigned.length === 0 && <option disabled>Semua karyawan sudah ditugaskan</option>}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shift</label>
                <div className="grid grid-cols-3 gap-2">
                  {SHIFT_DEFS.map((s) => (
                    <label
                      key={s.id}
                      className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                        formData.shift === s.id
                          ? `${s.color} border-current`
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shift"
                        value={s.id}
                        checked={formData.shift === s.id}
                        onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                        className="sr-only"
                      />
                      <s.icon size={16} className={`mx-auto mb-1 ${formData.shift === s.id ? "" : "text-slate-400"}`} />
                      <p className="text-[10px] font-bold">{s.name}</p>
                      <p className="text-[9px] text-slate-400">{s.time}</p>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Save size={14} /> Simpan Penugasan
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
          <p className="text-sm text-gray-500">Memuat data shift...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {SHIFT_DEFS.map((shift) => {
            const shiftMembers = assignments.filter((a) => a.shift === shift.id);
            return (
              <div key={shift.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className={`p-4 border-b border-slate-100 rounded-t-2xl bg-gradient-to-r ${shift.gradient} text-white`}>
                  <div className="flex items-center gap-3">
                    <shift.icon size={20} />
                    <div>
                      <h3 className="font-extrabold text-sm">{shift.name}</h3>
                      <p className="text-[10px] opacity-80">{shift.time}</p>
                    </div>
                    <span className="ml-auto bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{shiftMembers.length}</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                  {shiftMembers.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users size={28} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">Belum ada karyawan</p>
                    </div>
                  ) : (
                    shiftMembers.map((a, i) => (
                      <div key={a.employeeId} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/30 transition-colors">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                          {a.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{a.employeeName}</p>
                          <p className="text-[10px] text-slate-400">{a.department}</p>
                        </div>
                        <button
                          onClick={() => {
                            setAssignments(assignments.filter((as) => as.employeeId !== a.employeeId));
                          }}
                          className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-colors"
                          title="Hapus dari shift"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
