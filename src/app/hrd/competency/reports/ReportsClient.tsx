"use client";

import { useRef, useState } from "react";
import { Users, Award, CheckCircle, AlertTriangle, FileSpreadsheet, FileDown } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import type { MatrixRow } from "./page";

interface Props {
  matrixRows: MatrixRow[];
  gapRows: MatrixRow[];
  totalEmployees: number;
  assessedEmployees: number;
  avgCurrentLevel: number;
  pctKompeten: number;
  wajibTraining: number;
}

export default function ReportsClient({ matrixRows, gapRows, totalEmployees, assessedEmployees, avgCurrentLevel, pctKompeten, wajibTraining }: Props) {
  const [exporting, setExporting] = useState<"matrix" | "skillmatrix" | "gap" | "pdf" | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const exportExcel = async (rows: MatrixRow[], sheetName: string, filenamePrefix: string, key: "matrix" | "skillmatrix" | "gap") => {
    if (exporting) return;
    setExporting(key);
    try {
      const data = rows.map((r) => ({
        "Nama Karyawan": r.employeeName,
        "Departemen": r.department,
        "Jabatan": r.position,
        "Kompetensi": r.skillName,
        "Kategori": r.skillCategory,
        "Current Level": r.currentLevel ?? "-",
        "Required Level": r.requiredLevel ?? "-",
        "Gap": r.gap ?? "-",
      }));
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 13 }, { wch: 8 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${filenamePrefix}-${stamp}.xlsx`);
    } catch (e) {
      console.error("[competency/reports] export excel error:", e);
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || exporting) return;
    setExporting("pdf");
    try {
      const { toPng } = await import("html-to-image");
      const jsPDF = (await import("jspdf")).default;
      const dataUrl = await toPng(reportRef.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
      const img = new window.Image();
      img.src = dataUrl;
      await new Promise<void>((r) => { img.onload = () => r(); });
      const pdf = new jsPDF({ orientation: img.width > img.height ? "landscape" : "portrait", unit: "px", format: [img.width, img.height] });
      pdf.addImage(img, "PNG", 0, 0, img.width, img.height);
      const stamp = new Date().toISOString().slice(0, 10);
      pdf.save(`Laporan-Kompetensi-${stamp}.pdf`);
    } catch (e) {
      console.error("[competency/reports] export pdf error:", e);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Kompetensi</h1>
          <p className="text-sm text-gray-500">Competency Matrix, Skill Matrix, dan Gap Report seluruh karyawan.</p>
        </div>
        <button onClick={handleExportPDF} disabled={!!exporting}
          className="px-4 py-2 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
          <FileDown size={14} /> {exporting === "pdf" ? "Mengekspor..." : "Export PDF"}
        </button>
      </div>

      <div ref={reportRef} className="space-y-8 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Sudah Dinilai</p>
                <p className="text-xl font-extrabold text-slate-800">{assessedEmployees} <span className="text-xs font-normal text-slate-400">/ {totalEmployees}</span></p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Award size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Current Level</p>
                <p className="text-xl font-extrabold text-slate-800">{avgCurrentLevel.toFixed(1)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">% Kompeten</p>
                <p className="text-xl font-extrabold text-emerald-700">{pctKompeten.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Wajib Training</p>
                <p className="text-xl font-extrabold text-red-700">{wajibTraining}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-1">Competency Matrix</h3>
            <p className="text-xs text-slate-400 mb-4">Seluruh baris karyawan × kompetensi ({matrixRows.length} baris).</p>
            <button onClick={() => exportExcel(matrixRows, "Competency Matrix", "Competency-Matrix", "matrix")} disabled={!!exporting}
              className="w-full px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <FileSpreadsheet size={13} /> {exporting === "matrix" ? "Mengekspor..." : "Export Excel"}
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-1">Skill Matrix</h3>
            <p className="text-xs text-slate-400 mb-4">Sama seperti Competency Matrix, format untuk review skill per jabatan.</p>
            <button onClick={() => exportExcel(matrixRows, "Skill Matrix", "Skill-Matrix", "skillmatrix")} disabled={!!exporting}
              className="w-full px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <FileSpreadsheet size={13} /> {exporting === "skillmatrix" ? "Mengekspor..." : "Export Excel"}
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-1">Gap Report</h3>
            <p className="text-xs text-slate-400 mb-4">Hanya baris dengan gap negatif ({gapRows.length} baris).</p>
            <button onClick={() => exportExcel(gapRows, "Gap Report", "Gap-Report", "gap")} disabled={!!exporting}
              className="w-full px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <FileSpreadsheet size={13} /> {exporting === "gap" ? "Mengekspor..." : "Export Excel"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Top Gap Kompetensi (Wajib Training)</h3>
          </div>
          {gapRows.filter((r) => (r.gap || 0) <= -2).length === 0 ? (
            <EmptyState icon={CheckCircle} title="Tidak ada gap wajib-training saat ini." />
          ) : (
            <div className="divide-y divide-slate-50">
              {gapRows.filter((r) => (r.gap || 0) <= -2).slice(0, 15).map((r, i) => (
                <div key={`${r.employeeId}-${r.skillId}-${i}`} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{r.employeeName}</p>
                    <p className="text-[10px] text-slate-400">{r.department} · {r.skillName}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-red-100 text-red-700">{r.gap}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
