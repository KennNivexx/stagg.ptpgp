import { FileText } from "lucide-react";

export default function PageName() {
  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Performance Reports</h1>
      <p className="text-sm text-gray-500 mb-8">Laporan kinerja dan produktivitas.</p>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-sm text-slate-500">Modul ini sedang dalam tahap pengembangan.</p>
        <p className="text-xs text-slate-400 mt-1">Fitur akan segera tersedia.</p>
      </div>
    </div>
  );
}
