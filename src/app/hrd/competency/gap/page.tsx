"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, AlertTriangle, ArrowUpRight, Users, Target, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";

type Employee = {
  id: string;
  full_name: string;
  department: string;
  position: string;
};

type GapAnalysis = {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  currentSkills: { skill: string; level: number; required: number }[];
  avgGap: number;
  severity: string;
};

const REQUIRED_SKILLS: Record<string, { skill: string; level: number }[]> = {
  "Manager": [
    { skill: "Kepemimpinan Tim", level: 4 },
    { skill: "Pengambilan Keputusan", level: 4 },
    { skill: "Komunikasi Efektif", level: 3 },
    { skill: "Manajemen Proyek", level: 3 },
    { skill: "Manajemen Keuangan", level: 3 },
  ],
  "Staff": [
    { skill: "Kerja Sama Tim", level: 3 },
    { skill: "Komunikasi Efektif", level: 2 },
    { skill: "Problem Solving", level: 2 },
    { skill: "Manajemen Waktu", level: 3 },
  ],
  "Supervisor": [
    { skill: "Kepemimpinan Tim", level: 3 },
    { skill: "Pengambilan Keputusan", level: 3 },
    { skill: "Komunikasi Efektif", level: 3 },
    { skill: "Coaching & Mentoring", level: 2 },
  ],
};

const generateCurrentLevel = (empIdx: number, skillIdx: number): number => {
  const seed = (empIdx * 50 + skillIdx * 11) % 100;
  if (seed < 10) return 0;
  if (seed < 35) return 1;
  if (seed < 65) return 2;
  if (seed < 85) return 3;
  return 4;
};

const ALL_SKILLS = ["Kepemimpinan Tim", "Pengambilan Keputusan", "Komunikasi Efektif", "Kerja Sama Tim", "Problem Solving", "Manajemen Waktu", "Manajemen Proyek", "Coaching & Mentoring", "Manajemen Keuangan", "Pemrograman Web", "Analisis Data", "Customer Service"];

export default function AnalisisKesenjanganKompetensi() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [analyses, setAnalyses] = useState<GapAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("employees")
      .select("id, full_name, department, position")
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        const emps = (data as Employee[]) || [];
        setEmployees(emps);

        const results: GapAnalysis[] = emps.map((emp, ei) => {
          const positionLevel = emp.position?.toLowerCase().includes("manager") ? "Manager"
            : emp.position?.toLowerCase().includes("supervisor") ? "Supervisor" : "Staff";
          const required = REQUIRED_SKILLS[positionLevel] || REQUIRED_SKILLS["Staff"];
          const allSkills = [...ALL_SKILLS];
          const currentSkills = allSkills.slice(0, 5).map((skill, si) => {
            const reqSkill = required.find((r) => r.skill === skill);
            return {
              skill,
              level: generateCurrentLevel(ei, si),
              required: reqSkill ? reqSkill.level : 1,
            };
          });
          const gaps = currentSkills.map((s) => Math.max(0, s.required - s.level));
          const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
          return {
            employeeId: emp.id,
            employeeName: emp.full_name,
            department: emp.department,
            position: emp.position,
            currentSkills,
            avgGap,
            severity: avgGap >= 2 ? "Tinggi" : avgGap >= 1 ? "Sedang" : "Rendah",
          };
        });

        setAnalyses(results);
        setLoading(false);
      });
  }, []);

  const getGapColor = (gap: number) => {
    if (gap >= 3) return "text-red-600 bg-red-50";
    if (gap >= 2) return "text-orange-600 bg-orange-50";
    if (gap >= 1) return "text-amber-600 bg-amber-50";
    return "text-emerald-600 bg-emerald-50";
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "Tinggi") return "bg-red-50 text-red-700";
    if (severity === "Sedang") return "bg-amber-50 text-amber-700";
    return "bg-emerald-50 text-emerald-700";
  };

  const highGapCount = analyses.filter((a) => a.severity === "Tinggi").length;
  const mediumGapCount = analyses.filter((a) => a.severity === "Sedang").length;
  const avgCompanyGap = analyses.length > 0 ? (analyses.reduce((s, a) => s + a.avgGap, 0) / analyses.length).toFixed(1) : "0";

  const recommendations = [
    "Prioritaskan pelatihan Kepemimpinan dan Pengambilan Keputusan untuk karyawan dengan gap tinggi",
    "Adakan workshop Komunikasi Efektif bagi staf dengan gap sedang",
    "Implementasikan program coaching & mentoring untuk transfer pengetahuan",
    "Buat roadmap pengembangan individual untuk karyawan dengan kesenjangan kritis",
    "Lakukan review berkala setiap 3 bulan untuk memantau perkembangan",
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Analisis Kesenjangan Kompetensi</h1>
        <p className="text-sm text-gray-500 mt-1">Identifikasi kesenjangan antara kompetensi saat ini dengan standar yang dibutuhkan untuk setiap posisi.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Karyawan</p>
              <p className="text-xl font-extrabold text-slate-800">{analyses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Gap Tinggi</p>
              <p className="text-xl font-extrabold text-red-700">{highGapCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Target size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Gap Sedang</p>
              <p className="text-xl font-extrabold text-amber-700">{mediumGapCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Gap</p>
              <p className="text-xl font-extrabold text-slate-800">{avgCompanyGap}/4</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Matriks Kesenjangan per Karyawan</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
              <p className="text-sm text-gray-500">Memuat data...</p>
            </div>
          ) : analyses.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={40} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Belum ada data karyawan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Karyawan</th>
                    {ALL_SKILLS.slice(0, 5).map((s) => (
                      <th key={s} className="text-center px-2 py-3 text-[8px] font-bold text-slate-500 uppercase">{s.substring(0, 8)}</th>
                    ))}
                    <th className="text-center px-3 py-3 text-xs font-bold text-slate-500 uppercase">Rata-rata Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {analyses.slice(0, 15).map((a) => (
                    <tr key={a.employeeId} className="hover:bg-slate-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-[8px] shrink-0">
                            {a.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[11px] text-slate-800 truncate">{a.employeeName}</p>
                            <p className="text-[9px] text-slate-400">{a.position}</p>
                          </div>
                        </div>
                      </td>
                      {a.currentSkills.slice(0, 5).map((s) => {
                        const gap = Math.max(0, s.required - s.level);
                        return (
                          <td key={s.skill} className="px-2 py-3 text-center">
                            <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-bold ${getGapColor(gap)}`}>
                              {gap > 0 ? `-${gap}` : "OK"}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getSeverityColor(a.severity)}`}>
                          {a.avgGap.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" /> Rekomendasi
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-[#CC0000] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[11px] text-slate-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
