import { supabaseAdmin } from "@/lib/supabase";
import { getOrgStructure } from "@/app/actions/org";
import OrgStructureClient from "./OrgStructureClient";
import type { OrgUnit } from "@/types/org";

// Struktur organisasi harus selalu mencerminkan data karyawan/unit terbaru
// (karyawan baru otomatis muncul di bawah node departemen/jabatannya) —
// jangan cache halaman ini secara statis.
export const dynamic = "force-dynamic";

export default async function OrgStructurePage() {
  const org = await getOrgStructure();

  const { data: employeesData } = await supabaseAdmin
    .from("employees")
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

      <OrgStructureClient orgData={org} employees={employees} />
    </div>
  );
}
