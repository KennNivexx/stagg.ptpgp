"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, Award, Briefcase, Search, ChevronDown, ChevronRight,
  UserCheck, Crown, Mail,
} from "lucide-react";
import { getPositionsMonitor, type PositionMonitor } from "@/app/actions/positions";
import type { Employee } from "@/types/org";
import EmptyState from "@/components/EmptyState";

interface Props {
  departments: string[];
  employees: Employee[];
}

export default function PositionsClient({ departments, employees }: Props) {
  const [positions, setPositions] = useState<PositionMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openRow, setOpenRow] = useState<string | null>(null);

  useEffect(() => {
    getPositionsMonitor().then(data => { setPositions(data); setLoading(false); });
  }, []);

  const positionsByDept = useMemo(() => {
    const map: Record<string, PositionMonitor[]> = {};
    positions.forEach(p => {
      const d = p.department || "Tanpa Departemen";
      if (!map[d]) map[d] = [];
      map[d].push(p);
    });
    const filtered: Record<string, PositionMonitor[]> = {};
    for (const [dept, list] of Object.entries(map)) {
      if (search.trim()) {
        const s = search.toLowerCase();
        const f = list.filter(p => p.name.toLowerCase().includes(s) || p.hierCode.toLowerCase().includes(s));
        if (f.length > 0) filtered[dept] = f;
      } else {
        filtered[dept] = list;
      }
    }
    return filtered;
  }, [positions, search]);

  const totalUnique = positions.length;
  const totalEmployees = employees.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Jabatan", value: totalUnique, icon: <Award size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Total Karyawan", value: totalEmployees, icon: <Users size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Departemen", value: departments.length, icon: <Briefcase size={18} />, color: "bg-amber-50 text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-sky-50 border border-sky-100 text-sky-700 text-xs font-medium rounded-xl px-4 py-3">
        Halaman ini bersifat monitor saja — data diturunkan langsung dari Struktur Organisasi dan Data Karyawan.
        Untuk menambah atau mengubah jabatan, tambahkan melalui <span className="font-bold">Struktur Organisasi</span> atau <span className="font-bold">Departemen</span>.
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Cari kode atau nama jabatan..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
          <p className="text-sm text-slate-400">Memuat data...</p>
        </div>
      ) : positions.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Belum ada data jabatan."
          description="Jabatan akan muncul otomatis setelah ada karyawan atau unit organisasi yang ditambahkan."
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(positionsByDept).map(([dept, list]) => (
            <div key={dept} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                    {dept.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-slate-800">{dept}</p>
                    <p className="text-[10px] text-slate-400">{list.length} jabatan</p>
                  </div>
                  {list[0]?.deptHeadName && (
                    <div className="flex items-center gap-1.5 bg-white border border-amber-200 px-3 py-1.5 rounded-xl" title="Kepala departemen">
                      <Crown size={12} className="text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{list[0].deptHeadName}</p>
                        {list[0].deptHeadEmail && <p className="text-[9px] text-slate-400 truncate">{list[0].deptHeadEmail}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {list.map((pos) => {
                  const rowKey = `${dept}::${pos.hierCode}`;
                  const isOpen = openRow === rowKey;
                  return (
                    <div key={rowKey}>
                      <button
                        onClick={() => setOpenRow(isOpen ? null : rowKey)}
                        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors text-left"
                      >
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded w-32 shrink-0 truncate">{pos.hierCode}</span>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <Award size={12} className="text-amber-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 truncate">{pos.name}</span>
                        </div>
                        {pos.level && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{pos.level}</span>
                        )}
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-600 shrink-0">
                          <Users size={12} className="text-slate-400" /> {pos.employeeCount}
                        </span>
                        {isOpen ? <ChevronDown size={14} className="text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 pt-1 bg-slate-50/60">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white rounded-xl border border-slate-100 p-3">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <UserCheck size={11} /> Pemegang Jabatan ({pos.employeeCount})
                              </p>
                              {pos.employeeNames.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Belum ada karyawan pada jabatan ini.</p>
                              ) : (
                                <ul className="space-y-1">
                                  {pos.employeeNames.map((n, i) => (
                                    <li key={i} className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />{n}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div className="bg-white rounded-xl border border-slate-100 p-3">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Crown size={11} /> Kepala Departemen
                              </p>
                              {pos.deptHeadName ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0">
                                    {pos.deptHeadName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate">{pos.deptHeadName}</p>
                                    {pos.deptHeadEmail && (
                                      <p className="text-[10px] text-slate-400 truncate flex items-center gap-1"><Mail size={10} />{pos.deptHeadEmail}</p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">Kepala departemen belum ditetapkan.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
