"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, Award, Clock, Search, CheckCircle, AlertTriangle } from "lucide-react";
import PanduanLevel from "@/components/PanduanLevel";
import EmptyState from "@/components/EmptyState";

interface EmpSkill {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
  skill_name: string;
  skill_category: string;
  current_level: number;
  required_level: number | null;
  gap: number | null;
  assessed_by: string;
  updated_at: string;
}

interface Props {
  data: EmpSkill[];
  totalEmployees: number;
}

function getCategoryBadge(cat: string) {
  switch (cat) {
    case "Teknis": return "bg-blue-50 text-blue-700";
    case "Soft Skills": return "bg-emerald-50 text-emerald-700";
    case "Manajemen": return "bg-amber-50 text-amber-700";
    case "HR": return "bg-purple-50 text-purple-700";
    case "K3": return "bg-orange-50 text-orange-700";
    case "Operasional": return "bg-cyan-50 text-cyan-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

function getGapBg(gap: number | null) {
  if (gap === null) return "bg-gray-100 text-gray-400";
  if (gap >= 0) return "bg-emerald-100 text-emerald-700";
  if (gap === -1) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function AssessmentClient({ data, totalEmployees }: Props) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const departments = [...new Set(data.map(d => d.department))].sort();

  const filtered = useMemo(() => {
    return data.filter(d => {
      if (search && !d.employee_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (deptFilter && d.department !== deptFilter) return false;
      return true;
    });
  }, [data, search, deptFilter]);

  const assessedEmployees = new Set(filtered.map(d => d.employee_id)).size;
  const withGap = filtered.filter(d => d.gap !== null);
  const wajibTraining = withGap.filter(d => d.gap! <= -2).length;
  const pctKompeten = withGap.length > 0 ? ((withGap.filter(d => d.gap! >= 0).length / withGap.length) * 100).toFixed(1) : "0";
  const lastAssessment = filtered.length > 0 ? new Date(Math.max(...filtered.map(d => new Date(d.updated_at).getTime()))).toLocaleDateString("id-ID") : "—";

  // Setiap karyawan jadi satu kartu, kompetensinya ditampilkan menyamping
  // sebagai kolom tabel — lebih ringkas dibanding satu baris per (karyawan, skill).
  const groupedByEmployee = useMemo(() => {
    const map = new Map<string, { employeeId: string; name: string; department: string; position: string; skills: EmpSkill[]; lastUpdated: string }>();
    for (const row of filtered) {
      const key = row.employee_id || row.employee_name;
      if (!map.has(key)) {
        map.set(key, { employeeId: row.employee_id, name: row.employee_name, department: row.department, position: row.position, skills: [], lastUpdated: row.updated_at });
      }
      const entry = map.get(key)!;
      entry.skills.push(row);
      if (new Date(row.updated_at) > new Date(entry.lastUpdated)) entry.lastUpdated = row.updated_at;
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Asesmen Kompetensi</h1>
        <p className="text-sm text-gray-500 mt-1">Riwayat penilaian kompetensi karyawan (skala 0-5). Penilaian dilakukan oleh Department Manager.</p>
      </div>

      <PanduanLevel />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={14} /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Total Karyawan</p>
              <p className="text-lg font-extrabold text-slate-800">{totalEmployees}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Award size={14} /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Sudah Dinilai</p>
              <p className="text-lg font-extrabold text-slate-800">{assessedEmployees}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={14} /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">% Kompeten</p>
              <p className="text-lg font-extrabold text-emerald-700">{pctKompeten}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={14} /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Wajib Training</p>
              <p className="text-lg font-extrabold text-red-700">{wajibTraining}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm">
          <Search size={14} className="text-slate-400" />
          <input type="text" placeholder="Cari nama karyawan..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-slate-700 placeholder:text-slate-400 w-48" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-600 outline-none">
          <option value="">Semua Departemen</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {groupedByEmployee.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Belum ada data asesmen"
          description="Department Manager dapat melakukan penilaian melalui halaman Kompetensi."
        />
      ) : (
        <div className="space-y-5">
          {groupedByEmployee.map((emp) => (
            <div key={emp.employeeId || emp.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                  <p className="text-[11px] text-slate-400">{emp.department} &middot; {emp.position}</p>
                </div>
                <p className="text-[10px] text-slate-400">Terakhir dinilai: {new Date(emp.lastUpdated).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left py-2.5 px-4 text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">Metrik</th>
                      {emp.skills.map((s) => (
                        <th key={s.id} className="text-center py-2.5 px-4 text-[9px] font-bold text-slate-500 uppercase whitespace-nowrap min-w-[100px]">
                          <p>{s.skill_name}</p>
                          <span className={`inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full normal-case ${getCategoryBadge(s.skill_category)}`}>{s.skill_category}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <td className="py-2 px-4 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">Current</td>
                      {emp.skills.map((s) => (
                        <td key={s.id} className="py-2 px-4 text-center text-xs font-bold text-slate-800">{s.current_level}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">Required</td>
                      {emp.skills.map((s) => (
                        <td key={s.id} className="py-2 px-4 text-center text-xs text-slate-500">{s.required_level !== null ? s.required_level : "—"}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">Gap</td>
                      {emp.skills.map((s) => (
                        <td key={s.id} className="py-2 px-4 text-center">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getGapBg(s.gap)}`}>
                            {s.gap !== null ? (s.gap > 0 ? `+${s.gap}` : s.gap) : "—"}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">Penilai</td>
                      {emp.skills.map((s) => (
                        <td key={s.id} className="py-2 px-4 text-center text-[10px] text-slate-400">{s.assessed_by || "—"}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-slate-400 text-right">
            Total: <span className="font-bold text-slate-600">{filtered.length}</span> asesmen di <span className="font-bold text-slate-600">{groupedByEmployee.length}</span> karyawan &middot; Terakhir: {lastAssessment}
          </p>
        </div>
      )}
    </div>
  );
}
