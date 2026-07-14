import { supabaseAdmin } from "@/lib/supabase";
import { getBudayaPerusahaan, getPerformanceFrameworkList } from "@/app/actions/performance-hrd";
import FrameworkClient from "./FrameworkClient";

export default async function PerformanceFrameworkPage() {
  const [{ data: positions }, { data: kpiCatalog }, budaya, frameworks] = await Promise.all([
    supabaseAdmin.from("jabatan").select("id, name, department").order("name"),
    supabaseAdmin.from("kpi_jabatan").select("*").order("urutan", { ascending: true }),
    getBudayaPerusahaan().catch(() => []),
    getPerformanceFrameworkList().catch(() => []),
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Framework Kinerja</h1>
        <p className="text-sm text-gray-500">Konfigurasi KPI Catalog per jabatan, Core Values perusahaan, dan bobot Target Achievement : Culture Achievement — tanpa perlu ubah kode.</p>
      </div>
      <FrameworkClient
        positions={(positions || []) as Array<{ id: string; name: string; department: string | null }>}
        kpiCatalog={(kpiCatalog || []) as Array<{ id: string; jabatan_id: string; nama_kpi: string; source_system: string | null; satuan: string | null; bobot_default: number; aktif: boolean }>}
        budayaList={budaya as Array<{ id: string; kode: string | null; nama: string; deskripsi: string | null; bobot_default: number; indikator: { id: string; deskripsi: string }[] }>}
        frameworks={frameworks as Array<{ id: string; jabatan_id: string | null; ta_weight_pct: number; culture_weight_pct: number; jabatan?: { name: string } | null }>}
      />
    </div>
  );
}
