import { supabaseAdmin } from "@/lib/supabase";
import { getSeparations, getExitReasons } from "@/app/actions/employee-relations";
import SeparationClient from "@/components/hrd/SeparationClient";

export default async function EndOfContractPage() {
  const [rows, exitReasons, { data: employees }] = await Promise.all([
    getSeparations("End of Contract"),
    getExitReasons(),
    supabaseAdmin.from("karyawan").select("id, full_name").neq("status", "Inactive").order("full_name"),
  ]);
  return <SeparationClient type="End of Contract" title="End of Contract" description="Berakhirnya kontrak kerja karyawan." initialRows={rows as never} employees={employees || []} exitReasons={exitReasons as never} />;
}
