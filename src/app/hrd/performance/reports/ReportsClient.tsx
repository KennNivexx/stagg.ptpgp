"use client";

import { useRef, useState } from "react";
import { FileText, TrendingUp, Award, Users, Download, Building, Star, Target, FileSpreadsheet, FileDown } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import RankedBar from "@/components/charts/RankedBar";

type Evaluation = Record<string, unknown>;
type DeptRow = { dept: string; count: number; avg: number; employeeCount: number };

interface Props {
  evaluations: Evaluation[];
  totalEval: number;
  avgScore: number;
  completed: number;
  uniqueEmployees: number;
  deptBreakdown: DeptRow[];
}

export default function ReportsClient({ evaluations, totalEval, avgScore, completed, uniqueEmployees, deptBreakdown }: Props) {
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const excellent = evaluations.filter((e) => (Number(e.score) || 0) >= 80).length;
  const good = evaluations.filter((e) => { const s = Number(e.score) || 0; return s >= 60 && s < 80; }).length;
  const needsImprove = evaluations.filter((e) => { const s = Number(e.score) || 0; return s > 0 && s < 60; }).length;
  const totalScored = excellent + good + needsImprove || 1;

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting("excel");
    try {
      const rows = evaluations.map((e) => {
        const emp = e.karyawan as Record<string, string> | undefined;
        return {
          "Nama Karyawan": emp?.full_name || "-",
          "Departemen": emp?.department || "-",
          "Jabatan": emp?.position || "-",
          "Skor": e.score != null ? Number(e.score) : "-",
          "Status": (e.status as string) || "-",
        };
      });
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Kinerja");
      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Laporan-Kinerja-${stamp}.xlsx`);
    } catch (e) {
      console.error("[performance/reports] export excel error:", e);
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
      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "px", format: [img.width, img.height],
      });
      pdf.addImage(img, "PNG", 0, 0, img.width, img.height);
      const stamp = new Date().toISOString().slice(0, 10);
      pdf.save(`Laporan-Kinerja-${stamp}.pdf`);
    } catch (e) {
      console.error("[performance/reports] export pdf error:", e);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Kinerja</h1>
          <p className="text-sm text-gray-500">Ringkasan dan analisis performa seluruh karyawan.</p>
          <p className="text-xs text-slate-400 mt-1">Dihitung dari seluruh {totalEval.toLocaleString("id-ID")} data evaluasi (tidak dibatasi jumlah baris).</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} disabled={!!exporting}
            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
            <FileSpreadsheet size={14} /> {exporting === "excel" ? "Mengekspor..." : "Excel"}
          </button>
          <button onClick={handleExportPDF} disabled={!!exporting}
            className="px-4 py-2 bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
            <FileDown size={14} /> {exporting === "pdf" ? "Mengekspor..." : "PDF"}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-8 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Evaluasi</p>
                <p className="text-xl font-extrabold text-slate-800">{totalEval}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Skor</p>
                <p className="text-xl font-extrabold text-slate-800">{avgScore.toFixed(1)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Award size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Review Selesai</p>
                <p className="text-xl font-extrabold text-slate-800">{completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Users size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Karyawan Dinilai</p>
                <p className="text-xl font-extrabold text-slate-800">{uniqueEmployees}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Building size={16} className="text-pgp-red" />
                Perbandingan Skor per Departemen
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Rata-rata skor KPI berdasarkan departemen</p>
            </div>

            <div className="p-6">
              {deptBreakdown.length === 0 ? (
                <EmptyState icon={Target} title="Belum ada data evaluasi." />
              ) : (
                <RankedBar
                  data={deptBreakdown.map((data) => ({
                    label: data.dept,
                    value: Math.round(data.avg),
                    color: data.avg >= 80 ? "var(--chart-status-good)" : data.avg >= 60 ? "var(--chart-status-warning)" : "var(--chart-status-critical)",
                  }))}
                  height={deptBreakdown.length * 44}
                  barLabel="Rata-rata Skor"
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  Distribusi Skor
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Kategori performa karyawan</p>
              </div>

              <div className="p-6">
                <RankedBar
                  data={[
                    { label: "Sangat Baik (80-100)", value: excellent, color: "var(--chart-status-good)" },
                    { label: "Baik (60-79)", value: good, color: "var(--chart-status-warning)" },
                    { label: "Perlu Peningkatan (0-59)", value: needsImprove, color: "var(--chart-status-critical)" },
                  ]}
                  height={180}
                  valueFormatter={(v) => `${v} (${Math.round((v / totalScored) * 100)}%)`}
                  barLabel="Evaluasi"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
              <h4 className="text-sm font-bold mb-2">Ekspor Laporan</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                Unduh laporan kinerja lengkap dalam format PDF atau Excel untuk keperluan rapat manajemen dan audit.
              </p>
              <div className="flex gap-2">
                <button onClick={handleExportPDF} disabled={!!exporting}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                  <Download size={12} /> PDF
                </button>
                <button onClick={handleExportExcel} disabled={!!exporting}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                  <Download size={12} /> Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
