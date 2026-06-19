"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, Award, Clock, Search, CheckCircle, AlertTriangle } from "lucide-react";
import PanduanLevel from "@/components/PanduanLevel";

interface EmpSkill {
  id: string;
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

  const assessedEmployees = new Set(filtered.map(d => d.employee_name)).size;
  const withGap = filtered.filter(d => d.gap !== null);
  const wajibTraining = withGap.filter(d => d.gap! <= -2).length;
  const pctKompeten = withGap.length > 0 ? ((withGap.filter(d => d.gap! >= 0).length / withGap.length) * 100).toFixed(1) : "0";
  const lastAssessment = filtered.length > 0 ? new Date(Math.max(...filtered.map(d => new Date(d.updated_at).getTime()))).toLocaleDateString("id-ID") : "—";

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

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Award size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500 font-bold">Belum ada data asesmen</p>
          <p className="text-xs text-slate-400 mt-1">Department Manager dapat melakukan penilaian melalui halaman Kompetensi.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase">Karyawan</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase">Skill</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase">Current</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase">Required</th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase">Gap</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase">Penilai</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-4">
                      <p className="text-xs font-bold text-slate-800">{row.employee_name}</p>
                      <p className="text-[10px] text-slate-400">{row.department} · {row.position}</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <div>
                        <p className="text-xs font-medium text-slate-700">{row.skill_name}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getCategoryBadge(row.skill_category)}`}>{row.skill_category}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-xs font-bold text-slate-800">{row.current_level}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-xs text-slate-500">{row.required_level !== null ? row.required_level : "—"}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getGapBg(row.gap)}`}>
                        {row.gap !== null ? (row.gap > 0 ? `+${row.gap}` : row.gap) : "—"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">{row.assessed_by || "—"}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">
                      {new Date(row.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/30 text-[10px] text-slate-400">
            Total: <span className="font-bold text-slate-600">{filtered.length}</span> asesmen &middot;
            <span className="ml-2">Terakhir: {lastAssessment}</span>
          </div>
        </div>
      )}
    </div>
  );
}
