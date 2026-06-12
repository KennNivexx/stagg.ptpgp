import { supabaseAdmin } from "@/lib/supabase";
import OrgStructureClient from "./OrgStructureClient";

interface OrgUnit {
  id: string;
  code: string;
  name: string;
  level: number;
  leader_name: string;
  leader_email: string;
  children: OrgUnit[];
}

export default async function OrgStructurePage() {
  // 1. Fetch settings from DB
  const { data: settingsData } = await supabaseAdmin
    .from("employees")
    .select("address")
    .eq("email", "__settings__@ptpgp.co.id")
    .single();

  let org: OrgUnit[] = [];
  try {
    org = JSON.parse((settingsData?.address as string) || "{}").org_structure || [];
  } catch {}

  // 2. Fetch employee master data to map active staff to their departments
  const { data: employeesData } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, email, position, department")
    .order("full_name");

  const employees = employeesData || [];

  // 3. Helper to count total active units
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
