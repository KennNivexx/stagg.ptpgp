"use client";

import { Eye, Download } from "lucide-react";

export default function PayslipActions({ slipId }: { slipId: string }) {
  const handleView = () => {
    window.open(`/api/payslip/${slipId}`, "_blank");
  };

  const handleDownload = () => {
    window.open(`/api/payslip/${slipId}`, "_blank");
  };

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={handleView}
        className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
      >
        <Eye size={11} /> Lihat
      </button>
      <button
        onClick={handleDownload}
        className="px-3 py-1.5 text-[10px] font-bold bg-[#0F172A] text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
      >
        <Download size={11} /> Unduh PDF
      </button>
    </div>
  );
}
