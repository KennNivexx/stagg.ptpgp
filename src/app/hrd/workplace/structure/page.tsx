import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { getOrgStructure } from "@/app/actions/org";
import { getStrukturSyncStatus } from "@/app/actions/org-sk";
import OrgStructureClient from "./OrgStructureClient";
import type { OrgUnit } from "@/types/org";
import { ShieldCheck, AlertTriangle } from "lucide-react";

// Struktur organisasi harus selalu mencerminkan data karyawan/unit terbaru
// (karyawan baru otomatis muncul di bawah node departemen/jabatannya) —
// jangan cache halaman ini secara statis.
export const dynamic = "force-dynamic";

export default async function OrgStructurePage() {
  await requireRole("hrd", "superadmin");
  const org = await getOrgStructure();
  const syncStatus = await getStrukturSyncStatus();

  const { data: employeesData } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, email, position, department")
    .order("full_name");

  const employees = employeesData || [];

  function countUnits(list: OrgUnit[]): number {
    let n = list.length;
    for (const u of list) n += countUnits(u.children);
    return n;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-1">Struktur Organisasi</h1>
        <p className="text-sm text-gray-500">
          PT Pratama Galuh Perkasa &mdash; {countUnits(org)} unit kerja terdaftar
        </p>
      </div>

      {syncStatus.hasApprovedVersion && (
        syncStatus.inSync ? (
          <div className="flex items-center gap-2 p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-semibold">
            <ShieldCheck size={15} className="shrink-0" /> Struktur sesuai SK {syncStatus.approvedVersionNomorSk} ({syncStatus.approvedVersionName}).
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold">
            <AlertTriangle size={15} className="shrink-0" /> Struktur sudah berbeda dari SK {syncStatus.approvedVersionNomorSk} ({syncStatus.approvedVersionName}) yang terakhir disetujui. Lihat halaman Struktur Organisasi (SK) untuk membuat versi baru bila perlu.
          </div>
        )
      )}

      <OrgStructureClient orgData={org} employees={employees} />
    </div>
  );
}
