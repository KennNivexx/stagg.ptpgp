"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart3, Users, Code, Heart, Lightbulb, Briefcase } from "lucide-react";

type Employee = {
  id: string;
  full_name: string;
  department: string;
  position: string;
};

const SKILLS = [
  { name: "Pemrograman", category: "Teknis" },
  { name: "Analisis Data", category: "Teknis" },
  { name: "Komunikasi", category: "Soft Skills" },
  { name: "Kerja Sama Tim", category: "Soft Skills" },
  { name: "Kepemimpinan", category: "Leadership" },
  { name: "Manajemen Proyek", category: "Leadership" },
  { name: "Manajemen Keuangan", category: "Fungsional" },
  { name: "Layanan Pelanggan", category: "Fungsional" },
];

const PROFICIENCY = ["None", "Basic", "Intermediate", "Advanced", "Expert"] as const;

const generateProficiency = (empIdx: number, skillIdx: number): number => {
  const seed = empIdx * 100 + skillIdx * 7;
  return (seed % 4) + 1;
};

export default function MatriksKeahlian() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getProficiencyColor = (level: number) => {
    switch (level) {
      case 4: return "bg-emerald-500 text-white";
      case 3: return "bg-blue-500 text-white";
      case 2: return "bg-amber-400 text-white";
      case 1: return "bg-slate-300 text-slate-700";
      default: return "bg-slate-100 text-slate-400";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Teknis": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Soft Skills": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Leadership": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Fungsional": return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const summaryBySkill = SKILLS.map((skill, si) => ({
    ...skill,
    avgLevel: employees.length > 0
      ? (employees.reduce((sum, _, ei) => sum + generateProficiency(ei, si), 0) / employees.length).toFixed(1)
      : "0",
  }));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Matriks Keahlian</h1>
        <p className="text-sm text-gray-500 mt-1">Pemetaan keahlian karyawan berdasarkan kompetensi dan tingkat kemahiran.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {summaryBySkill.map((s) => (
          <div key={s.name} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{s.category}</p>
            <p className="text-sm font-extrabold text-slate-800">{s.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 bg-slate-200 rounded-full flex-1 overflow-hidden">
                <div
                  className="h-full bg-[#CC0000] rounded-full"
                  style={{ width: `${(Number(s.avgLevel) / 4) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600">{s.avgLevel}/4</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Matriks Keahlian Karyawan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Baris: Karyawan | Kolom: Keahlian | Angka: Level Kemahiran</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-300" /> Basic</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400" /> Intermediate</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> Advanced</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Expert</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
            <p className="text-sm text-gray-500">Memuat data...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada data karyawan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase sticky left-0 bg-slate-50/50 z-10 min-w-[180px]">Karyawan</th>
                  {SKILLS.map((s) => (
                    <th key={s.name} className="text-center px-3 py-3 text-[10px] font-bold text-slate-500 uppercase min-w-[90px]">
                      <span className={`px-2 py-0.5 rounded-full border text-[8px] ${getCategoryColor(s.category)}`}>{s.category}</span>
                      <br />
                      <span className="text-[9px]">{s.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((emp, ei) => (
                  <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white hover:bg-slate-50/30 z-10">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                          {emp.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">{emp.full_name}</p>
                          <p className="text-[9px] text-slate-400">{emp.department}</p>
                        </div>
                      </div>
                    </td>
                    {SKILLS.map((_, si) => {
                      const level = generateProficiency(ei, si);
                      return (
                        <td key={si} className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold ${getProficiencyColor(level)}`}>
                            {level}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
