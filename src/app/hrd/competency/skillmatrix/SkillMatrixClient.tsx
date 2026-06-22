"use client";

import { useState } from "react";
import { Users, Lightbulb, Search, Filter, CheckCircle, AlertTriangle } from "lucide-react";
import PanduanLevel from "@/components/PanduanLevel";

type Employee = { id: string; fullName: string; department: string; position: string };
type Skill = { id: string; name: string; category: string };
type CellData = { empId: string; skillId: string; current: number | null; required: number | null; gap: number | null };

type Props = {
  employees: Employee[];
  skills: Skill[];
  cells: CellData[];
};

function getCategoryBadge(category: string) {
  switch (category) {
    case "Teknis": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Soft Skills": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Manajemen": return "bg-amber-50 text-amber-700 border-amber-200";
    case "HR": return "bg-purple-50 text-purple-700 border-purple-200";
    case "K3": return "bg-orange-50 text-orange-700 border-orange-200";
    case "Operasional": return "bg-cyan-50 text-cyan-700 border-cyan-200";
    default: return "bg-slate-100 text-slate-600";
  }
}

function getLevelBg(level: number | null | undefined) {
  if (level === null || level === undefined) return "bg-gray-100 text-gray-400";
  if (level === 0) return "bg-slate-100 text-slate-400";
  if (level === 1) return "bg-red-100 text-red-700";
  if (level === 2) return "bg-orange-100 text-orange-700";
  if (level === 3) return "bg-yellow-100 text-yellow-700";
  if (level === 4) return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}

function getGapColor(gap: number) {
  if (gap >= 0) return "text-emerald-600";
  if (gap === -1) return "text-amber-600";
  return "text-red-600";
}

export default function SkillMatrixClient({ employees, skills, cells }: Props) {
  const [selectedDept, setSelectedDept] = useState("");
  const [searchName, setSearchName] = useState("");
  const cellMap: Record<string, Record<string, { current: number | null; required: number | null; gap: number | null }>> = {};
  for (const c of cells) {
    if (!cellMap[c.empId]) cellMap[c.empId] = {};
    cellMap[c.empId][c.skillId] = { current: c.current, required: c.required, gap: c.gap };
  }

  const departments = [...new Set(employees.map((e) => e.department))].sort();

  const filteredEmployees = employees.filter((e) => {
    if (selectedDept && e.department !== selectedDept) return false;
    if (searchName && !e.fullName.toLowerCase().includes(searchName.toLowerCase())) return false;
    return true;
  });

  const filteredCellIds = new Set(filteredEmployees.map((e) => e.id));
  const filteredCells = cells.filter((c) => filteredCellIds.has(c.empId));
  const cellsWithGap = filteredCells.filter((c) => c.gap !== null);
  const kompetenCount = cellsWithGap.filter((c) => c.gap! >= 0).length;
  const wajibTrainingCount = cellsWithGap.filter((c) => c.gap! <= -2).length;
  const pctKompeten = cellsWithGap.length > 0 ? ((kompetenCount / cellsWithGap.length) * 100).toFixed(1) : "0";
  const pctWajib = cellsWithGap.length > 0 ? ((wajibTrainingCount / cellsWithGap.length) * 100).toFixed(1) : "0";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Matriks Keahlian</h1>
        <p className="text-sm text-gray-500 mt-1">Pemetaan keahlian karyawan berdasarkan kompetensi dan tingkat kemahiran.</p>
      </div>

      <PanduanLevel />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={14} /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Total Karyawan</p>
              <p className="text-lg font-extrabold text-slate-800">{filteredEmployees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Lightbulb size={14} /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Total Skills</p>
              <p className="text-lg font-extrabold text-slate-800">{skills.length}</p>
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
              <p className="text-[9px] font-bold text-slate-400 uppercase">% Wajib Training</p>
              <p className="text-lg font-extrabold text-red-700">{pctWajib}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="bg-transparent outline-none text-slate-700 placeholder:text-slate-400 w-48"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm">
          <Filter size={14} className="text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-transparent outline-none text-slate-700"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm">Matriks Keahlian Karyawan</h3>
            <p className="text-[10px] text-slate-400">Baris: Karyawan | Kolom: Keahlian | Angka besar: Level Saat Ini | Angka kecil: Gap</p>
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Tidak ada data karyawan yang cocok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase sticky left-0 bg-slate-50/50 z-10 min-w-[200px]">Karyawan</th>
                  {skills.map((s) => (
                    <th key={s.id} className="text-center px-3 py-3 text-[10px] font-bold text-slate-500 uppercase min-w-[100px]">
                      <span className={`px-2 py-0.5 rounded-full border text-[8px] ${getCategoryBadge(s.category)}`}>{s.category}</span>
                      <br />
                      <span className="text-[9px]">{s.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white hover:bg-slate-50/30 z-10">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                          {emp.fullName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">{emp.fullName}</p>
                          <p className="text-[9px] text-slate-400">{emp.department}</p>
                        </div>
                      </div>
                    </td>
                    {skills.map((skill) => {
                      const cell = cellMap[emp.id]?.[skill.id];
                      const gap = cell?.gap ?? null;
                      const current = cell?.current ?? null;
                      const required = cell?.required ?? null;
                      const tooltip = current !== null
                        ? `Level: ${current} / Required: ${required ?? "belum diset"} (Gap: ${gap !== null ? (gap > 0 ? "+" + gap : gap) : "N/A"})`
                        : "Belum dinilai";
                      return (
                        <td key={skill.id} className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5" title={tooltip}>
                            {/* Level badge — always show if current is set */}
                            <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-[11px] font-extrabold cursor-default ${getLevelBg(current)}`}>
                              {current !== null ? current : "—"}
                            </span>
                            {/* Gap badge — only shown when both current and required exist */}
                            {gap !== null && (
                              <span className={`text-[9px] font-bold leading-none ${getGapColor(gap)}`}>
                                {gap > 0 ? "+" + gap : gap}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-4 flex-wrap text-[10px] text-slate-500">
            <span>Total: <b className="text-slate-800">{filteredEmployees.length}</b> karyawan</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Level 5</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> Level 4</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" /> Level 3</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-200" /> Level 2</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Level 1</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /> Belum dinilai</span>
            <span className="flex items-center gap-1 ml-2 border-l border-slate-200 pl-2">Angka kecil di bawah = gap (gap &ge; 0 kompeten, negatif = kurang)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
