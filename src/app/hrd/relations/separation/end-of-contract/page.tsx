import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { getSeparations, getExitReasons } from "@/app/actions/employee-relations";
import SeparationClient from "@/components/hrd/SeparationClient";

export default async function EndOfContractPage() {
  await requireRole("hrd", "superadmin");
  const [rows, exitReasons, { data: employees }] = await Promise.all([
    getSeparations("End of Contract"),
    getExitReasons(),
    supabaseAdmin.from("karyawan").select("id, full_name, kode_jabatan, nik, department, position").neq("status", "Inactive").order("full_name"),
  ]);
  return <SeparationClient type="End of Contract" title="End of Contract" description="Berakhirnya kontrak kerja karyawan." initialRows={rows as never} employees={employees || []} exitReasons={exitReasons as never} />;
}
