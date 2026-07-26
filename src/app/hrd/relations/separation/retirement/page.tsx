import { supabaseAdmin } from "@/lib/supabase";
import { getSeparations, getExitReasons } from "@/app/actions/employee-relations";
import SeparationClient from "@/components/hrd/SeparationClient";

export default async function RetirementPage() {
  const [rows, exitReasons, { data: employees }] = await Promise.all([
    getSeparations("Retirement"),
    getExitReasons(),
    supabaseAdmin.from("karyawan").select("id, full_name, kode_jabatan, nik, department, position").neq("status", "Inactive").order("full_name"),
  ]);
  return <SeparationClient type="Retirement" title="Retirement" description="Pengajuan pensiun karyawan." initialRows={rows as never} employees={employees || []} exitReasons={exitReasons as never} />;
}
