import { Target } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";

export default async function OKRPage() {
  await requireRole("hrd", "superadmin", "director", "department_manager");
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">OKR - Objectives & Key Results</h1>
        <p className="text-sm text-gray-500">Manajemen OKR telah diintegrasikan ke dalam Framework Kinerja dan Manajemen KPI.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <Target size={48} className="mx-auto text-orange-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-700 mb-2">OKR Management</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Silakan gunakan menu <strong>Framework Kinerja</strong> dan <strong>Manajemen KPI</strong> untuk mengelola penilaian kinerja karyawan.
          OKR kini menjadi bagian dari sistem penilaian KPI terpadu.
        </p>
      </div>
    </div>
  );
}
