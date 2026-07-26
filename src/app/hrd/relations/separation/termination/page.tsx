import { supabaseAdmin } from "@/lib/supabase";
import { getSeparations, getExitReasons } from "@/app/actions/employee-relations";
import SeparationClient from "@/components/hrd/SeparationClient";

export default async function TerminationPage() {
  const [rows, exitReasons, { data: employees }] = await Promise.all([
    getSeparations("Termination"),
    getExitReasons(),
    supabaseAdmin.from("karyawan").select("id, full_name, kode_jabatan, nik, department, position").neq("status", "Inactive").order("full_name"),
  ]);
  return <SeparationClient type="Termination" title="Termination (PHK)" description="Pemutusan hubungan kerja oleh perusahaan." initialRows={rows as never} employees={employees || []} exitReasons={exitReasons as never} />;
}
