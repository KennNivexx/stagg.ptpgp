"use client";

import { useState } from "react";
import { Grid3X3, Users, ExternalLink, Download } from "lucide-react";

// Mock data for the 9-box grid
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

export default function NineBoxPage() {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A2530] mb-2 flex items-center gap-3">
            <Grid3X3 className="text-rose-600" />
            9-Box Talent Review
          </h1>
          <p className="text-sm text-gray-500">
            Pemetaan talenta karyawan berdasarkan matriks Performa (X) dan Potensi (Y) untuk perencanaan suksesi.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors shadow-sm">
          <Download size={16} /> Export Laporan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* The Matrix */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            
            <div className="relative w-full max-w-lg aspect-square">
              {/* Y-Axis Label */}
              <div className="absolute -left-12 top-0 bottom-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest -rotate-90 whitespace-nowrap">Potensi (Potential) &rarr;</span>
              </div>
              
              {/* Grid 3x3 */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-2">
                {/* 
                  Render order in grid matches flex/grid layout naturally (Top-Left to Bottom-Right)
                  So we need: (0,2), (1,2), (2,2) for top row
                  (0,1), (1,1), (2,1) for middle row
                  (0,0), (1,0), (2,0) for bottom row
                */}
                {[
                  "PE", "EL", "HP",
                  "IP", "CC", "SP",
                  "UP", "EP", "HE"
                ].map(cellId => {
                  const cell = GRID_CELLS.find(c => c.id === cellId)!;
                  const isSelected = selectedCell === cell.id;
                  // Mock count of employees
                  const count = Math.floor(Math.random() * 15);
                  
                  return (
                    <button
                      key={cell.id}
                      onClick={() => setSelectedCell(cell.id)}
                      className={`relative flex flex-col items-start justify-between p-3 rounded-xl transition-all duration-200 border-2 overflow-hidden group ${
                        isSelected ? "border-slate-800 scale-[1.02] shadow-md z-10" : "border-transparent hover:scale-105"
                      } ${cell.color}`}
                    >
                      {/* Dark overlay for contrast */}
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
              
              {/* X-Axis Label */}
              <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Performa (Performance) &rarr;</span>
              </div>
            </div>
            
          </div>
        </div>

        {/* Selected Cell Details */}
        <div className="lg:col-span-1">
          {selectedCell ? (
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
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Daftar Karyawan</p>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">K{i}</div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Karyawan Contoh {i}</p>
                          <p className="text-[10px] text-slate-400">Departemen IT</p>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-slate-300 group-hover:text-slate-600" />
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <button className="text-xs font-semibold text-rose-600 hover:text-rose-700">Lihat Semua Karyawan</button>
                  </div>
                </div>
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
