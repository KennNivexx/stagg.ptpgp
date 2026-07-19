"use client";

import { useState } from "react";
import { Grid3X3, Users, ExternalLink } from "lucide-react";

const GRID_CELLS = [
  { id: "HP", name: "High Potential", x: 2, y: 2, color: "bg-emerald-500", desc: "Top talent, siap untuk promosi (High Perf, High Pot)" },
  { id: "EL", name: "Emerging Leader", x: 1, y: 2, color: "bg-blue-500", desc: "Potensi tinggi namun performa perlu ditingkatkan (Mid Perf, High Pot)" },
  { id: "PE", name: "Potential Enigma", x: 0, y: 2, color: "bg-violet-500", desc: "Potensi tinggi tapi performa rendah, butuh intervensi (Low Perf, High Pot)" },

  { id: "SP", name: "Solid Performer", x: 2, y: 1, color: "bg-indigo-500", desc: "Aset berharga, performa konsisten tinggi (High Perf, Mid Pot)" },
  { id: "CC", name: "Core Contributor", x: 1, y: 1, color: "bg-yellow-500", desc: "Kontributor utama yang andal (Mid Perf, Mid Pot)" },
  { id: "IP", name: "Inconsistent Player", x: 0, y: 1, color: "bg-orange-400", desc: "Performa kurang stabil (Low Perf, Mid Pot)" },

  { id: "HE", name: "High Professional", x: 2, y: 0, color: "bg-teal-500", desc: "Ahli di bidangnya, performa tinggi tapi mentok (High Perf, Low Pot)" },
  { id: "EP", name: "Effective Professional", x: 1, y: 0, color: "bg-slate-500", desc: "Pekerja rutin dengan performa rata-rata (Mid Perf, Low Pot)" },
  { id: "UP", name: "Underperformer", x: 0, y: 0, color: "bg-red-500", desc: "Performa buruk, potensi rendah. Butuh PIP (Low Perf, Low Pot)" },
];

type CellData = { count: number; employees: { id: string; full_name: string; department: string }[] };

export default function NineBoxClient({ cells, unscored, totalScored }: { cells: Record<string, CellData>; unscored: number; totalScored: number }) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const selectedData = selectedCell ? cells[`${GRID_CELLS.find(c => c.id === selectedCell)!.x},${GRID_CELLS.find(c => c.id === selectedCell)!.y}`] : null;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A2530] mb-2 flex items-center gap-3">
            <Grid3X3 className="text-rose-600" />
            9-Box Talent Review
          </h1>
          <p className="text-sm text-gray-500">
            Pemetaan talenta karyawan berdasarkan matriks Performa (X, dari KPI) dan Potensi (Y, dari kompetensi + pembelajaran + masa kerja).
          </p>
        </div>
        {unscored > 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {unscored} karyawan belum punya data KPI/kompetensi cukup untuk dipetakan ({totalScored} dari {totalScored + unscored} berhasil dipetakan).
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="relative w-full max-w-lg aspect-square">
              <div className="absolute -left-12 top-0 bottom-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest -rotate-90 whitespace-nowrap">Potensi (Potential) &rarr;</span>
              </div>

              <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-2">
                {["PE", "EL", "HP", "IP", "CC", "SP", "UP", "EP", "HE"].map(cellId => {
                  const cell = GRID_CELLS.find(c => c.id === cellId)!;
                  const isSelected = selectedCell === cell.id;
                  const count = cells[`${cell.x},${cell.y}`]?.count ?? 0;

                  return (
                    <button
                      key={cell.id}
                      onClick={() => setSelectedCell(cell.id)}
                      className={`relative flex flex-col items-start justify-between p-3 rounded-xl transition-all duration-200 border-2 overflow-hidden group ${
                        isSelected ? "border-slate-800 scale-[1.02] shadow-md z-10" : "border-transparent hover:scale-105"
                      } ${cell.color}`}
                    >
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors pointer-events-none"></div>
                      <div className="relative z-10 text-white font-extrabold text-xs sm:text-sm text-left leading-tight drop-shadow-sm">
                        {cell.name}
                      </div>
                      <div className="relative z-10 mt-auto pt-2 flex items-center gap-1.5 text-white/90">
                        <Users size={14} />
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Performa (Performance) &rarr;</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedCell && selectedData ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
              <div className="mb-6">
                <div className={`w-10 h-10 rounded-lg mb-4 flex items-center justify-center text-white font-bold ${GRID_CELLS.find(c => c.id === selectedCell)?.color}`}>
                  {selectedCell}
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-1">
                  {GRID_CELLS.find(c => c.id === selectedCell)?.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {GRID_CELLS.find(c => c.id === selectedCell)?.desc}
                </p>
              </div>

              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4 overflow-y-auto">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Daftar Karyawan ({selectedData.count})</p>
                {selectedData.employees.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Tidak ada karyawan di kategori ini.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedData.employees.map(emp => (
                      <div key={emp.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {emp.full_name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{emp.full_name}</p>
                            <p className="text-[10px] text-slate-400">{emp.department}</p>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-slate-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-full flex flex-col items-center justify-center text-center">
              <Grid3X3 size={48} className="text-slate-300 mb-4" />
              <p className="text-sm font-semibold text-slate-500">Pilih salah satu kotak di matriks</p>
              <p className="text-xs text-slate-400 mt-1">Untuk melihat detail dan daftar karyawan yang berada di klasifikasi tersebut.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
