"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Sparkles, Plus, X, Save, Users, Award, Clock, Search } from "lucide-react";

type Employee = {
  id: string;
  full_name: string;
  department: string;
  position: string;
};

type Assessment = {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  competency: string;
  level: string;
  score: number;
  notes: string;
  assessedAt: string;
};

const COMPETENCIES = [
  "Pemrograman Web", "Analisis Data", "Manajemen Database", "Infrastruktur Cloud",
  "Komunikasi Efektif", "Kerja Sama Tim", "Problem Solving", "Manajemen Waktu",
  "Kepemimpinan Tim", "Pengambilan Keputusan", "Manajemen Proyek", "Coaching & Mentoring",
  "Manajemen Keuangan", "Manajemen SDM", "Customer Service", "Supply Chain",
];

const LEVELS = [
  { value: "Basic", score: 1, color: "bg-slate-200" },
  { value: "Intermediate", score: 2, color: "bg-amber-300" },
  { value: "Advanced", score: 3, color: "bg-blue-400" },
  { value: "Expert", score: 4, color: "bg-emerald-400" },
];

const INITIAL_ASSESSMENTS: Assessment[] = [
  { id: "1", employeeId: "emp-1", employeeName: "", department: "", competency: "Pemrograman Web", level: "Advanced", score: 3, notes: "Menguasai React dan Node.js dengan baik", assessedAt: "2026-05-15" },
  { id: "2", employeeId: "emp-1", employeeName: "", department: "", competency: "Komunikasi Efektif", level: "Intermediate", score: 2, notes: "Perlu peningkatan presentasi", assessedAt: "2026-05-15" },
];

export default function AsesmenKompetensi() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>(INITIAL_ASSESSMENTS);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [formData, setFormData] = useState({ competency: "Pemrograman Web", level: "Intermediate", score: 2, notes: "" });

  useEffect(() => {
    supabase
      .from("employees")
      .select("id, full_name, department, position")
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        setEmployees((data as Employee[]) || []);
        setLoading(false);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((em) => em.id === selectedEmployee);
    if (!emp) return;
    const newAssess: Assessment = {
      id: Date.now().toString(),
      employeeId: emp.id,
      employeeName: emp.full_name,
      department: emp.department,
      competency: formData.competency,
      level: formData.level,
      score: formData.score,
      notes: formData.notes,
      assessedAt: new Date().toISOString().split("T")[0],
    };
    setAssessments([newAssess, ...assessments]);
    setShowForm(false);
    setFormData({ competency: "Pemrograman Web", level: "Intermediate", score: 2, notes: "" });
    setSelectedEmployee("");
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Expert": return "bg-emerald-50 text-emerald-700";
      case "Advanced": return "bg-blue-50 text-blue-700";
      case "Intermediate": return "bg-amber-50 text-amber-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const filteredAssessments = selectedEmployee ? assessments.filter((a) => a.employeeId === selectedEmployee) : assessments;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Asesmen Kompetensi</h1>
          <p className="text-sm text-gray-500 mt-1">Lakukan penilaian kompetensi karyawan berdasarkan standar yang ditetapkan.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Plus size={14} /> Asesmen Baru
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Karyawan</p>
              <p className="text-xl font-extrabold text-slate-800">{employees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Sparkles size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Asesmen</p>
              <p className="text-xl font-extrabold text-slate-800">{assessments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Asesmen Bulan Ini</p>
              <p className="text-xl font-extrabold text-slate-800">{assessments.filter((a) => {
                const d = new Date(a.assessedAt);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Asesmen Kompetensi Baru</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Karyawan</label>
                <select required value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih Karyawan</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} - {e.department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kompetensi</label>
                <select required value={formData.competency} onChange={(e) => setFormData({ ...formData, competency: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  {COMPETENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Level Kemahiran</label>
                <div className="grid grid-cols-4 gap-2">
                  {LEVELS.map((l) => (
                    <label
                      key={l.value}
                      className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                        formData.level === l.value
                          ? "border-[#CC0000] bg-red-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      } ${formData.score >= l.score ? l.color : ""}`}
                    >
                      <input type="radio" name="level" value={l.value} checked={formData.level === l.value}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value, score: l.score })} className="sr-only" />
                      <p className="text-[10px] font-bold">{l.value}</p>
                      <p className="text-[9px] text-slate-400">{l.score}/4</p>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Penilaian</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" rows={2} placeholder="Catatan hasil asesmen..." />
              </div>
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Save size={14} /> Simpan Asesmen
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-gray-600 outline-none"
        >
          <option value="">Semua Karyawan</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
        {selectedEmployee && (
          <button onClick={() => setSelectedEmployee("")} className="text-xs text-[#CC0000] hover:underline">Tampilkan semua</button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Karyawan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Kompetensi</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Level</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nilai</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Catatan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Award size={40} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">Belum ada data asesmen.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAssessments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                            {a.employeeName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-800">{a.employeeName || "-"}</p>
                            <p className="text-[9px] text-slate-400">{a.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700 font-medium">{a.competency}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getLevelColor(a.level)}`}>{a.level}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} className={`w-3 h-3 rounded-full ${n <= a.score ? "bg-[#CC0000]" : "bg-slate-200"}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">{a.notes || "-"}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(a.assessedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredAssessments.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <p className="text-xs text-slate-500">Total: <span className="font-bold text-slate-800">{filteredAssessments.length}</span> asesmen</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
