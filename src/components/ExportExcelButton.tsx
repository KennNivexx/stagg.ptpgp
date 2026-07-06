"use client";

import { FileSpreadsheet } from "lucide-react";

export default function ExportExcelButton({
  rows,
  filename,
  sheetName = "Sheet1",
}: {
  rows: Array<Record<string, unknown>>;
  filename: string;
  sheetName?: string;
}) {
  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return (
    <button
      onClick={handleExport}
      disabled={rows.length === 0}
      className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      title={rows.length === 0 ? "Tidak ada data untuk diekspor" : "Ekspor ke Excel"}
    >
      <FileSpreadsheet size={14} /> Ekspor Excel
    </button>
  );
}
